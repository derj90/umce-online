Tengo suficiente contexto del proyecto. Ahora produzco el diseño completo.

---

# Sistema QA como Ciclo de Retroalimentacion Continua M1→M5

## Mapa conceptual del ciclo

```
M1 (SCT/horas)
     ↓
M2 (PIAC Word)  ──→  [PIAC Parser — Fase 2]
     ↓
M3 (Planificador)  ──→  [1] QA PREVENTIVO  ←── 77 indicadores D1-D6
     ↓
M4 (Moodle)  ──→  [2] QA DE RECEPCION  ←── Docente firma conformidad
             ──→  [3] QA DE IMPLEMENTACION  ←── Matching Engine (Fase 2)
     ↓
M5 (Operacion)  ──→  [4] SEGUIMIENTO  ←── Auditor PA.xx + cache Fase 4/5
     ↓
CIERRE  ──→  [5] QA POSTERIOR  ←── Reunion docente / encuesta satisfaccion
     ↓
RETROALIMENTACION  ──→  informe DI/coordinador  ──→  M1 siguiente semestre
```

El sistema QA opera en **cinco fases** que completan el ciclo ADDIE. No es un modulo separado que se activa al final; es la capa analitica que se ejecuta en cinco momentos del flujo y cierra el ciclo al terminar el semestre.

**Cambio 15-Abr-2026 (reunion Marisol Hernandez, DIPOS):**
- La antigua "Fase 3: QA de Operacion" se renombro a "Fase 4: Seguimiento" — segun la SNA, corresponde a seguimiento y acompanamiento, no a QA en sentido estricto.
- Se agrego "Fase 2: QA de Recepcion del Docente" — el academico revisa el curso antes de abrir y firma conformidad.
- Se agrego "Fase 5: QA Posterior a Ejecucion" — la "E" de ADDIE que cierra el ciclo de mejora continua (evidencia CNA).

---

## 1. QA Preventivo (entre M3 y M4)

### Principio

El planificador ya calcula horas SCT, categorias de actividades y balance sincrono/asincrono. El QA preventivo lee ese output y lo cruza contra los 77 indicadores del Marco Evaluativo antes de que el DI o docente empiece a construir el curso en Moodle.

### Mapeando los 6 pilares del planificador a los 77 indicadores

El planificador en `/virtualizacion/planificador` produce un objeto con esta estructura:

```json
{
  "sct": 4,
  "weeks": 16,
  "totalHours": 108,
  "weeklyHours": 6.75,
  "activities": [
    { "category": "sincronico", "name": "Clase en vivo Zoom", "hours": 1.5, "tool": "zoom", "count": 16 },
    { "category": "asincrono-reflexivo", "name": "Foro de reflexion", "hours": 1.0, "tool": "moodle_forum", "count": 8 },
    { "category": "evaluacion", "name": "Tarea escrita", "hours": 3.0, "tool": "moodle_assign", "count": 3 },
    { "category": "contenido-pasivo", "name": "Lectura complementaria", "hours": 0.5, "tool": "pdf", "count": 20 }
  ]
}
```

La tabla de correspondencia entre pilares del planificador y dimensiones QA:

| Pilares del planificador | Dimension QA | Indicadores relevantes |
|--------------------------|--------------|------------------------|
| horas sincronicas / % sobre total | D1 Interaccion + D3 Coherencia | Presencia docente, balance modalidades |
| horas asincronas interactivas (foro, tarea) | D1 Interaccion + D3 Coherencia | Interactividad, participacion colaborativa |
| horas contenido pasivo (pdf, video solo) | D3 Coherencia | Umbral ≤60% pasivo |
| herramienta=moodle_forum con calificacion | D3 Coherencia + D4 Docencia | Foro evaluado con criterios |
| presencia de evaluacion sumativa | D3 Coherencia | Alineamiento evaluativo |
| distribucion de carga semanal | D1 Interaccion | Regularidad, no concentracion |
| herramientas DUA (caption, accesible) | D2 Accesibilidad | Multimodalidad |
| mecanismos de retroalimentacion | D4 Docencia | Tiempos de respuesta esperados |

### Checklist automatico — 8 verificaciones core

Estas se calculan directamente desde el JSON del planificador sin necesidad de Moodle:

```javascript
// server.js — POST /api/qa/preventivo
function qaPreventivo(plannerOutput) {
  const checks = [];
  const acts = plannerOutput.activities;
  const totalHours = plannerOutput.totalHours;

  // QA.P1 — Contenido pasivo no supera 60%
  const horasPasivas = acts
    .filter(a => a.category === 'contenido-pasivo')
    .reduce((s, a) => s + (a.hours * a.count), 0);
  checks.push({
    id: 'QA.P1',
    label: 'Contenido pasivo ≤60% del total',
    dimension: 'D3',
    ok: (horasPasivas / totalHours) <= 0.60,
    value: Math.round((horasPasivas / totalHours) * 100) + '%',
    threshold: '≤60%',
    suggestion: 'Agrega actividades interactivas (foros, tareas, cuestionarios) para bajar el porcentaje de contenido pasivo.'
  });

  // QA.P2 — Hay al menos 1 actividad de interaccion colab
  const tieneColaboracion = acts.some(a =>
    ['asincrono-reflexivo', 'colaborativo'].includes(a.category) &&
    ['moodle_forum', 'moodle_workshop', 'padlet'].includes(a.tool)
  );
  checks.push({
    id: 'QA.P2',
    label: 'Al menos 1 instancia de aprendizaje colaborativo',
    dimension: 'D1',
    ok: tieneColaboracion,
    suggestion: 'Incorpora al menos un foro de reflexion o actividad colaborativa donde los estudiantes interactuen entre si.'
  });

  // QA.P3 — Hay evaluacion formativa (no solo sumativa)
  const tieneFormativa = acts.some(a =>
    a.category === 'evaluacion-formativa' ||
    (a.category === 'evaluacion' && a.formativa === true)
  );
  const tieneSumativa = acts.some(a => a.category === 'evaluacion');
  checks.push({
    id: 'QA.P3',
    label: 'Al menos 1 instancia de evaluacion formativa',
    dimension: 'D3',
    ok: tieneFormativa,
    suggestion: 'Agrega evaluaciones de proceso (autoevaluacion, retroalimentacion anticipada, quiz de seguimiento) ademas de las evaluaciones sumativas.'
  });

  // QA.P4 — Hay al menos 1 evaluacion sumativa
  checks.push({
    id: 'QA.P4',
    label: 'Al menos 1 evaluacion sumativa configurada',
    dimension: 'D3',
    ok: tieneSumativa,
    suggestion: 'El curso necesita instancias donde los estudiantes demuestren su aprendizaje con calificacion.'
  });

  // QA.P5 — Balance sincrono/asincrono (no mas de 70% en un tipo)
  const horasSincronicas = acts
    .filter(a => a.category === 'sincronico')
    .reduce((s, a) => s + (a.hours * a.count), 0);
  const pctSinc = horasSincronicas / totalHours;
  checks.push({
    id: 'QA.P5',
    label: 'Balance sincrono/asincrono (ninguno >70%)',
    dimension: 'D1 + D3',
    ok: pctSinc <= 0.70 && pctSinc >= 0.10,
    value: Math.round(pctSinc * 100) + '% sincrono',
    suggestion: pctSinc > 0.70
      ? 'El curso es muy dependiente de sesiones en vivo. Agrega mas actividades asincronas para flexibilidad.'
      : 'Considera incluir al menos alguna sesion sincrona para fortalecer la presencia docente.'
  });

  // QA.P6 — Carga semanal dentro del rango SCT
  const horasSemanales = plannerOutput.weeklyHours;
  const margenInf = horasSemanales * 0.80;
  const margenSup = horasSemanales * 1.20;
  const horasRealesPlaneadas = acts.reduce((s, a) => s + (a.hours * a.count), 0) / plannerOutput.weeks;
  checks.push({
    id: 'QA.P6',
    label: 'Carga semanal consistente con SCT declarado',
    dimension: 'D1 + D3',
    ok: horasRealesPlaneadas >= margenInf && horasRealesPlaneadas <= margenSup,
    value: horasRealesPlaneadas.toFixed(1) + 'h/sem planificadas vs ' + horasSemanales.toFixed(1) + 'h/sem SCT',
    suggestion: 'Ajusta la cantidad de actividades para que la carga real planeada coincida con las horas SCT comprometidas.'
  });

  // QA.P7 — Hay retroalimentacion explicita (herramienta de devolucion)
  const tieneRetroalimentacion = acts.some(a =>
    ['moodle_assign', 'moodle_workshop', 'moodle_quiz'].includes(a.tool)
  );
  checks.push({
    id: 'QA.P7',
    label: 'Mecanismo de retroalimentacion para los estudiantes',
    dimension: 'D4',
    ok: tieneRetroalimentacion,
    suggestion: 'Agrega tareas (assign), cuestionarios o talleres (workshop) que permitan al docente dar retroalimentacion individual.'
  });

  // QA.P8 — Multimodalidad basica (no solo PDF o solo video)
  const tiposContenido = new Set(acts.map(a => a.tool));
  const tieneMultimodalidad = tiposContenido.size >= 3;
  checks.push({
    id: 'QA.P8',
    label: 'Multimodalidad de recursos (≥3 tipos diferentes)',
    dimension: 'D2',
    ok: tieneMultimodalidad,
    value: tiposContenido.size + ' tipos de recursos',
    suggestion: 'Diversifica los recursos (video + texto + actividad interactiva) para llegar a estudiantes con distintos estilos de aprendizaje.'
  });

  // Calculo del semaforo
  const pasados = checks.filter(c => c.ok).length;
  const total = checks.length;
  const pct = pasados / total;
  const semaforo = pct >= 0.875 ? 'verde' : pct >= 0.625 ? 'amarillo' : 'rojo';

  return { checks, semaforo, score: pasados, total, readyForM4: semaforo !== 'rojo' };
}
```

### Output: Semaforo de Readiness

El endpoint `POST /api/qa/preventivo` devuelve:

```json
{
  "semaforo": "amarillo",
  "score": 6,
  "total": 8,
  "readyForM4": true,
  "checks": [
    {
      "id": "QA.P3",
      "label": "Al menos 1 instancia de evaluacion formativa",
      "dimension": "D3",
      "ok": false,
      "suggestion": "Agrega evaluaciones de proceso..."
    }
  ],
  "mensaje": "Tu planificacion tiene base solida pero detectamos 2 areas a fortalecer antes de construir el curso.",
  "dimensiones_riesgo": ["D3 Coherencia didactica", "D2 Accesibilidad"]
}
```

La integracion en el planificador es en el Paso 3 (semaforo), que ya existe en la UI. Antes de mostrar el semaforo actual (que solo revisa SCT), se llama a este endpoint y se expande el semaforo con los 8 checks. El boton "Exportar plan" se habilita solo si `readyForM4 === true`.

---

## 2. QA de Recepcion del Docente (entre M4 construccion y apertura)

### Principio

Antes de abrir el curso a estudiantes, el docente que lo dictara revisa el aula virtual y verifica que todos los elementos coincidan con lo acordado en el PIAC. Este paso genera trazabilidad entre la intencion de diseno y la ejecucion real — evidencia clave para CNA.

### Proceso

1. El DI notifica al docente que el curso esta construido en Moodle
2. El docente accede con perfil de estudiante y revisa: estructura, recursos, instrucciones, fechas, rubricas
3. Completa un formulario de conformidad (checklist + observaciones libres)
4. Si tiene observaciones, las registra y el DI las resuelve antes de abrir
5. Si no tiene observaciones, firma y el curso se habilita

### Schema conceptual

```sql
CREATE TABLE portal.qa_recepcion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  piac_link_id UUID REFERENCES portal.piac_links(id),
  docente_email TEXT NOT NULL,
  fecha_revision TIMESTAMPTZ DEFAULT NOW(),
  conformidad BOOLEAN NOT NULL,
  observaciones TEXT,
  firma_tipo TEXT CHECK (firma_tipo IN ('digital', 'registro_sistema')) DEFAULT 'registro_sistema',
  firmado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Endpoint especificado

```
POST /api/qa/:linkId/recepcion
Body: { docente_email, conformidad, observaciones }
Response: { id, firmado_at, puede_abrir: conformidad }
```

### Conexion con el flujo

- Si `conformidad = false`, el boton de abrir curso queda bloqueado hasta resolver observaciones
- Las observaciones se registran como discrepancias tipo `recepcion` en la tabla existente `portal.discrepancies`
- El formulario es reutilizable: si un curso cambia de docente, el nuevo docente firma su propia recepcion

---

## 3. QA de Implementacion (M4)

### Principio

El motor de matching PIAC-Moodle de Fase 2 ya detecta discrepancias estructurales. El QA de implementacion es una segunda capa que verifica calidad de configuracion (no solo presencia) y cruza el plan M3 contra lo que existe en Moodle.

### Mapeando indicadores verificables por Moodle API

Los 77 indicadores del Marco Evaluativo se distribuyen en tres grupos segun posibilidad de verificacion automatica:

**Grupo A — 100% automatizable (API Moodle):**

| Indicador | API call | Campo | Umbral |
|-----------|----------|-------|--------|
| Actividades planificadas existen en Moodle | `core_course_get_contents` | modules[] | matching con M3 |
| Fechas de vencimiento configuradas en tareas | `mod_assign_get_assignments` | duedate != 0 | duedate > 0 |
| Foros con instrucciones (descripcion >100 char) | `mod_forum_get_forums_by_courses` | intro.length | >100 |
| Secciones visibles (≥70% con contenido) | `core_course_get_contents` | visible:true + modules.length | >0 |
| Libro de calificaciones visible | `core_course_get_courses` | showgrades | =1 |
| Al menos 1 evaluacion sumativa | `mod_assign_get_assignments` | grade != 0 | ≥1 |
| Gradebook configurado | `gradereport_user_get_grade_items` | grademax > 0 | ≥1 item |

**Grupo B — Parcialmente automatizable (requiere heuristica):**

| Indicador | Heuristica |
|-----------|-----------|
| Videos con subtitulos | Detectar si mod_resource o url contiene `.vtt` o `&cc_load_policy=1` en YouTube |
| Rubricas en tareas | `mod_assign_get_assignments` → advancedgrading != empty |
| Estructura progresiva (semanas visibles progresivamente) | Calcular si secciones_visibles / total aumenta semana a semana |
| Coherencia de nombres (no "Seccion 1", "Tarea 1") | Regex: nombres con mas de 3 palabras descriptivas |

**Grupo C — Solo evaluable manualmente (rubrica humana):**
- D2 Accesibilidad profunda (contraste, alt-text en imagenes especificas)
- D5 Perspectiva de genero (lenguaje de enunciados)
- D6 Corresponsabilidad social (casos y ejemplos)

### Schema de la tabla `qa_implementation_results`

```sql
CREATE TABLE IF NOT EXISTS portal.qa_implementation_results (
    id                  SERIAL PRIMARY KEY,
    piac_link_id        INT NOT NULL REFERENCES portal.piac_links(id) ON DELETE CASCADE,
    moodle_snapshot_id  INT REFERENCES portal.moodle_snapshots(id) ON DELETE SET NULL,
    planner_session_id  VARCHAR,           -- ID del JSON de planificador exportado
    -- Scores por dimension (0.0-1.0)
    d1_score            NUMERIC(4,3),
    d2_score            NUMERIC(4,3),
    d3_score            NUMERIC(4,3),
    d4_score            NUMERIC(4,3),
    d5_score            NUMERIC(4,3),
    d6_score            NUMERIC(4,3),
    overall_score       NUMERIC(4,3),
    -- Resultado de cada check
    checks_json         JSONB NOT NULL,    -- array de {id, label, ok, value, severity}
    gaps_json           JSONB,             -- discrepancias M3 vs M4
    auto_verified       INT DEFAULT 0,     -- cantidad checks automaticos
    manual_pending      INT DEFAULT 0,     -- checks que requieren revision humana
    semaforo            VARCHAR CHECK (semaforo IN ('verde', 'amarillo', 'rojo')),
    created_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(piac_link_id, moodle_snapshot_id)
);

CREATE INDEX IF NOT EXISTS idx_qa_impl_link ON portal.qa_implementation_results (piac_link_id);
CREATE INDEX IF NOT EXISTS idx_qa_impl_semaforo ON portal.qa_implementation_results (semaforo);
```

### Endpoint `POST /api/qa/:linkId/implementacion`

```javascript
// Logica del motor de QA de implementacion
async function runQAImplementacion(linkId) {
  // 1. Cargar datos existentes
  const link = await getLink(linkId);
  const piac = await getLatestParsed(linkId);
  const snapshot = await getLatestSnapshot(linkId);

  const checks = [];

  // CHECK QA.I1 — Todas las actividades planificadas existen
  if (piac && snapshot) {
    const nucleosMoodle = snapshot.snapshot_json.sections.filter(s => s.number > 0);
    const nucleosPiac = piac.parsed_json.nucleos;
    const ratio = nucleosMoodle.filter(s => s.modules.length > 0).length / nucleosPiac.length;
    checks.push({
      id: 'QA.I1', label: 'Nucleos PIAC implementados en Moodle',
      dimension: 'D3', auto: true,
      ok: ratio >= 0.8,
      value: `${nucleosMoodle.filter(s => s.modules.length > 0).length}/${nucleosPiac.length} nucleos con contenido`
    });
  }

  // CHECK QA.I2 — Tareas con fecha de entrega
  const assigns = await moodleCall(link.moodle_platform, 'mod_assign_get_assignments',
    { courseids: [link.moodle_course_id] });
  const sinFecha = assigns.courses?.[0]?.assignments?.filter(a => !a.duedate || a.duedate === 0) || [];
  checks.push({
    id: 'QA.I2', label: 'Todas las tareas tienen fecha de entrega',
    dimension: 'D3', auto: true,
    ok: sinFecha.length === 0,
    value: sinFecha.length === 0 ? 'OK' : `${sinFecha.length} tareas sin fecha`,
    items: sinFecha.map(a => ({ name: a.name, moodle_url: `${PLATFORMS[link.moodle_platform].url}/mod/assign/view.php?id=${a.cmid}` }))
  });

  // CHECK QA.I3 — Foros con instrucciones
  const foros = await moodleCall(link.moodle_platform, 'mod_forum_get_forums_by_courses',
    { courseids: [link.moodle_course_id] });
  const sinInstrucciones = (foros || []).filter(f =>
    f.type !== 'news' && (!f.intro || f.intro.replace(/<[^>]+>/g, '').length < 100)
  );
  checks.push({
    id: 'QA.I3', label: 'Foros con instrucciones (>100 caracteres)',
    dimension: 'D3 + D4', auto: true,
    ok: sinInstrucciones.length === 0,
    value: sinInstrucciones.length === 0 ? 'OK' : `${sinInstrucciones.length} foros sin instrucciones adecuadas`,
    items: sinInstrucciones.map(f => ({ name: f.name, intro_length: f.intro?.length || 0 }))
  });

  // CHECK QA.I4 — Gradebook visible
  const courseInfo = await moodleCall(link.moodle_platform, 'core_course_get_courses',
    { options: { ids: [link.moodle_course_id] } });
  const showGrades = courseInfo?.[0]?.showgrades;
  checks.push({
    id: 'QA.I4', label: 'Libro de calificaciones visible para estudiantes',
    dimension: 'D1', auto: true,
    ok: showGrades === 1,
    value: showGrades === 1 ? 'Visible' : 'Oculto'
  });

  // CHECK QA.I5 — Secciones con contenido (≥1 modulo visible)
  const contents = await moodleCall(link.moodle_platform, 'core_course_get_contents',
    { courseid: link.moodle_course_id });
  const seccionesConContenido = contents.filter(s => s.modules?.length > 0 && s.section > 0);
  const totalSecciones = contents.filter(s => s.section > 0).length;
  checks.push({
    id: 'QA.I5', label: 'Al menos 70% de secciones con contenido',
    dimension: 'D3', auto: true,
    ok: totalSecciones === 0 || (seccionesConContenido.length / totalSecciones) >= 0.70,
    value: `${seccionesConContenido.length}/${totalSecciones} secciones con contenido`
  });

  // CHECK QA.I6 — Videos subtitulados (heuristica YouTube)
  const urls = await moodleCall(link.moodle_platform, 'mod_url_get_urls_by_courses',
    { courseids: [link.moodle_course_id] });
  const videosYT = (urls?.urls || []).filter(u => u.externalurl?.includes('youtube.com') || u.externalurl?.includes('youtu.be'));
  const sinCC = videosYT.filter(u => !u.externalurl?.includes('cc_load_policy=1'));
  checks.push({
    id: 'QA.I6', label: 'Videos YouTube con subtitulos activados',
    dimension: 'D2', auto: true,
    ok: videosYT.length === 0 || sinCC.length === 0,
    value: videosYT.length === 0 ? 'Sin videos YouTube' : `${videosYT.length - sinCC.length}/${videosYT.length} con subtitulos`,
    note: 'Heuristica: verifica parametro cc_load_policy=1 en URL'
  });

  // CHECK QA.I7 — Rubricas en tareas evaluadas (advanced grading)
  const sinRubrica = assigns.courses?.[0]?.assignments?.filter(a =>
    a.grade > 0 && (!a.configs || !a.configs.some(c => c.plugin === 'rubric'))
  ) || [];
  checks.push({
    id: 'QA.I7', label: 'Tareas con rubrica o criterios de calificacion',
    dimension: 'D3 + D4', auto: true,
    ok: sinRubrica.length === 0,
    value: sinRubrica.length === 0 ? 'OK' : `${sinRubrica.length} tareas sin rubrica configurada`
  });

  // CHECKS MANUALES (requieren ojo humano)
  const checksManual = [
    { id: 'QA.I8', label: 'Lenguaje incluyente en enunciados de evaluacion', dimension: 'D5', auto: false },
    { id: 'QA.I9', label: 'Imagenes con texto alternativo descriptivo', dimension: 'D2', auto: false },
    { id: 'QA.I10', label: 'Ejemplos y casos con perspectiva de corresponsabilidad', dimension: 'D6', auto: false }
  ];

  // Calcular scores por dimension
  const dimensiones = ['D1','D2','D3','D4','D5','D6'];
  const scores = {};
  for (const dim of dimensiones) {
    const checksDeEstaDim = checks.filter(c => c.auto && c.dimension?.includes(dim));
    scores[dim.toLowerCase() + '_score'] = checksDeEstaDim.length === 0
      ? null
      : checksDeEstaDim.filter(c => c.ok).length / checksDeEstaDim.length;
  }
  const autoChecks = checks.filter(c => c.ok).length;
  const overall = autoChecks / checks.length;
  const semaforo = overall >= 0.85 ? 'verde' : overall >= 0.65 ? 'amarillo' : 'rojo';

  // Guardar en Supabase
  await portalUpsert('qa_implementation_results', {
    piac_link_id: linkId,
    moodle_snapshot_id: snapshot?.id,
    ...scores,
    overall_score: overall,
    checks_json: [...checks, ...checksManual],
    auto_verified: checks.length,
    manual_pending: checksManual.length,
    semaforo
  });

  return { semaforo, overall, checks, checksManual, gaps: computeGaps(piac, snapshot) };
}
```

### Output: Informe de Completitud

```json
{
  "semaforo": "amarillo",
  "overall": 0.71,
  "auto_verified": 7,
  "manual_pending": 3,
  "checks": [
    {
      "id": "QA.I2",
      "label": "Todas las tareas tienen fecha de entrega",
      "ok": false,
      "severity": "critical",
      "items": [
        {
          "name": "Tarea 1 — Ensayo critico",
          "moodle_url": "https://virtual.umce.cl/mod/assign/view.php?id=12345"
        }
      ]
    }
  ],
  "gaps": {
    "missing_in_moodle": [
      "Foro de reflexion Nucleo 3 (planificado en M3, no encontrado en Moodle)"
    ],
    "extra_in_moodle": [
      "Actividad Quiz 'Repaso' no estaba en el PIAC"
    ]
  }
}
```

---

## 4. Seguimiento (M5)

> **Nota 15-Abr-2026:** Segun la SNA, esta fase corresponde a seguimiento y acompanamiento, no a QA en sentido estricto. Se renombro de "QA de Operacion" a "Seguimiento" por recomendacion de Marisol Hernandez (DIPOS).

### Principio

Los datos reales del semestre en marcha permiten verificar si la calidad planificada se esta cumpliendo en la practica. Aqui convergen las tres fuentes: cache Moodle (Fase 4/5), Auditor Academico (PA.xx) y xAPI/LRS.

### Indicadores operativos y sus fuentes

**Fuente: cache_completions (Fase 5)**

| Indicador QA | Calculo | Umbral |
|--------------|---------|--------|
| Tasa de completion por actividad | completions_json → % completado en cada modulo | <30% = alerta |
| Progresion regular (no dejacion) | Curva de completion por semana, pendiente positiva | Pendiente negativa = alerta |
| Actividades ignoradas sistematicamente | Modulos con <20% completion en semana 8+ | Lista de recursos ineficaces |

**Fuente: cache_grades (Fase 5)**

| Indicador QA | Calculo | Umbral |
|--------------|---------|--------|
| Distribucion de calificaciones | Histograma de notas, detectar bimodal o cola baja | >40% reprobados = alerta |
| Calificaciones ingresadas a tiempo | Comparar graded_at vs duedate + 7 dias | >7 dias de retraso = alerta D4 |
| Retroalimentacion presente | gradeinfo.feedback.length > 0 | <50% con feedback = alerta |

**Fuente: Auditor Academico PA.xx**

Las 20 reglas del Auditor se convierten directamente en indicadores QA operativos:

| Regla PA | Dimension QA | Cuando escalar al QA dashboard |
|----------|--------------|-------------------------------|
| PA.01 Sin evaluacion | D3 | Semana 5+, siempre |
| PA.02 Docente ausente 14d | D4 | Semana 3+, siempre |
| PA.04 Sin participacion estudiantil | D1 | Semana 5+, si >30% inactivos |
| PA.06 Gradebook oculto | D1 | Siempre |
| PA.10 Practica sin seguimiento | D3 | Siempre CRITICO |
| PA.12 Evaluacion sin criterios | D3 + D4 | Semana 3+ |
| PA.14 Estudiantes sin retroalimentacion | D4 | Semana 7+ CRITICO |
| PA.17 Docente fantasma | D4 | Semana 3+ CRITICO |
| PA.18 Desfase matricula vs acceso | D1 | Semana 3+ |
| PA.20 Patron de plataforma | Meta | Report institucional |

**Fuente: Ralph LRS (xAPI)**

El LRS en `lrs.udfv.cloud` almacena statements xAPI de los objetos interactivos (SCORM custom, induccion2026). Para cursos con actividades xAPI:

```
GET https://lrs.udfv.cloud/xAPI/statements
Headers: Authorization: Basic..., X-Experience-API-Version: 1.0.3
Params:
  activity=https://virtual.umce.cl/mod/xapi/curso-id/
  since=2026-03-01
  until=2026-07-15
```

Los statements `experienced`, `completed`, `passed`, `failed` permiten calcular:

| Indicador QA | Statement xAPI | Calculo |
|--------------|---------------|---------|
| Tiempo real dedicado vs tiempo SCT planificado | `experienced` con duration | Suma durations por usuario |
| Progresion en el objeto (% completado) | `progressed` con result.extensions.progress | Media por actividad |
| Intentos de evaluacion | `attempted` + `passed`/`failed` | Ratio success/attempts |
| Abandono de contenido | `experienced` sin `completed` despues de >60 min | Detecta sesiones largas sin completion |

### Endpoint `GET /api/qa/:linkId/operacion`

```javascript
// Datos de operacion en tiempo real para un curso
async function getQAOperacion(linkId) {
  const link = await getLink(linkId);
  const courseId = link.moodle_course_id;
  const platform = link.moodle_platform;

  // 1. Datos de cache Fase 4/5
  const [completions, grades, submissions, recordings] = await Promise.all([
    portalQuery('cache_completions', `moodle_platform=eq.${platform}&moodle_course_id=eq.${courseId}`),
    portalQuery('cache_grades', `moodle_platform=eq.${platform}&moodle_course_id=eq.${courseId}`),
    portalQuery('cache_submissions', `moodle_platform=eq.${platform}&moodle_course_id=eq.${courseId}`),
    portalQuery('cache_recordings', `moodle_platform=eq.${platform}&moodle_course_id=eq.${courseId}`)
  ]);

  // 2. Hallazgos del Auditor Academico para este curso
  const auditorFindings = await supabaseQueryAuditor(
    'findings',
    `course_id=eq.${courseId}&platform=eq.${platform}&resolved=is.false&order=severity.asc`
  );

  // 3. Calcular indicadores operativos
  const completionRates = computeCompletionRates(completions);
  const gradeDistribution = computeGradeDistribution(grades);
  const teacherResponseTime = computeTeacherResponseTime(submissions, grades);
  const participacionForos = computeForumParticipation(completions);

  // 4. xAPI (si hay actividades con tracking LRS)
  let xapiData = null;
  if (link.has_xapi) {
    xapiData = await fetchLRSData(link.xapi_activity_id);
  }

  return {
    completion: { byActivity: completionRates, avgOverall: avg(completionRates) },
    grades: { distribution: gradeDistribution, avgGrade: avg(Object.values(gradeDistribution)) },
    teacherPresence: { avgResponseDays: teacherResponseTime, status: teacherResponseTime > 7 ? 'riesgo' : 'ok' },
    forumParticipation: participacionForos,
    auditorFindings: auditorFindings.map(f => ({
      codigo: f.regla_codigo,
      titulo: f.titulo,
      descripcion: f.descripcion,
      severidad: f.severidad,
      dimension_qa: PA_TO_DIMENSION[f.regla_codigo]
    })),
    xapi: xapiData,
    semaforo: computeOperacionSemaforo(completionRates, teacherResponseTime, auditorFindings)
  };
}

const PA_TO_DIMENSION = {
  'PA.01': 'D3', 'PA.02': 'D4', 'PA.04': 'D1',
  'PA.06': 'D1', 'PA.10': 'D3', 'PA.12': 'D3',
  'PA.14': 'D4', 'PA.17': 'D4', 'PA.18': 'D1',
  'PA.20': 'meta'
};
```

### Tabla de escalacion para el coordinador

| Dato | Umbral amarillo | Umbral rojo |
|------|-----------------|-------------|
| Completion promedio | 40-70% | <40% |
| Docente sin acceso | 7-14 dias | >14 dias |
| Participacion foros | 30-60% de inscritos | <30% |
| Tiempo retroalimentacion | 7-14 dias | >14 dias |
| Reprobados | 25-40% | >40% |
| Tiempo xAPI vs SCT planificado | Diferencia >30% | Diferencia >60% |

---

## 5. QA Posterior a Ejecucion (cierre del semestre)

### Principio

Esta fase corresponde a la "E" de ADDIE (Evaluacion). Al cierre del semestre, se recoge la percepcion del docente y de los estudiantes sobre el proceso formativo. Es la evidencia principal de mejora continua que solicita la CNA para acreditacion de programas online.

### Instrumentos

1. **Reunion de cierre con el docente**: el DI se reune con el docente para revisar como fue la implementacion, que funciono, que no, y que ajustar para el siguiente periodo
2. **Encuesta de satisfaccion estudiantil**: instrumento estructurado que recoge percepcion sobre carga, coherencia, presencia docente, y calidad de recursos

### Schema conceptual

```sql
CREATE TABLE portal.qa_posterior (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  piac_link_id UUID REFERENCES portal.piac_links(id),
  tipo_instrumento TEXT CHECK (tipo_instrumento IN ('reunion', 'encuesta')) NOT NULL,
  fecha_aplicacion TIMESTAMPTZ NOT NULL,
  participantes_count INTEGER,
  satisfaccion_general SMALLINT CHECK (satisfaccion_general BETWEEN 1 AND 5),
  carga_percibida TEXT CHECK (carga_percibida IN ('baja', 'adecuada', 'alta', 'muy_alta')),
  logros_percibidos TEXT,
  mejoras_sugeridas TEXT,
  datos_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Endpoint especificado

```
POST /api/qa/:linkId/posterior
Body: { tipo_instrumento, fecha_aplicacion, satisfaccion_general, carga_percibida, logros_percibidos, mejoras_sugeridas, datos_json }

GET /api/qa/:linkId/posterior
Response: array de evaluaciones posteriores para este curso
```

### Conexion con el ciclo

- Los datos de QA Posterior alimentan directamente la Retroalimentacion M5→M1
- Si `carga_percibida = 'muy_alta'`, se genera una alerta para revisar la Calculadora SCT del siguiente periodo
- Si `satisfaccion_general < 3`, se marca el curso para revision de diseno obligatoria

---

## 6. Retroalimentacion M5→M1 (cierre del ciclo)

### Principio

Al final del semestre, el sistema genera un informe de retroalimentacion que el DI y el coordinador usan para ajustar el diseno del siguiente semestre. Los datos de M5 responden preguntas concretas de M1 y M3.

### Calculo de las retroalimentaciones clave

**RF.01 — Carga real vs carga planificada**

```
Dato fuente:
  xAPI: suma de duration en statements "experienced" por semana
  Cache: timestamps de acceso y submission

Calculo:
  horas_reales_por_semana = media(xapi_durations_por_semana)
  horas_planificadas_M1 = piac.identificacion.horas.total / piac.identificacion.semanas

Retroalimentacion si |horas_reales - horas_planificadas| > 20%:
  "Los estudiantes dedicaron X horas semanales en promedio.
   El PIAC planificaba Y horas/semana (Z creditos SCT).
   Diferencia: ±N%.
   Recomendacion M1: ajustar los creditos SCT a Z'
   o reducir la carga declarada en el PIAC."
```

**RF.02 — Recursos ignorados (completion <30%)**

```
Dato fuente: cache_completions por modulo

Calculo:
  modulos_ignorados = modulos con completion_rate < 0.30 en semana 12+

Retroalimentacion:
  "Las siguientes actividades tuvieron baja completion:
   - 'Lectura complementaria: Bloom y Anderson' → 15% de completion
   - 'Video de apoyo Sesion 4' → 22% de completion
   Recomendacion M3: revisar si estas actividades son necesarias o si
   pueden reemplazarse por algo mas directamente vinculado a las evaluaciones."
```

**RF.03 — Abandono en sesiones sincronicas largas**

```
Dato fuente:
  xAPI statements "experienced" con timestamp (cuando empezo la actividad)
  vs timestamp de la siguiente actividad del mismo usuario

Calculo:
  Para cada grabacion de sesion sincronica:
    Si un usuario accede pero la siguiente actividad es 70-120 min despues
    del inicio de la sesion (no al final) → probable abandono

Retroalimentacion:
  "Las sesiones de 120 min tienen patron de salida en torno al min 70-80.
   El 35% de los estudiantes no llega al segundo bloque.
   Recomendacion M3: dividir las sesiones de 120 min en dos bloques
   de 60 min con un receso intermedio o actividad de verificacion."
```

**RF.04 — Dimension de calidad que mas alerto**

```
Calculo:
  Contar checks fallidos por dimension durante M4 y M5
  La dimension con mas fallos es la prioridad de mejora

Retroalimentacion:
  "En este semestre, la dimension con mayor brecha fue D4 Docencia Virtual
   (retroalimentacion tardia, presencia inconsistente).
   Para el proximo semestre, considera acordar con el docente:
   - Frecuencia minima de acceso al aula (ej: 3 veces por semana)
   - Tiempo maximo de retroalimentacion (ej: 5 dias habiles)
   - Protocolo de aviso si el docente no puede acceder"
```

### Endpoint `GET /api/qa/:linkId/retroalimentacion`

```javascript
// Genera el informe de retroalimentacion al cierre del semestre
async function getRetroalimentacion(linkId) {
  // Cargar todos los datos del semestre
  const [qaPreventivo, qaImplementacion, qaOperacion, auditorFinal] = await Promise.all([
    getQASummary(linkId, 'preventivo'),
    getQASummary(linkId, 'implementacion'),
    getQASummary(linkId, 'operacion'),
    getAuditorSummary(linkId)
  ]);

  const retroalimentaciones = [];

  // RF.01 Carga real
  if (qaOperacion.xapi?.avgWeeklyHours) {
    const diff = Math.abs(qaOperacion.xapi.avgWeeklyHours - planificado.weeklyHours) / planificado.weeklyHours;
    if (diff > 0.20) retroalimentaciones.push(buildRF01(qaOperacion.xapi, planificado));
  }

  // RF.02 Recursos ignorados
  const ignorados = qaOperacion.completion.byActivity.filter(a => a.rate < 0.30);
  if (ignorados.length > 0) retroalimentaciones.push(buildRF02(ignorados));

  // RF.03 Abandono sesiones
  if (qaOperacion.xapi?.sessionAbandonment > 0.30) retroalimentaciones.push(buildRF03(qaOperacion.xapi));

  // RF.04 Dimension critica
  const dimFails = computeDimensionFailCounts(qaImplementacion.checks, qaOperacion.auditorFindings);
  const dimCritica = Object.entries(dimFails).sort((a,b) => b[1]-a[1])[0];
  retroalimentaciones.push(buildRF04(dimCritica));

  // Recomendaciones clasificadas por momento del flujo
  return {
    retroalimentaciones,
    recomendaciones_M1: retroalimentaciones.filter(r => r.afecta_momento === 'M1'),
    recomendaciones_M3: retroalimentaciones.filter(r => r.afecta_momento === 'M3'),
    recomendaciones_docente: retroalimentaciones.filter(r => r.tipo === 'docente'),
    recomendaciones_di: retroalimentaciones.filter(r => r.tipo === 'di'),
    dimension_prioridad: dimCritica[0],
    resumen_ejecutivo: buildResumenEjecutivo(retroalimentaciones, qaOperacion)
  };
}
```

### Formato del informe de retroalimentacion para DI/Coordinador

```
INFORME DE RETROALIMENTACION — [Nombre del curso]
Periodo: 1S-2026 | Programa: Pedagogia en Educacion Basica
Generado: julio 2026

SEMAFORO GENERAL DEL SEMESTRE: AMARILLO

PARA EL PROXIMO DISENO (M1):
  ● Los creditos SCT declarados (4 SCT = 108h) subestiman la carga real.
    Los estudiantes dedicaron en promedio 7.8h/semana (deberia ser 6.75h/sem).
    ACCION: Ajustar a 4.5 SCT o reducir el volumen de lecturas.

PARA EL PROXIMO PLANIFICADOR (M3):
  ● 4 lecturas complementarias tuvieron completion <30%. Posibles causas:
    demasiada extension, poca conexion con las evaluaciones.
    ACCION: Reemplazar por 2 lecturas mas cortas directamente vinculadas a las tareas.
  ● Las sesiones de 90 min muestran abandono en el minuto 60 (25% de estudiantes).
    ACCION: Disenar descanso activo en minuto 45-50 o dividir en bloques de 45 min.

PARA EL CONTRATO DE DOCENCIA (M4):
  ● Dimension D4 fue la mas critica: el docente tuvo 3 periodos con >14 dias
    sin acceso al aula virtual en semanas con entregas abiertas.
    ACCION: Acordar protocolo de presencia virtual (minimo 3 veces/semana).

LOGROS A MANTENER:
  ● Participation en foros fue del 78% (sobre umbral del 60%).
  ● Retroalimentacion de tareas: promedio 4.2 dias (bajo los 7 dias recomendados).
  ● Completion de actividades obligatorias: 82% (satisfactorio).
```

---

## 7. Dashboard QA Unificado

### Estructura de vistas y datos por nivel

#### Vista 1 — DI (Disenador Instruccional)

Acceso: `/qa/di` — protegido por `adminOrEditor`

El DI ve los cursos que tiene vinculados en `piac_links`. El foco es el estado de cada curso que gestiona.

**Wireframe — Vista DI:**

```
┌─────────────────────────────────────────────────────────────────┐
│  MIS CURSOS  —  QA Dashboard                    [DI: Ana Lopez] │
│                                                                  │
│  Filtros: [Todos] [Verde] [Amarillo] [Rojo]   Semestre: 1S-2026 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────┐  ┌──────────────────────┐  │
│  │ Pedagogia en Educacion Basica   │  │  Magister Intercult. │  │
│  │ virtual.umce.cl / ID 338        │  │  postgrado / ID 127  │  │
│  │                                 │  │                      │  │
│  │  [O] Prev.  [A] Impl. [V] Oper. │  │ [V] [V] [R]          │  │
│  │   Verde     Amarillo   Verde    │  │                      │  │
│  │                                 │  │ 2 alertas activas    │  │
│  │  Radar compacto 6 dims           │  │ D4: Docente 9d       │  │
│  │  [●●●●●○] D1  [●●●●○○] D3      │  │ D3: Sin evaluacion   │  │
│  │                                 │  │                      │  │
│  │  [Ver detalle] [Ver en Moodle]  │  │ [Ver detalle]        │  │
│  └─────────────────────────────────┘  └──────────────────────┘  │
│                                                                  │
│  Mis pendientes esta semana:                                     │
│  ● Revisar accesibilidad D2 en PEBAS502 (manual QA.I9, QA.I8)   │
│  ● Completar informe de retroalimentacion MCAMC-127              │
└─────────────────────────────────────────────────────────────────┘
```

**Endpoint:** `GET /api/qa/di/resumen`

```json
{
  "cursos": [
    {
      "piac_link_id": 5,
      "course_name": "Pedagogia en Educacion Basica",
      "platform": "virtual",
      "qa_preventivo": { "semaforo": "verde", "score": 8, "total": 8 },
      "qa_implementacion": { "semaforo": "amarillo", "overall": 0.71, "alertas": 2 },
      "qa_operacion": { "semaforo": "verde", "completion_avg": 0.82, "alertas_auditor": 0 },
      "scores_dimensiones": { "d1": 0.9, "d2": 0.6, "d3": 0.75, "d4": 0.85, "d5": null, "d6": null },
      "pendientes_manuales": ["QA.I8", "QA.I9"]
    }
  ],
  "resumen_semana": {
    "cursos_verde": 3, "cursos_amarillo": 2, "cursos_rojo": 0,
    "alertas_activas": 4, "pendientes_manuales": 6
  }
}
```

---

#### Vista 2 — Coordinador de Programa

Acceso: `/qa/coordinador` — rol `editor` con filtro por `program_id`

El coordinador ve todos los cursos de su programa con comparacion entre docentes/secciones.

**Wireframe — Vista Coordinador:**

```
┌──────────────────────────────────────────────────────────────────────┐
│  PROGRAMA: Pedagogia en Educacion Basica  —  QA Coordinador          │
│  12 cursos activos  |  1S-2026, Semana 5                             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ESTADO GENERAL                                                      │
│  ┌───────┐ ┌────────┐ ┌──────┐   Dimension mas critica: D4 Docencia  │
│  │  8    │ │   3    │ │  1   │   ██░░░░░░ 45% de cursos con alerta   │
│  │VERDE  │ │AMARILLO│ │ ROJO │                                       │
│  └───────┘ └────────┘ └──────┘                                       │
│                                                                      │
│  CURSOS QUE REQUIEREN ATENCION                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Curso              │ D1  │ D3  │ D4  │ Alerta                 │  │
│  ├────────────────────┼─────┼─────┼─────┼────────────────────────┤  │
│  │ PEBAS302           │ ●   │ ●   │ [!] │ Docente sin acceso 16d │  │
│  │ PEBAS204           │ [!] │ ●   │ ●   │ Completion <30%        │  │
│  │ PEBAS105           │ ●   │ [!] │ ●   │ Sin evaluacion semana5 │  │
│  └────────────────────┴─────┴─────┴─────┴────────────────────────┘  │
│                                                                      │
│  TENDENCIAS DEL SEMESTRE                                             │
│  [Grafico de lineas: completion semanal promedio del programa]       │
│  [Grafico de barras: participacion en foros por semana]              │
│                                                                      │
│  [Exportar informe DIDOC]  [Ver retroalimentaciones anteriores]      │
└──────────────────────────────────────────────────────────────────────┘
```

**Endpoint:** `GET /api/qa/coordinador/:programId/resumen`

```json
{
  "program_id": 3,
  "program_name": "Pedagogia en Educacion Basica",
  "semana_actual": 5,
  "totales": { "verde": 8, "amarillo": 3, "rojo": 1 },
  "dimension_critica": "d4",
  "cursos_alerta": [
    {
      "piac_link_id": 8,
      "course_name": "PEBAS302",
      "alerta_principal": "PA.02 — Docente sin acceso 16 dias",
      "severidad": "critica",
      "accion_sugerida": "Contactar coordinador docente",
      "scores": { "d1": 0.9, "d3": 0.85, "d4": 0.0 }
    }
  ],
  "tendencias_semanales": [
    { "semana": 1, "completion_avg": 0.12, "forum_participation": 0.05 },
    { "semana": 2, "completion_avg": 0.28, "forum_participation": 0.15 },
    { "semana": 3, "completion_avg": 0.41, "forum_participation": 0.32 },
    { "semana": 4, "completion_avg": 0.55, "forum_participation": 0.48 },
    { "semana": 5, "completion_avg": 0.61, "forum_participation": 0.52 }
  ],
  "meta_hallazgo_plataforma": {
    "regla": "PA.06",
    "afecta_cursos": 7,
    "total_cursos": 12,
    "pct": 0.58,
    "accion": "Solicitar a admin de virtual.umce.cl activar showgrades=1 como default"
  }
}
```

---

#### Vista 3 — UDFV Institucional

Acceso: solo `ADMIN_EMAILS`

El equipo UDFV ve todas las plataformas y puede comparar calidad entre programas, detectar patrones sistemicos y preparar reportes DIDOC.

**Wireframe — Vista Institucional:**

```
┌──────────────────────────────────────────────────────────────────────┐
│  CALIDAD INSTITUCIONAL — UDFV  |  1S-2026, Semana 5                  │
│  5 plataformas  |  72 cursos con vinculo PIAC activo                 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  POR PLATAFORMA               POR DIMENSION (todos los cursos)       │
│  ┌─────────────────────────┐  D1 ████████████░░░░ 78%               │
│  │ virtual    ●●●●●○ 42/48 │  D2 ████████░░░░░░░░ 54% [riesgo]      │
│  │ evirtual   ●●●●○○ 10/14 │  D3 █████████████░░░ 82%               │
│  │ postgrado  ●●●○○○  4/ 7 │  D4 ██████████░░░░░░ 65%               │
│  │ pregrado   ●●●●●● 2/  2 │  D5 Sin datos suf.                     │
│  │ practica   ●●●●●○ 1/  1 │  D6 Sin datos suf.                     │
│  └─────────────────────────┘                                         │
│                                                                      │
│  ALERTAS CRITICAS ACTIVAS (4)                                        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ PA.17 Docente fantasma | MCAMC-127 | virtual | CRITICA | DI: Ana│  │
│  │ PA.10 Practica sin entrega | PEBAS302 | virtual | CRITICA | —  │  │
│  │ PA.01 Sin evaluacion | POSTG-58 | postgrado | CRITICA | —      │  │
│  │ PA.04 Sin actividad estudiantil | PEBAS204 | virtual | CRITICA │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  META-HALLAZGOS DE PLATAFORMA                                        │
│  ● virtual.umce.cl: showgrades=0 en 63% de cursos (no es docente)   │
│  ● evirtual.umce.cl: sin completion tracking en 89% de cursos        │
│                                                                      │
│  [Exportar para DIDOC] [Exportar para Mesa Virtualizacion] [CSV]     │
└──────────────────────────────────────────────────────────────────────┘
```

**Endpoint:** `GET /api/qa/institucional/resumen`

```json
{
  "semana_actual": 5,
  "total_cursos": 72,
  "por_plataforma": [
    {
      "platform": "virtual",
      "total": 48,
      "verde": 32, "amarillo": 10, "rojo": 6,
      "pct_calidad": 0.875
    }
  ],
  "scores_institucionales_por_dimension": {
    "d1": 0.78, "d2": 0.54, "d3": 0.82, "d4": 0.65, "d5": null, "d6": null
  },
  "alertas_criticas": [...],
  "meta_hallazgos": [
    {
      "platform": "virtual",
      "regla": "PA.06",
      "descripcion": "showgrades=0 en el 63% de los cursos",
      "afecta_cursos": 30,
      "accion_plataforma": "Cambiar configuracion default en admin Moodle"
    }
  ]
}
```

### Conexion con dashboard.udfv.cloud

El dashboard docente existente (v4.1.1) tiene su propio schema y datos. La conexion se hace por dos caminos:

**Camino 1 — Widget QA en el dashboard docente existente**

El dashboard en `dashboard.udfv.cloud` puede incluir un iframe o un web component que cargue el semaforo QA de umce.online para ese curso:

```javascript
// En dashboard.udfv.cloud — widget QA
async function loadQAWidget(courseId, platform) {
  const resp = await fetch(`https://umce.online/api/qa/widget/${platform}/${courseId}`, {
    credentials: 'include'
  });
  const data = await resp.json();
  renderQAWidget(data); // semaforo simple + 3 metricas clave
}
```

`GET /api/qa/widget/:platform/:courseId` devuelve datos minimos para embeber:

```json
{
  "semaforo": "amarillo",
  "score": "71%",
  "alertas": 2,
  "dimension_mas_critica": "D2 Accesibilidad",
  "link_detalle": "https://umce.online/qa/di#curso-5"
}
```

**Camino 2 — Tabla conjunta en Supabase**

El dashboard docente ya usa `supabase.udfv.cloud`. Agregar una vista materializada que exponga los scores QA para query directa:

```sql
-- Vista para uso en dashboard.udfv.cloud
CREATE VIEW portal.qa_curso_resumen AS
SELECT
  pl.moodle_platform AS platform,
  pl.moodle_course_id AS course_id,
  qai.semaforo,
  qai.overall_score,
  qai.d1_score, qai.d2_score, qai.d3_score,
  qai.d4_score, qai.d5_score, qai.d6_score,
  qai.created_at AS qa_updated_at,
  -- Alertas activas del Auditor
  (SELECT COUNT(*) FROM auditor.findings af
   WHERE af.course_id = pl.moodle_course_id
   AND af.platform = pl.moodle_platform
   AND af.resolved = false
   AND af.severidad IN ('CRITICA', 'ADVERTENCIA')
  ) AS alertas_activas
FROM portal.piac_links pl
LEFT JOIN portal.qa_implementation_results qai
  ON qai.piac_link_id = pl.id
  AND qai.id = (
    SELECT id FROM portal.qa_implementation_results
    WHERE piac_link_id = pl.id
    ORDER BY created_at DESC LIMIT 1
  )
WHERE pl.status = 'active';
```

---

## 8. Schema SQL completo para QA System

```sql
-- =============================================================================
-- QA SYSTEM SCHEMA — schema portal (extension)
-- Supabase Self-Hosted (supabase.udfv.cloud)
-- Created: 2026-04-07
-- Extends: schema-piac.sql, schema-fase4.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- QA PREVENTIVO — resultado del QA sobre el output del planificador M3
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.qa_preventivo (
    id                  SERIAL PRIMARY KEY,
    piac_link_id        INT REFERENCES portal.piac_links(id) ON DELETE CASCADE,
    planner_json        JSONB NOT NULL,         -- snapshot del planificador M3
    checks_json         JSONB NOT NULL,         -- array de {id, ok, value, suggestion}
    semaforo            VARCHAR NOT NULL CHECK (semaforo IN ('verde', 'amarillo', 'rojo')),
    score               INT NOT NULL,
    total               INT NOT NULL,
    ready_for_m4        BOOLEAN DEFAULT false,
    created_by          VARCHAR,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- QA IMPLEMENTACION — resultado del QA sobre el curso ya construido en M4
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.qa_implementation_results (
    id                  SERIAL PRIMARY KEY,
    piac_link_id        INT NOT NULL REFERENCES portal.piac_links(id) ON DELETE CASCADE,
    moodle_snapshot_id  INT REFERENCES portal.moodle_snapshots(id) ON DELETE SET NULL,
    planner_session_id  VARCHAR,
    d1_score            NUMERIC(4,3),
    d2_score            NUMERIC(4,3),
    d3_score            NUMERIC(4,3),
    d4_score            NUMERIC(4,3),
    d5_score            NUMERIC(4,3),
    d6_score            NUMERIC(4,3),
    overall_score       NUMERIC(4,3),
    checks_json         JSONB NOT NULL,
    gaps_json           JSONB,
    auto_verified       INT DEFAULT 0,
    manual_pending      INT DEFAULT 0,
    semaforo            VARCHAR CHECK (semaforo IN ('verde', 'amarillo', 'rojo')),
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- QA OPERACION SNAPSHOTS — metricas operativas por semana (cron)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.qa_operacion_snapshots (
    id                  SERIAL PRIMARY KEY,
    piac_link_id        INT NOT NULL REFERENCES portal.piac_links(id) ON DELETE CASCADE,
    semana_semestre     INT NOT NULL,           -- 1-18
    semana_fecha        DATE,
    completion_avg      NUMERIC(4,3),
    completion_by_activity JSONB,
    grade_distribution  JSONB,
    grade_avg           NUMERIC(5,2),
    teacher_response_days NUMERIC(4,1),
    forum_participation_pct NUMERIC(4,3),
    auditor_findings    JSONB,                  -- snapshot de hallazgos PA.xx activos
    xapi_hours_real     NUMERIC(6,2),
    xapi_hours_planned  NUMERIC(6,2),
    semaforo            VARCHAR CHECK (semaforo IN ('verde', 'amarillo', 'rojo')),
    created_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(piac_link_id, semana_semestre)
);

-- ---------------------------------------------------------------------------
-- QA RETROALIMENTACION — informe de cierre del ciclo M5→M1
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.qa_retroalimentacion (
    id                  SERIAL PRIMARY KEY,
    piac_link_id        INT NOT NULL REFERENCES portal.piac_links(id) ON DELETE CASCADE,
    semestre            VARCHAR NOT NULL,       -- '1S-2026'
    retroalimentaciones JSONB NOT NULL,         -- array de {tipo, descripcion, afecta_momento}
    rec_m1              JSONB,                  -- recomendaciones para M1
    rec_m3              JSONB,                  -- recomendaciones para M3
    rec_docente         JSONB,                  -- para contrato de docencia
    dimension_prioridad VARCHAR,
    resumen_ejecutivo   TEXT,
    generado_por        VARCHAR,
    created_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(piac_link_id, semestre)
);

-- ---------------------------------------------------------------------------
-- QA CHECKS MANUALES — checks que requieren revision humana (DI los marca)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.qa_manual_checks (
    id                  SERIAL PRIMARY KEY,
    qa_impl_id          INT NOT NULL REFERENCES portal.qa_implementation_results(id) ON DELETE CASCADE,
    check_id            VARCHAR NOT NULL,       -- 'QA.I8', 'QA.I9', 'QA.I10'
    label               TEXT NOT NULL,
    dimension           VARCHAR,
    status              VARCHAR NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'ok', 'fail', 'na')),
    nota                TEXT,
    revisado_por        VARCHAR,
    revisado_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_qa_prev_link ON portal.qa_preventivo (piac_link_id);
CREATE INDEX IF NOT EXISTS idx_qa_impl_link ON portal.qa_implementation_results (piac_link_id);
CREATE INDEX IF NOT EXISTS idx_qa_impl_semaforo ON portal.qa_implementation_results (semaforo);
CREATE INDEX IF NOT EXISTS idx_qa_oper_link ON portal.qa_operacion_snapshots (piac_link_id);
CREATE INDEX IF NOT EXISTS idx_qa_oper_semana ON portal.qa_operacion_snapshots (semana_semestre);
CREATE INDEX IF NOT EXISTS idx_qa_retro_link ON portal.qa_retroalimentacion (piac_link_id);
CREATE INDEX IF NOT EXISTS idx_qa_retro_semestre ON portal.qa_retroalimentacion (semestre);
CREATE INDEX IF NOT EXISTS idx_qa_manual_impl ON portal.qa_manual_checks (qa_impl_id);

-- VISTA RESUMEN para dashboard.udfv.cloud
CREATE VIEW portal.qa_curso_resumen AS
SELECT
  pl.moodle_platform AS platform,
  pl.moodle_course_id AS course_id,
  pl.course_name,
  qai.semaforo,
  qai.overall_score,
  qai.d1_score, qai.d2_score, qai.d3_score,
  qai.d4_score, qai.d5_score, qai.d6_score,
  qai.created_at AS qa_updated_at
FROM portal.piac_links pl
LEFT JOIN portal.qa_implementation_results qai
  ON qai.piac_link_id = pl.id
  AND qai.id = (
    SELECT id FROM portal.qa_implementation_results
    WHERE piac_link_id = pl.id
    ORDER BY created_at DESC LIMIT 1
  )
WHERE pl.status = 'active';

-- RLS (mismo patron que tablas existentes)
ALTER TABLE portal.qa_preventivo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "r qa_preventivo" ON portal.qa_preventivo FOR SELECT USING (true);
CREATE POLICY "w qa_preventivo" ON portal.qa_preventivo FOR ALL USING (current_setting('role') = 'service_role');

ALTER TABLE portal.qa_implementation_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "r qa_impl" ON portal.qa_implementation_results FOR SELECT USING (true);
CREATE POLICY "w qa_impl" ON portal.qa_implementation_results FOR ALL USING (current_setting('role') = 'service_role');

ALTER TABLE portal.qa_operacion_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "r qa_oper" ON portal.qa_operacion_snapshots FOR SELECT USING (true);
CREATE POLICY "w qa_oper" ON portal.qa_operacion_snapshots FOR ALL USING (current_setting('role') = 'service_role');

ALTER TABLE portal.qa_retroalimentacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "r qa_retro" ON portal.qa_retroalimentacion FOR SELECT USING (true);
CREATE POLICY "w qa_retro" ON portal.qa_retroalimentacion FOR ALL USING (current_setting('role') = 'service_role');

ALTER TABLE portal.qa_manual_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "r qa_manual" ON portal.qa_manual_checks FOR SELECT USING (true);
CREATE POLICY "w qa_manual" ON portal.qa_manual_checks FOR ALL USING (current_setting('role') = 'service_role');

-- GRANTS
GRANT SELECT ON portal.qa_preventivo, portal.qa_implementation_results,
  portal.qa_operacion_snapshots, portal.qa_retroalimentacion,
  portal.qa_manual_checks, portal.qa_curso_resumen TO anon, authenticated;
GRANT ALL ON portal.qa_preventivo, portal.qa_implementation_results,
  portal.qa_operacion_snapshots, portal.qa_retroalimentacion,
  portal.qa_manual_checks TO service_role;
```

---

## 9. Endpoints completos del QA System

```
POST /api/qa/preventivo
  Body: { plannerJson }
  Returns: semaforo, checks[], readyForM4
  Auth: adminOrEditor

POST /api/qa/:linkId/implementacion
  Runs: snapshot Moodle + 10 checks automaticos + guarda en DB
  Returns: semaforo, overall, checks[], gaps, checksManual[]
  Auth: adminOrEditor

GET  /api/qa/:linkId/implementacion
  Returns: ultimo resultado de implementacion
  Auth: adminOrEditor

PUT  /api/qa/:linkId/manual-check/:checkId
  Body: { status: 'ok'|'fail'|'na', nota }
  Updates: qa_manual_checks
  Auth: adminOrEditor

GET  /api/qa/:linkId/operacion
  Returns: completion, grades, teacherPresence, auditorFindings, xapi
  Auth: adminOrEditor

POST /api/qa/:linkId/operacion/snapshot
  Cron: ejecutado por cron 6h (junto con refresh del cron de Fase 4)
  Guarda: qa_operacion_snapshots para la semana actual
  Auth: service only

GET  /api/qa/:linkId/retroalimentacion
  Returns: informe de cierre del ciclo
  Auth: adminOrEditor

GET  /api/qa/di/resumen
  Returns: todos los cursos del usuario autenticado + semaforos
  Auth: adminOrEditor

GET  /api/qa/coordinador/:programId/resumen
  Returns: todos los cursos del programa + tendencias + alertas criticas
  Auth: adminOrEditor (con validacion de program_id)

GET  /api/qa/institucional/resumen
  Returns: todas las plataformas, meta-hallazgos, exportable
  Auth: ADMIN solo

GET  /api/qa/widget/:platform/:courseId
  Returns: semaforo + score + alertas (para embed en dashboard.udfv.cloud)
  Auth: cookie session
```

---

## 10. Integracion del cron del QA con el cron de Fase 4

El cron existente en `server.js` (setInterval 6h) corre `refreshAllActiveLinks()`. Se extiende para incluir el snapshot de operacion QA:

```javascript
// En server.js — dentro de refreshAllActiveLinks()
async function refreshAllActiveLinks() {
  const activeLinks = await portalQuery('piac_links', 'status=eq.active');
  for (const link of activeLinks) {
    if (!link.publicado) continue;
    try {
      // Existente (Fase 4):
      await refreshMoodleSnapshot(link.id);
      await refreshRecordings(link.id);
      await refreshCalendar(link.id);
      await detectarCambiosYAlertar(link.id);

      // NUEVO (QA):
      const semanaActual = getSemanaDelSemestre();
      await saveQAOperacionSnapshot(link.id, semanaActual);
      // saveQAOperacionSnapshot llama a completion, grades, submissions
      // del cache ya existente — no hace nuevas llamadas Moodle
    } catch (err) {
      console.error(`[QA Cron] Error en link ${link.id}:`, err);
    }
  }
}

function getSemanaDelSemestre() {
  // Primer lunes del semestre 1S-2026: 2 de marzo
  const inicio = new Date('2026-03-02');
  const hoy = new Date();
  const diff = Math.floor((hoy - inicio) / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(18, diff + 1));
}
```

---

## Resumen de lo producido

Lo entregado aqui es un diseno de sistema completo, no una especificacion abstracta. Los elementos concretos:

**Schemas SQL (1 archivo listo para ejecutar):** 5 tablas nuevas (`qa_preventivo`, `qa_implementation_results`, `qa_operacion_snapshots`, `qa_retroalimentacion`, `qa_manual_checks`), 1 vista (`qa_curso_resumen`), con RLS y grants en el patron del proyecto.

**8 endpoints nuevos en server.js:** Todos siguen el patron Express + `portalQuery`/`portalMutate` del codebase existente. Ningun endpoint modifica Moodle.

**10 checks automaticos QA:** 8 preventivos (desde el planificador), 10 de implementacion (via Moodle API). Cada check tiene `id`, `label`, `dimension`, `ok`, `suggestion`, y link al elemento en Moodle cuando falla.

**Conexion con el Auditor Academico:** La tabla `PA_TO_DIMENSION` mapea las 20 reglas PA.xx a las 6 dimensiones del Marco Evaluativo. El cron del QA lee los hallazgos del schema `auditor` y los presenta como indicadores operativos de calidad en la vista del DI y coordinador.

**Conexion con el planificador existente:** El `POST /api/qa/preventivo` recibe el JSON que ya produce el planificador. El semaforo del Paso 3 del planificador se expande con los 8 checks QA. El boton "Exportar plan" se condiciona a `readyForM4 === true`.

**Retroalimentacion cuantificada M5→M1:** 4 retroalimentaciones calculables (carga real vs SCT, recursos ignorados, abandono en sesiones, dimension mas critica) con formato de informe listo para DI y coordinador.

**3 vistas de dashboard con wireframes ASCII y endpoints:** Vista DI (mis cursos), Vista Coordinador (mi programa), Vista Institucional UDFV (todas las plataformas). La vista institucional produce los datos para el informe DIDOC mensual.

**Archivos relevantes del proyecto:**
- `/Users/coordinacion/Documents/umce-online/src/schema-piac.sql` — base sobre la que se extiende el schema QA
- `/Users/coordinacion/Documents/umce-online/src/schema-fase4.sql` — tablas cache que alimentan fase de Seguimiento
- `/Users/coordinacion/Documents/umce-online/src/public/virtualizacion-qa.html` — pagina QA existente (herramienta standalone)
- `/Users/coordinacion/Documents/umce-online/src/public/virtualizacion-planificador.html` — punto de integracion del QA preventivo
- `/Users/coordinacion/Documents/34_CONSOLIDACION_MOODLE_UMCE/auditor-academico/REDISENO_PEDAGOGICO_REGLAS.md` — fuente de las 20 reglas PA.xx que se conectan a la fase de Seguimiento