I now have a complete picture of the system. Here is the architecture design.

---

## ARQUITECTURA: FLUJO DE DATOS CONTINUO M1-M5

Tras analizar el codebase completo de UMCE.online (server.js ~6400 lineas, 12 schemas SQL, 26 paginas HTML, sct-data.json con 37 actividades en 7 categorias, y las tablas existentes en schema `portal`), aqui va el diseno concreto.

---

### DIAGRAMA DE FLUJO DE DATOS

```
M1 CALCULADORA SCT          M2 PAC/UGCI           M3 PLANIFICADOR         M4 IMPLEMENTACION           M5 QA RUBRICA
==================          ===========           ===============         =================           ==============
                                                                                                      
[/virtualizacion/sct]        (externo)        [/virtualizacion/          [PIAC + Moodle]             [/virtualizacion/qa]
                                               planificador]                                          
 INPUT:                                                                                               
 - creditos_sct              PAC aprobado      INPUT:                    INPUT:                       INPUT:
 - perfil_estudiante         por UGCI           - sct_plan_id (FK!)      - piac_link_id (existe)      - piac_link_id
 - formato (sem/mod/micro)   (fuera sistema)   - actividades[]           - moodle_snapshot            - design_plan_id
 - HP, HA, NS                                   - semana_asignacion[]     - piac_parsed                - moodle_snapshot_id
 - encuesta_docente                                                                                   
                                                                                                      
 OUTPUT:                                        OUTPUT:                   OUTPUT:                      OUTPUT:
 - sct_result_json           ............>     - design_plan_json         - matching_results (existe)  - qa_evaluation_json
 - validacion_json                              - weekly_load_json         - discrepancies (existe)     - scores por dimension
 - recomendaciones                              - checklist_pedagogico     - cache_* (existe)           - planificado_vs_real
                                                                                                       - recomendaciones
         |                                              |                          |                          |
         v                                              v                          v                          v
  [portal.sct_plans]                          [portal.design_plans]      (tablas existentes)        [portal.qa_evaluations]
  [portal.sct_plan_activities]                [portal.design_plan_weeks]                            [portal.qa_scores]
                                              [portal.design_plan_items]                            [portal.qa_cross_validations]
         |                                              |                          |                          |
         |______________________________________________|__________________________|__________________________|
                                               |
                                               v
                                    [portal.virtualization_flows]
                                    (registro central que une M1-M5)
                                               |
                                               v
                                    [Espacio estudiante: /curso-virtual/:linkId]
                                    - Progreso vs carga planificada
                                    - Actividades con tiempo estimado (de M3)
                                    - Score QA del curso (de M5)

RETROALIMENTACION M5 -> M1:
  qa_evaluations.recommendations_json --> sct_plans (siguiente ciclo)
  "Coherencia didactica baja" --> recalcular distribucion horas
  "Sobrecarga detectada" --> ajustar HP/HA en M1
```

---

### 1. SCHEMA SQL - TABLAS NUEVAS

```sql
-- =============================================================================
-- schema-virtualization-flow.sql
-- Flujo continuo M1-M5 de virtualizacion
-- Supabase Self-Hosted (supabase.udfv.cloud) -- schema portal
-- =============================================================================

-- ---------------------------------------------------------------------------
-- M1: SCT PLANS -- resultado persistido de la Calculadora SCT
-- Hoy: la calculadora es 100% client-side, no guarda nada. Esta tabla persiste.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.sct_plans (
    id                  SERIAL PRIMARY KEY,
    
    -- Vinculo opcional a un piac_link (se enlaza cuando existe)
    piac_link_id        INT REFERENCES portal.piac_links(id) ON DELETE SET NULL,
    
    -- Quien creo este plan
    created_by          TEXT NOT NULL,               -- email @umce.cl
    
    -- Datos de entrada M1
    course_name         TEXT,
    program_id          INT REFERENCES portal.programs(id) ON DELETE SET NULL,
    creditos_sct        INT NOT NULL,
    formato             TEXT NOT NULL CHECK (formato IN ('semestral', 'modulo', 'microcredencial', 'cuech')),
    perfil_estudiante   TEXT NOT NULL CHECK (perfil_estudiante IN ('pregrado', 'postgrado', 'continua')),
    semanas             INT NOT NULL,
    hp_semanal          NUMERIC(5,1) NOT NULL,       -- horas presenciales/sincronicas por semana
    ha_semanal          NUMERIC(5,1) NOT NULL,       -- horas autonomas por semana
    
    -- Encuesta docente (desglose por tipo de actividad)
    encuesta_json       JSONB,
    -- Formato: { "clases_sincronicas": 2.0, "lecturas": 1.5, "foros": 0.5, ... }
    
    -- Resultado del calculo
    total_horas         NUMERIC(6,1) NOT NULL,       -- (HP+HA)*NS
    sct_calculado       INT NOT NULL,                -- ceil(total_horas / 27)
    sct_declarado       INT NOT NULL,                -- lo que dice la resolucion
    validacion_json     JSONB NOT NULL,
    -- Formato: {
    --   "consistencia_sct": "ok"|"warning"|"error",
    --   "carga_semanal": "adecuado"|"alto"|"sobrecarga",
    --   "ratio_sync_async": 0.3,
    --   "recomendaciones": ["texto1", "texto2"]
    -- }
    
    -- Estado
    status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'approved', 'archived')),
    validated_at        TIMESTAMPTZ,
    validated_by        TEXT,
    
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- M3: DESIGN PLANS -- planificacion curricular persistida
-- Hoy: el planificador es 100% client-side (addedActivities[] en RAM).
-- Esta tabla persiste el diseno completo.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.design_plans (
    id                  SERIAL PRIMARY KEY,
    
    -- FK al plan SCT que origino este diseno
    sct_plan_id         INT REFERENCES portal.sct_plans(id) ON DELETE SET NULL,
    
    -- FK al piac_link (cuando se conecta al curso Moodle)
    piac_link_id        INT REFERENCES portal.piac_links(id) ON DELETE SET NULL,
    
    -- Metadatos
    created_by          TEXT NOT NULL,
    version             INT NOT NULL DEFAULT 1,
    course_name         TEXT,
    
    -- Resumen del diseno
    total_actividades   INT NOT NULL DEFAULT 0,
    total_minutos       INT NOT NULL DEFAULT 0,
    total_horas_plan    NUMERIC(6,1) NOT NULL DEFAULT 0,
    horas_budget        NUMERIC(6,1) NOT NULL,       -- viene de sct_plans.total_horas
    
    -- Checklist pedagogico (resultado de las validaciones del planificador)
    checklist_json      JSONB NOT NULL DEFAULT '{}',
    -- Formato: {
    --   "tiene_interaccion": true,
    --   "tiene_colaboracion": false,
    --   "tiene_reflexion": true,
    --   "tiene_evaluacion_formativa": true,
    --   "carga_equilibrada": true,
    --   "ratio_contenido_actividad": 0.35,
    --   "semaforo": "verde"|"amarillo"|"rojo"
    -- }
    
    -- Distribucion por categoria (snapshot)
    distribucion_json   JSONB NOT NULL DEFAULT '{}',
    -- Formato: { "EA": 120, "EB": 180, "EC": 360, "ED": 90, "EE": 60, "IN": 240, "EV": 150 }
    -- (valores en minutos)
    
    -- Estado
    status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'archived')),
    finalized_at        TIMESTAMPTZ,
    
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- M3: DESIGN PLAN ITEMS -- cada actividad individual del plan
-- Cada fila = una entrada de addedActivities[] del planificador
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.design_plan_items (
    id                  SERIAL PRIMARY KEY,
    design_plan_id      INT NOT NULL REFERENCES portal.design_plans(id) ON DELETE CASCADE,
    
    -- Referencia al catalogo de actividades (sct-data.json)
    act_catalog_id      TEXT NOT NULL,               -- ej: "EC3", "EV5", "IN1"
    categoria           TEXT NOT NULL,               -- ej: "EC", "EV", "IN"
    nombre              TEXT NOT NULL,               -- ej: "Sesion sincronica (clase en vivo)"
    
    -- Configuracion del DI
    cantidad            INT NOT NULL DEFAULT 1,      -- cuantas veces en el curso
    tiempo_unitario     INT NOT NULL,                -- minutos por unidad
    subtotal_minutos    INT NOT NULL,                -- cantidad * tiempo_unitario
    
    -- Asignacion semanal (opcional, M3 avanzado)
    semana_inicio       INT,                         -- semana donde empieza
    semana_fin          INT,                         -- semana donde termina
    recurrente          BOOLEAN DEFAULT false,       -- se repite cada semana en el rango
    
    -- Herramientas sugeridas
    herramientas        TEXT,                        -- del catalogo
    
    -- Metadata
    notas_di            TEXT,                        -- notas del disenador instruccional
    orden               INT DEFAULT 0,
    
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- M3: DESIGN PLAN WEEKS -- carga semanal planificada
-- Se genera automaticamente al distribuir actividades por semana
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.design_plan_weeks (
    id                  SERIAL PRIMARY KEY,
    design_plan_id      INT NOT NULL REFERENCES portal.design_plans(id) ON DELETE CASCADE,
    semana              INT NOT NULL,
    
    -- Minutos por tipo
    minutos_sincronicos INT DEFAULT 0,
    minutos_asincronicos INT DEFAULT 0,
    minutos_autonomos   INT DEFAULT 0,
    minutos_total       INT DEFAULT 0,
    
    -- Actividades de esta semana (array de design_plan_items.id)
    items_ids           INT[],
    
    -- Validacion
    sobrecarga          BOOLEAN DEFAULT false,       -- total > carga_semanal_maxima
    subcarga            BOOLEAN DEFAULT false,       -- total < 50% carga esperada
    
    UNIQUE(design_plan_id, semana)
);

-- ---------------------------------------------------------------------------
-- M5: QA EVALUATIONS -- evaluacion QA de un curso
-- Hoy: la rubrica es solo frontend (virtualizacion-rubrica.html con datos hardcoded).
-- Esta tabla persiste evaluaciones reales.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.qa_evaluations (
    id                  SERIAL PRIMARY KEY,
    
    -- Que curso se evalua
    piac_link_id        INT NOT NULL REFERENCES portal.piac_links(id) ON DELETE CASCADE,
    
    -- Que plan de diseno tenia (para comparar planificado vs implementado)
    design_plan_id      INT REFERENCES portal.design_plans(id) ON DELETE SET NULL,
    
    -- Que snapshot de Moodle se evaluo
    moodle_snapshot_id  INT REFERENCES portal.moodle_snapshots(id) ON DELETE SET NULL,
    
    -- Quien evaluo
    evaluator_email     TEXT NOT NULL,
    evaluation_type     TEXT NOT NULL CHECK (evaluation_type IN ('manual', 'auto_ia', 'mixta')),
    
    -- Resultado global
    score_global        NUMERIC(4,1),                -- 0-100
    nivel_global        TEXT CHECK (nivel_global IN ('insuficiente', 'basico', 'competente', 'destacado')),
    
    -- Scores por dimension (6 dimensiones, 77 indicadores)
    scores_json         JSONB NOT NULL,
    -- Formato: {
    --   "experiencia_plataforma": { "score": 85, "nivel": "competente", "indicadores_cumplidos": 12, "indicadores_total": 15 },
    --   "accesibilidad": { "score": 60, "nivel": "basico", ... },
    --   "coherencia_didactica": { "score": 90, "nivel": "destacado", ... },
    --   "competencias_docente": { "score": 75, "nivel": "competente", ... },
    --   "genero": { "score": 50, "nivel": "insuficiente", ... },
    --   "corresponsabilidad": { "score": 80, "nivel": "competente", ... }
    -- }
    
    -- Recomendaciones generadas
    recommendations_json JSONB DEFAULT '[]',
    -- Formato: [
    --   { "dimension": "accesibilidad", "prioridad": "alta", "texto": "Agregar alt text a 12 imagenes", "accionable": true },
    --   { "dimension": "coherencia_didactica", "prioridad": "media", "texto": "2 nucleos sin evaluacion formativa" }
    -- ]
    
    -- Estado
    status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at        TIMESTAMPTZ,
    
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- M5: QA SCORES -- detalle por indicador individual (77 filas por evaluacion)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.qa_scores (
    id                  SERIAL PRIMARY KEY,
    qa_evaluation_id    INT NOT NULL REFERENCES portal.qa_evaluations(id) ON DELETE CASCADE,
    
    dimension           TEXT NOT NULL,                -- ej: "experiencia_plataforma"
    indicador_codigo    TEXT NOT NULL,                -- ej: "EP-01", "AC-05"
    indicador_texto     TEXT NOT NULL,                -- texto del indicador
    
    -- Resultado
    cumple              BOOLEAN,                     -- null = no evaluado
    score               NUMERIC(3,1),                -- 0-4 (escala likert) o null si boolean
    evidencia           TEXT,                         -- descripcion de la evidencia encontrada
    fuente              TEXT CHECK (fuente IN ('moodle_api', 'observacion_manual', 'ia_auto', 'piac_parsed')),
    
    -- Relacion con M3 (si aplica)
    design_plan_item_id INT REFERENCES portal.design_plan_items(id) ON DELETE SET NULL,
    
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- M5->M1: QA CROSS VALIDATIONS -- comparacion planificado vs implementado vs evaluado
-- Este es el CIERRE DEL CICLO: conecta M3 (planificado) con M4 (implementado) con M5 (evaluado)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.qa_cross_validations (
    id                  SERIAL PRIMARY KEY,
    qa_evaluation_id    INT NOT NULL REFERENCES portal.qa_evaluations(id) ON DELETE CASCADE,
    
    tipo                TEXT NOT NULL CHECK (tipo IN (
        'actividad_planificada_no_implementada',    -- M3 tiene, M4 no tiene
        'actividad_implementada_no_planificada',    -- M4 tiene, M3 no tiene
        'tiempo_desviado',                          -- M3 decia 60min, M4 muestra 120min
        'categoria_faltante',                       -- M3 requeria colaboracion, M4 no tiene
        'sobrecarga_semanal',                       -- M3 planificaba 8h/sem, M4 tiene 14h
        'subcarga_semanal',                         -- M3 planificaba 8h/sem, M4 tiene 3h
        'qa_dimension_baja_por_diseno'              -- score QA bajo explicable por M3
    )),
    
    severidad           TEXT NOT NULL CHECK (severidad IN ('critico', 'advertencia', 'info')),
    
    -- Datos de referencia cruzada
    plan_value          TEXT,                        -- lo que decia M3
    actual_value        TEXT,                        -- lo que muestra M4
    qa_value            TEXT,                        -- lo que evalua M5
    
    descripcion         TEXT NOT NULL,
    recomendacion       TEXT,                        -- recomendacion para el proximo ciclo (M5->M1)
    
    -- Datos para retroalimentar M1
    afecta_sct          BOOLEAN DEFAULT false,       -- si esto implica recalcular SCT
    afecta_distribucion BOOLEAN DEFAULT false,       -- si esto implica redistribuir horas
    
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- FLUJO CENTRAL: VIRTUALIZATION FLOWS -- registro que une M1-M5
-- Un registro por cada ciclo completo de virtualizacion de un curso
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.virtualization_flows (
    id                  SERIAL PRIMARY KEY,
    
    -- Identificacion del curso
    piac_link_id        INT REFERENCES portal.piac_links(id) ON DELETE SET NULL,
    course_name         TEXT NOT NULL,
    moodle_platform     TEXT,
    moodle_course_id    INT,
    
    -- Ciclo (un curso puede tener multiples ciclos: semestre 1, semestre 2, etc.)
    ciclo               INT NOT NULL DEFAULT 1,
    periodo             TEXT,                        -- "2026-1", "2026-2"
    
    -- FKs a cada momento
    sct_plan_id         INT REFERENCES portal.sct_plans(id) ON DELETE SET NULL,
    design_plan_id      INT REFERENCES portal.design_plans(id) ON DELETE SET NULL,
    qa_evaluation_id    INT REFERENCES portal.qa_evaluations(id) ON DELETE SET NULL,
    
    -- Estado de cada momento
    m1_status           TEXT DEFAULT 'pendiente' CHECK (m1_status IN ('pendiente', 'completado', 'requiere_revision')),
    m2_status           TEXT DEFAULT 'pendiente' CHECK (m2_status IN ('pendiente', 'completado', 'requiere_revision')),
    m3_status           TEXT DEFAULT 'pendiente' CHECK (m3_status IN ('pendiente', 'completado', 'requiere_revision')),
    m4_status           TEXT DEFAULT 'pendiente' CHECK (m4_status IN ('pendiente', 'en_construccion', 'publicado', 'requiere_revision')),
    m5_status           TEXT DEFAULT 'pendiente' CHECK (m5_status IN ('pendiente', 'evaluado', 'requiere_revision')),
    
    -- Retroalimentacion M5->M1 (para el siguiente ciclo)
    feedback_json       JSONB,
    -- Formato: {
    --   "recalcular_sct": false,
    --   "redistribuir_horas": true,
    --   "issues_criticos": ["Sobrecarga semana 8-12", "Sin evaluacion formativa nucleo 3"],
    --   "mejoras_sugeridas": ["Reducir sync de 4h a 3h", "Agregar quiz formativo por nucleo"]
    -- }
    
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_sct_plans_piac ON portal.sct_plans (piac_link_id);
CREATE INDEX IF NOT EXISTS idx_sct_plans_creator ON portal.sct_plans (created_by);
CREATE INDEX IF NOT EXISTS idx_sct_plans_status ON portal.sct_plans (status);

CREATE INDEX IF NOT EXISTS idx_design_plans_sct ON portal.design_plans (sct_plan_id);
CREATE INDEX IF NOT EXISTS idx_design_plans_piac ON portal.design_plans (piac_link_id);
CREATE INDEX IF NOT EXISTS idx_design_plans_creator ON portal.design_plans (created_by);
CREATE INDEX IF NOT EXISTS idx_design_plans_status ON portal.design_plans (status);

CREATE INDEX IF NOT EXISTS idx_dpi_plan ON portal.design_plan_items (design_plan_id);
CREATE INDEX IF NOT EXISTS idx_dpi_catalog ON portal.design_plan_items (act_catalog_id);
CREATE INDEX IF NOT EXISTS idx_dpi_cat ON portal.design_plan_items (categoria);

CREATE INDEX IF NOT EXISTS idx_dpw_plan ON portal.design_plan_weeks (design_plan_id);

CREATE INDEX IF NOT EXISTS idx_qa_eval_piac ON portal.qa_evaluations (piac_link_id);
CREATE INDEX IF NOT EXISTS idx_qa_eval_plan ON portal.qa_evaluations (design_plan_id);
CREATE INDEX IF NOT EXISTS idx_qa_eval_status ON portal.qa_evaluations (status);

CREATE INDEX IF NOT EXISTS idx_qa_scores_eval ON portal.qa_scores (qa_evaluation_id);
CREATE INDEX IF NOT EXISTS idx_qa_scores_dim ON portal.qa_scores (dimension);

CREATE INDEX IF NOT EXISTS idx_qa_cross_eval ON portal.qa_cross_validations (qa_evaluation_id);
CREATE INDEX IF NOT EXISTS idx_qa_cross_tipo ON portal.qa_cross_validations (tipo);
CREATE INDEX IF NOT EXISTS idx_qa_cross_sev ON portal.qa_cross_validations (severidad);

CREATE INDEX IF NOT EXISTS idx_vflow_piac ON portal.virtualization_flows (piac_link_id);
CREATE INDEX IF NOT EXISTS idx_vflow_sct ON portal.virtualization_flows (sct_plan_id);
CREATE INDEX IF NOT EXISTS idx_vflow_design ON portal.virtualization_flows (design_plan_id);
CREATE INDEX IF NOT EXISTS idx_vflow_qa ON portal.virtualization_flows (qa_evaluation_id);
CREATE INDEX IF NOT EXISTS idx_vflow_periodo ON portal.virtualization_flows (periodo);

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY (mismo patron que el resto del schema portal)
-- ---------------------------------------------------------------------------
ALTER TABLE portal.sct_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read sct_plans" ON portal.sct_plans FOR SELECT USING (true);
CREATE POLICY "Service write sct_plans" ON portal.sct_plans FOR ALL USING (current_setting('role') = 'service_role');

ALTER TABLE portal.design_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read design_plans" ON portal.design_plans FOR SELECT USING (true);
CREATE POLICY "Service write design_plans" ON portal.design_plans FOR ALL USING (current_setting('role') = 'service_role');

ALTER TABLE portal.design_plan_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read design_plan_items" ON portal.design_plan_items FOR SELECT USING (true);
CREATE POLICY "Service write design_plan_items" ON portal.design_plan_items FOR ALL USING (current_setting('role') = 'service_role');

ALTER TABLE portal.design_plan_weeks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read design_plan_weeks" ON portal.design_plan_weeks FOR SELECT USING (true);
CREATE POLICY "Service write design_plan_weeks" ON portal.design_plan_weeks FOR ALL USING (current_setting('role') = 'service_role');

ALTER TABLE portal.qa_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read qa_evaluations" ON portal.qa_evaluations FOR SELECT USING (true);
CREATE POLICY "Service write qa_evaluations" ON portal.qa_evaluations FOR ALL USING (current_setting('role') = 'service_role');

ALTER TABLE portal.qa_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read qa_scores" ON portal.qa_scores FOR SELECT USING (true);
CREATE POLICY "Service write qa_scores" ON portal.qa_scores FOR ALL USING (current_setting('role') = 'service_role');

ALTER TABLE portal.qa_cross_validations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read qa_cross_validations" ON portal.qa_cross_validations FOR SELECT USING (true);
CREATE POLICY "Service write qa_cross_validations" ON portal.qa_cross_validations FOR ALL USING (current_setting('role') = 'service_role');

ALTER TABLE portal.virtualization_flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read virtualization_flows" ON portal.virtualization_flows FOR SELECT USING (true);
CREATE POLICY "Service write virtualization_flows" ON portal.virtualization_flows FOR ALL USING (current_setting('role') = 'service_role');

-- ---------------------------------------------------------------------------
-- GRANTS
-- ---------------------------------------------------------------------------
GRANT SELECT ON portal.sct_plans TO anon, authenticated;
GRANT ALL ON portal.sct_plans TO service_role;
GRANT ALL ON portal.sct_plans_id_seq TO service_role;

GRANT SELECT ON portal.design_plans TO anon, authenticated;
GRANT ALL ON portal.design_plans TO service_role;
GRANT ALL ON portal.design_plans_id_seq TO service_role;

GRANT SELECT ON portal.design_plan_items TO anon, authenticated;
GRANT ALL ON portal.design_plan_items TO service_role;
GRANT ALL ON portal.design_plan_items_id_seq TO service_role;

GRANT SELECT ON portal.design_plan_weeks TO anon, authenticated;
GRANT ALL ON portal.design_plan_weeks TO service_role;
GRANT ALL ON portal.design_plan_weeks_id_seq TO service_role;

GRANT SELECT ON portal.qa_evaluations TO anon, authenticated;
GRANT ALL ON portal.qa_evaluations TO service_role;
GRANT ALL ON portal.qa_evaluations_id_seq TO service_role;

GRANT SELECT ON portal.qa_scores TO anon, authenticated;
GRANT ALL ON portal.qa_scores TO service_role;
GRANT ALL ON portal.qa_scores_id_seq TO service_role;

GRANT SELECT ON portal.qa_cross_validations TO anon, authenticated;
GRANT ALL ON portal.qa_cross_validations TO service_role;
GRANT ALL ON portal.qa_cross_validations_id_seq TO service_role;

GRANT SELECT ON portal.virtualization_flows TO anon, authenticated;
GRANT ALL ON portal.virtualization_flows TO service_role;
GRANT ALL ON portal.virtualization_flows_id_seq TO service_role;

-- ---------------------------------------------------------------------------
-- VISTA: resumen del flujo por curso (para dashboard DI)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW portal.v_virtualization_summary AS
SELECT
    vf.id AS flow_id,
    vf.course_name,
    vf.periodo,
    vf.ciclo,
    vf.moodle_platform,
    vf.moodle_course_id,
    -- M1
    vf.m1_status,
    sp.creditos_sct AS m1_creditos,
    sp.total_horas AS m1_horas_total,
    sp.validacion_json->>'consistencia_sct' AS m1_consistencia,
    sp.validacion_json->>'carga_semanal' AS m1_carga,
    -- M3
    vf.m3_status,
    dp.total_actividades AS m3_actividades,
    dp.total_horas_plan AS m3_horas_planificadas,
    dp.horas_budget AS m3_horas_budget,
    dp.checklist_json->>'semaforo' AS m3_semaforo,
    -- M4
    vf.m4_status,
    pl.moodle_platform AS m4_platform,
    ms.activities_count AS m4_actividades_moodle,
    (SELECT COUNT(*) FROM portal.discrepancies d
     JOIN portal.matching_results mr ON d.matching_id = mr.id
     WHERE mr.piac_link_id = vf.piac_link_id AND d.resolved = false) AS m4_discrepancias_abiertas,
    -- M5
    vf.m5_status,
    qe.score_global AS m5_score,
    qe.nivel_global AS m5_nivel,
    (SELECT COUNT(*) FROM portal.qa_cross_validations qcv
     WHERE qcv.qa_evaluation_id = qe.id AND qcv.severidad = 'critico') AS m5_issues_criticos,
    -- Retroalimentacion
    vf.feedback_json
FROM portal.virtualization_flows vf
LEFT JOIN portal.sct_plans sp ON sp.id = vf.sct_plan_id
LEFT JOIN portal.design_plans dp ON dp.id = vf.design_plan_id
LEFT JOIN portal.piac_links pl ON pl.id = vf.piac_link_id
LEFT JOIN portal.moodle_snapshots ms ON ms.piac_link_id = vf.piac_link_id
    AND ms.id = (SELECT MAX(id) FROM portal.moodle_snapshots WHERE piac_link_id = vf.piac_link_id)
LEFT JOIN portal.qa_evaluations qe ON qe.id = vf.qa_evaluation_id;

GRANT SELECT ON portal.v_virtualization_summary TO anon, authenticated, service_role;
```

---

### 2. CONEXIONES ENTRE MOMENTOS -- DATOS EXACTOS QUE FLUYEN

#### CONEXION M1 -> M3 (Calculadora -> Planificador)

**Datos que fluyen:**
| Campo | Tipo | Origen (M1) | Destino (M3) |
|-------|------|-------------|--------------|
| `sct_plan_id` | INT (FK) | `sct_plans.id` | `design_plans.sct_plan_id` |
| `creditos_sct` | INT | `sct_plans.creditos_sct` | Usado para calcular `horas_budget` |
| `total_horas` | NUMERIC | `sct_plans.total_horas` | `design_plans.horas_budget` |
| `semanas` | INT | `sct_plans.semanas` | Numero de semanas del plan |
| `perfil_estudiante` | TEXT | `sct_plans.perfil_estudiante` | Define ratio sync recomendado |
| `formato` | TEXT | `sct_plans.formato` | Ajusta templates de actividades |
| `hp_semanal` | NUMERIC | `sct_plans.hp_semanal` | Techo de horas sincronicas por semana |
| `ha_semanal` | NUMERIC | `sct_plans.ha_semanal` | Techo de horas autonomas por semana |
| `encuesta_json` | JSONB | `sct_plans.encuesta_json` | Pre-llena actividades sugeridas |

**Como se persiste:** FK directa `design_plans.sct_plan_id -> sct_plans.id`.

**Mecanismo:** Cuando el usuario termina M1 y hace click en "Ir al Planificador", el frontend pasa `?sctPlanId=123` como query param. El planificador carga el plan SCT via API y pre-configura creditos, semanas, perfil y horas budget.

#### CONEXION M3 -> M4 (Planificador -> Implementacion PIAC/Moodle)

**Datos que fluyen:**
| Campo | Tipo | Origen (M3) | Destino (M4) |
|-------|------|-------------|--------------|
| `design_plan_id` | INT (FK) | `design_plans.id` | `qa_evaluations.design_plan_id` (para comparacion) |
| `design_plan_items[]` | ARRAY | Items individuales | Referencia para matching |
| `weekly_load` | JSONB | `design_plan_weeks` | Comparacion con carga real Moodle |
| `checklist_json` | JSONB | `design_plans.checklist_json` | Criterios que M5 verifica |

**Como se persiste:** La relacion se establece cuando el DI vincula un PIAC (`piac_links`) y asocia un `design_plan_id`. La tabla `design_plans` tiene `piac_link_id` que la conecta al mismo curso Moodle.

**Mecanismo:** Cuando el DI hace "Analizar" en el panel PIAC (endpoint existente `POST /api/piac/:linkId/analyze`), el motor de matching TAMBIEN consulta `design_plans` via `piac_link_id` y compara las actividades planificadas (M3) contra las actividades encontradas en Moodle (M4).

#### CONEXION M4 -> M5 (Implementacion -> QA)

**Datos que fluyen:**
| Campo | Tipo | Origen (M4) | Destino (M5) |
|-------|------|-------------|--------------|
| `piac_link_id` | INT (FK) | `piac_links.id` | `qa_evaluations.piac_link_id` |
| `moodle_snapshot_id` | INT (FK) | `moodle_snapshots.id` | `qa_evaluations.moodle_snapshot_id` |
| `matching_results` | JSONB | `matching_results.matches_json` | Input para evaluar coherencia |
| `discrepancies` | ARRAY | `discrepancies[]` | Alimenta dimension "coherencia_didactica" |
| `design_plan_id` | INT (FK) | via `piac_link_id` | `qa_evaluations.design_plan_id` |

**Como se persiste:** `qa_evaluations` tiene FK a `piac_link_id`, `design_plan_id`, y `moodle_snapshot_id`.

**Mecanismo:** El sistema QA (`/virtualizacion/qa`) al evaluar un curso:
1. Lee el snapshot Moodle mas reciente
2. Lee el design_plan vinculado (si existe)
3. Lee las discrepancias existentes
4. Evalua 77 indicadores contra estos datos
5. Genera `qa_cross_validations` comparando M3 vs M4 vs M5

#### CONEXION M5 -> M1 (Retroalimentacion al siguiente ciclo)

**Datos que fluyen:**
| Campo | Tipo | Origen (M5) | Destino (M1 siguiente ciclo) |
|-------|------|-------------|------------------------------|
| `feedback_json` | JSONB | `virtualization_flows.feedback_json` | Carga en UI del proximo `sct_plans` |
| `qa_cross_validations[]` | ARRAY | Cross-validaciones con `afecta_sct=true` | Alertas al crear nuevo plan SCT |
| `recommendations_json` | JSONB | `qa_evaluations.recommendations_json` | Sugerencias al DI |

**Como se persiste:** `virtualization_flows.feedback_json` almacena el resumen de retroalimentacion. Al crear un nuevo `sct_plans` para el mismo curso/programa, el sistema carga el feedback del ciclo anterior.

**Mecanismo:** Cuando el DI abre la calculadora SCT para un programa que ya tiene un ciclo completado, la UI muestra un banner: "Ciclo anterior: [issues criticos]. Recomendaciones: [lista]." El DI ve el historico y ajusta.

---

### 3. API ENDPOINTS NUEVOS

#### M1: Persistencia de Calculadora SCT

```
POST /api/sct/plans                        (authMiddleware)
  Body: { creditos_sct, formato, perfil_estudiante, semanas, hp_semanal, ha_semanal, 
          course_name?, program_id?, encuesta_json?, sct_declarado }
  Response: { id, total_horas, sct_calculado, validacion_json, status }
  Logica: calcula total_horas = (hp+ha)*ns, sct = ceil(total/27), genera validacion_json

GET /api/sct/plans                         (authMiddleware)
  Query: ?status=draft&created_by=email
  Response: [{ id, course_name, creditos_sct, status, created_at, ... }]

GET /api/sct/plans/:id                     (authMiddleware)
  Response: { ...plan completo, design_plans: [...], flow: {...} }

PUT /api/sct/plans/:id                     (authMiddleware)
  Body: campos a actualizar
  Response: { ...plan actualizado }

POST /api/sct/plans/:id/validate           (adminOrEditorMiddleware)
  Body: { validated_by }
  Response: { status: 'validated', validated_at }

GET /api/sct/plans/:id/feedback            (authMiddleware)
  Response: { feedback_ciclo_anterior: {...}, cross_validations: [...] }
  Logica: busca virtualization_flows anterior del mismo programa con feedback_json
```

#### M3: Persistencia del Planificador

```
POST /api/design/plans                     (authMiddleware)
  Body: { sct_plan_id?, piac_link_id?, course_name, horas_budget, items: [...] }
  Response: { id, total_actividades, total_minutos, checklist_json, distribucion_json }
  Logica: inserta design_plan + design_plan_items, calcula checklist y distribucion

GET /api/design/plans                      (authMiddleware)
  Query: ?sct_plan_id=X&piac_link_id=Y&status=draft
  Response: [{ id, course_name, total_actividades, checklist_json.semaforo, status }]

GET /api/design/plans/:id                  (authMiddleware)
  Response: { ...plan, items: [...], weeks: [...], sct_plan: {...} }

PUT /api/design/plans/:id                  (authMiddleware)
  Body: { items: [...nuevo array completo...] }
  Response: { ...plan recalculado }
  Logica: reemplaza items, recalcula totales/checklist/distribucion

POST /api/design/plans/:id/finalize        (adminOrEditorMiddleware)
  Response: { status: 'finalized', finalized_at }

POST /api/design/plans/:id/distribute      (authMiddleware)
  Body: { distribution: [{ semana: 1, item_ids: [1,2,3] }, ...] }
  Response: { weeks: [...design_plan_weeks generadas...] }
  Logica: crea/reemplaza design_plan_weeks, calcula minutos por tipo, detecta sobrecarga

GET /api/design/plans/:id/compare          (authMiddleware)
  Response: { planificado: {...}, implementado: {...}, diferencias: [...] }
  Logica: compara design_plan_items vs moodle_snapshot (si hay piac_link_id vinculado)
```

#### M5: Evaluacion QA

```
POST /api/qa/evaluations                   (adminOrEditorMiddleware)
  Body: { piac_link_id, evaluation_type }
  Response: { id, scores_json (pre-calculado por IA), recommendations_json }
  Logica:
    1. Lee moodle_snapshot mas reciente del piac_link
    2. Lee design_plan vinculado (si existe)
    3. Lee discrepancies existentes
    4. Evalua indicadores automaticos (visibilidad secciones, alt text, fechas, foros)
    5. Genera scores por dimension
    6. Genera qa_cross_validations comparando M3 vs M4
    7. Genera recommendations

GET /api/qa/evaluations                    (adminOrEditorMiddleware)
  Query: ?piac_link_id=X&status=published
  Response: [{ id, score_global, nivel_global, status, created_at }]

GET /api/qa/evaluations/:id                (authMiddleware)
  Response: { ...evaluacion, scores: [...77 qa_scores...], cross_validations: [...], recommendations }

PUT /api/qa/evaluations/:id/scores         (adminOrEditorMiddleware)
  Body: { scores: [{ indicador_codigo, cumple, score, evidencia }] }
  Response: { ...scores actualizados, score_global recalculado }
  Logica: permite al evaluador manual ajustar scores de indicadores que la IA no puede evaluar

POST /api/qa/evaluations/:id/publish       (adminOrEditorMiddleware)
  Response: { status: 'published', published_at }

GET /api/qa/evaluations/:id/cross          (authMiddleware)
  Response: { cross_validations: [...], summary: { criticos: N, advertencias: N } }
```

#### Flujo Central

```
POST /api/flows                            (adminOrEditorMiddleware)
  Body: { piac_link_id?, course_name, moodle_platform?, moodle_course_id?, periodo? }
  Response: { id, m1_status, m2_status, m3_status, m4_status, m5_status }

GET /api/flows                             (adminOrEditorMiddleware)
  Query: ?periodo=2026-1&moodle_platform=virtual
  Response: [{ ...v_virtualization_summary rows }]

GET /api/flows/:id                         (authMiddleware)
  Response: { ...flow completo con datos de cada momento }

PUT /api/flows/:id                         (adminOrEditorMiddleware)
  Body: { sct_plan_id?, design_plan_id?, qa_evaluation_id?, m1_status?, ... }
  Response: { ...flow actualizado }
  Logica: al vincular un nuevo qa_evaluation_id, auto-genera feedback_json

POST /api/flows/:id/close-cycle            (adminOrEditorMiddleware)
  Response: { feedback_json generado, next_cycle_recommendations }
  Logica:
    1. Recopila qa_cross_validations
    2. Filtra los que afectan SCT o distribucion
    3. Genera feedback_json condensado
    4. Crea notificacion al DI
```

---

### 4. VALIDACIONES CRUZADAS (M3 planificado vs M4 implementado vs M5 evaluado)

El motor de cross-validation se ejecuta como parte de `POST /api/qa/evaluations`. Aqui estan las validaciones concretas:

```javascript
// Pseudo-codigo del motor de cross-validation
// Se ejecuta en server.js como parte de la evaluacion QA

function generateCrossValidations(designPlan, moodleSnapshot, qaScores) {
  const validations = [];
  
  // 1. ACTIVIDADES PLANIFICADAS NO IMPLEMENTADAS
  // Recorre design_plan_items y busca match en moodle_snapshot.sections[].modules[]
  for (const item of designPlan.items) {
    const matchInMoodle = findActivityInMoodle(item, moodleSnapshot);
    if (!matchInMoodle) {
      validations.push({
        tipo: 'actividad_planificada_no_implementada',
        severidad: item.categoria === 'EV' ? 'critico' : 'advertencia',
        plan_value: `${item.nombre} (${item.categoria}, ${item.subtotal_minutos}min)`,
        actual_value: null,
        descripcion: `La actividad "${item.nombre}" fue planificada en M3 pero no existe en Moodle.`,
        recomendacion: `Agregar ${item.nombre} al curso o actualizar el plan de diseno.`,
        afecta_sct: false,
        afecta_distribucion: true
      });
    }
  }
  
  // 2. ACTIVIDADES IMPLEMENTADAS NO PLANIFICADAS
  for (const section of moodleSnapshot.sections) {
    for (const mod of section.modules) {
      const matchInPlan = findModuleInPlan(mod, designPlan.items);
      if (!matchInPlan && mod.modname !== 'label') {
        validations.push({
          tipo: 'actividad_implementada_no_planificada',
          severidad: 'info',
          plan_value: null,
          actual_value: `${mod.name} (${mod.modname}, seccion ${section.number})`,
          descripcion: `"${mod.name}" existe en Moodle pero no fue planificada en M3.`
        });
      }
    }
  }
  
  // 3. CATEGORIAS FALTANTES (checklist pedagogico)
  const categoriasEnPlan = new Set(designPlan.items.map(i => i.categoria));
  const categoriasEnMoodle = inferCategoriasFromMoodle(moodleSnapshot);
  
  if (categoriasEnPlan.has('EC') && !categoriasEnMoodle.has('EC')) {
    validations.push({
      tipo: 'categoria_faltante',
      severidad: 'critico',
      plan_value: 'Interaccion (EC) planificada',
      actual_value: 'Sin foros ni sesiones sincronicas detectadas en Moodle',
      descripcion: 'El plan incluia actividades de interaccion pero el curso no tiene foros ni Zoom.',
      recomendacion: 'Agregar al menos un foro de discusion y vincular las sesiones sincronicas.',
      afecta_sct: false,
      afecta_distribucion: true
    });
  }
  
  // 4. SOBRECARGA/SUBCARGA SEMANAL
  if (designPlan.weeks && designPlan.weeks.length > 0) {
    const moodleWeeklyLoad = estimateWeeklyLoadFromMoodle(moodleSnapshot);
    for (const week of designPlan.weeks) {
      const moodleWeek = moodleWeeklyLoad[week.semana];
      if (moodleWeek && moodleWeek.total > week.minutos_total * 1.5) {
        validations.push({
          tipo: 'sobrecarga_semanal',
          severidad: 'critico',
          plan_value: `Semana ${week.semana}: ${week.minutos_total}min planificados`,
          actual_value: `Semana ${week.semana}: ${moodleWeek.total}min estimados en Moodle`,
          recomendacion: 'Redistribuir actividades o reducir carga de esta semana.',
          afecta_sct: true,
          afecta_distribucion: true
        });
      }
    }
  }
  
  // 5. QA DIMENSION BAJA EXPLICABLE POR DISENO
  if (qaScores.coherencia_didactica?.score < 60 && !categoriasEnPlan.has('EE')) {
    validations.push({
      tipo: 'qa_dimension_baja_por_diseno',
      severidad: 'advertencia',
      plan_value: 'Sin actividades de reflexion (EE) en M3',
      qa_value: `Coherencia didactica: ${qaScores.coherencia_didactica.score}/100`,
      descripcion: 'Score bajo en coherencia didactica correlacionado con ausencia de reflexion en el diseno.',
      recomendacion: 'Incluir diarios reflexivos o portafolios en el proximo ciclo.',
      afecta_distribucion: true
    });
  }
  
  return validations;
}
```

---

### 5. COMO EL ESPACIO DEL ESTUDIANTE SE ALIMENTA DE ESTE FLUJO

El endpoint existente `GET /api/curso-virtual/:linkId` (server.js linea ~4606) se extiende para incluir datos del flujo:

```javascript
// Extension al endpoint existente /api/curso-virtual/:linkId
// Dentro del objeto de respuesta, agregar:

{
  // ... datos existentes (nucleos, personal, recordings, calendar, etc.)
  
  // NUEVO: datos del flujo de virtualizacion
  "flow": {
    "has_design_plan": true,
    "design_plan_id": 42,
    
    // Tiempo estimado por actividad (viene de M3 design_plan_items)
    // Se inyecta en cada modulo del nucleo
    "activity_times": {
      "cmid_1234": { "tiempo_estimado_min": 45, "categoria": "EC", "tipo": "Sesion sincronica" },
      "cmid_1235": { "tiempo_estimado_min": 30, "categoria": "IN", "tipo": "Lectura academica" },
      // ... por cada cmid vinculado
    },
    
    // Carga semanal planificada vs real (para barra de progreso contextual)
    "weekly_load": {
      "1": { "planificado_min": 480, "categorias": { "EC": 120, "IN": 180, "EV": 60, "EA": 120 } },
      "2": { "planificado_min": 420, "categorias": { "EC": 120, "IN": 120, "EB": 180 } }
    },
    
    // Score QA del curso (si esta publicado)
    "qa": {
      "score_global": 82,
      "nivel": "competente",
      "badge_color": "#059669",
      "dimensions_summary": [
        { "nombre": "Experiencia plataforma", "score": 85 },
        { "nombre": "Accesibilidad", "score": 60 },
        // ... 6 dimensiones
      ]
    }
  }
}
```

**Como aparece en la UI del estudiante (curso-virtual.html):**

1. **Tiempo estimado por actividad:** Junto a cada actividad en la vista semanal, aparece un badge "~45 min" que viene del `design_plan_items` correspondiente. El estudiante sabe cuanto tiempo le tomara cada cosa.

2. **Barra de carga semanal:** En el sidebar, debajo de la barra de progresion del nucleo, una barra secundaria muestra la distribucion de carga de la semana (coloreada por categoria: azul sync, verde contenido, rojo evaluacion).

3. **Badge QA del curso:** En la seccion "Info" del curso virtual, un badge muestra el score QA global con su nivel. Si el curso fue evaluado, el estudiante ve "Curso evaluado: Competente (82/100)".

---

### 6. RESUMEN DE CAMBIOS POR COMPONENTE

| Componente | Archivo | Cambio |
|------------|---------|--------|
| Schema SQL | `schema-virtualization-flow.sql` (NUEVO) | 8 tablas + 1 vista + indices + RLS + grants |
| Server API | `server.js` | ~18 endpoints nuevos (~400 lineas) |
| Calculadora SCT | `virtualizacion-sct.html` | Boton "Guardar plan" + fetch POST /api/sct/plans + banner feedback ciclo anterior |
| Planificador | `virtualizacion-planificador.html` | Boton "Guardar diseno" + fetch POST /api/design/plans + pre-carga desde sctPlanId + distribucion semanal |
| Panel PIAC | `piac.html` | Seccion "Plan de diseno" que muestra design_plan vinculado + comparacion M3 vs M4 |
| Sistema QA | `virtualizacion-qa.html` | Conectar a API real (POST /api/qa/evaluations), mostrar cross-validations, boton "Publicar evaluacion" |
| Curso virtual | `curso-virtual.html` | Badges tiempo estimado, barra carga semanal, badge QA |
| Cron | `server.js` (cron existente) | Agregar paso: verificar cross-validations pendientes, generar notificaciones si hay issues criticos |
| sct-data.json | Sin cambios | Se sigue usando como catalogo de actividades para el planificador |

**Tablas nuevas: 8.** Tablas existentes reutilizadas: `piac_links`, `piac_parsed`, `moodle_snapshots`, `matching_results`, `discrepancies`, `notifications`, `programs`, `courses`.

**La clave del diseno:** Cada tabla nueva tiene FK bidireccional al `piac_link_id`, que es el eje central. Un `piac_link` conecta un documento PIAC (Drive) con un curso Moodle. A ese mismo `piac_link` se le asocian el plan SCT, el plan de diseno, y la evaluacion QA. La tabla `virtualization_flows` es el registro maestro que unifica todo el ciclo.