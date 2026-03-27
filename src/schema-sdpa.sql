-- =============================================================================
-- Desarrollo Profesional Academico (SDPA) — Schema SQL
-- Supabase Self-Hosted (supabase.udfv.cloud) — schema portal
-- Created:  2026-03-26
-- Descripcion: Sistema SEPARADO de las insignias del estudiante.
--   Trackea la trayectoria de desarrollo profesional del docente UMCE,
--   conectando con el SDPA institucional (UDA, 2022), Certificacion TIC (UDFV, 2025),
--   y Ruta Formativa IA (UDFV, 2025).
--   Referencia: CURSO-VIRTUAL-SPEC.md seccion "Desarrollo Profesional Academico"
-- IDEMPOTENTE: puede re-ejecutarse sin errores.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PASO 1: ENUM TYPES
-- ---------------------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'linea_sdpa') THEN
        CREATE TYPE linea_sdpa AS ENUM (
            'docencia', 'investigacion', 'vinculacion_medio',
            'gestion_academica', 'tematicas_transversales', 'integracion_tic'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'programa_sdpa') THEN
        CREATE TYPE programa_sdpa AS ENUM (
            'induccion', 'actualizacion_desarrollo',
            'acompanamiento_focalizado', 'difusion_buenas_practicas'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_actividad_sdpa') THEN
        CREATE TYPE tipo_actividad_sdpa AS ENUM (
            'taller', 'curso', 'seminario', 'proyecto_innovacion',
            'mentoria', 'induccion', 'autoformacion', 'otro'
        );
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- PASO 2: TABLAS
-- ---------------------------------------------------------------------------

-- Actividades formativas registradas por docente
CREATE TABLE IF NOT EXISTS portal.actividades_sdpa (
    id                  SERIAL PRIMARY KEY,
    docente_email       TEXT NOT NULL,               -- @umce.cl
    nombre_actividad    TEXT NOT NULL,
    descripcion         TEXT,
    linea               linea_sdpa NOT NULL,
    programa            programa_sdpa,
    tipo                tipo_actividad_sdpa NOT NULL DEFAULT 'curso',
    horas_cronologicas  NUMERIC(5,1) NOT NULL,
    creditos_sct        NUMERIC(3,1),                -- calculado: horas / 27
    fecha_inicio        DATE NOT NULL,
    fecha_termino       DATE,
    estado              TEXT NOT NULL DEFAULT 'completada'
                        CHECK (estado IN ('en_progreso', 'completada', 'abandonada')),
    calificacion        NUMERIC(2,1),                -- si aplica
    plataforma          TEXT,                        -- 'moodle_evirtual', 'presencial', 'asincrono_udfv', etc.
    moodle_course_id    INTEGER,                     -- si viene de Moodle (para tracking automatico)
    evidencia_url       TEXT,                        -- enlace a documento/portafolio
    registrado_por      TEXT NOT NULL,               -- email del admin que registro o 'sistema' si automatico
    notas               TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Certificaciones docentes (definiciones)
CREATE TABLE IF NOT EXISTS portal.certificaciones_sdpa (
    id                  SERIAL PRIMARY KEY,
    slug                TEXT UNIQUE NOT NULL,         -- 'tic_inicial', 'tic_avanzado', 'ruta_ia_1', etc.
    nombre              TEXT NOT NULL,
    descripcion         TEXT,
    horas_requeridas    NUMERIC(5,1) NOT NULL,
    creditos_sct        NUMERIC(3,1),
    linea_principal     linea_sdpa,
    requiere_evidencia  BOOLEAN DEFAULT false,
    requiere_proyecto   BOOLEAN DEFAULT false,
    prerequisito_id     INTEGER REFERENCES portal.certificaciones_sdpa(id),
    reglas_composicion  JSONB,                       -- criterios especificos
    activa              BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- Progreso de certificacion por docente
CREATE TABLE IF NOT EXISTS portal.progreso_certificaciones (
    id                      SERIAL PRIMARY KEY,
    docente_email           TEXT NOT NULL,
    certificacion_id        INTEGER NOT NULL REFERENCES portal.certificaciones_sdpa(id),
    horas_acumuladas        NUMERIC(5,1) DEFAULT 0,
    estado                  TEXT NOT NULL DEFAULT 'en_progreso'
                            CHECK (estado IN ('no_iniciado', 'en_progreso', 'requisitos_cumplidos', 'certificado')),
    evidencia_estado        TEXT CHECK (evidencia_estado IN ('no_presentada', 'en_revision', 'aprobada', 'rechazada')),
    evidencia_url           TEXT,
    evidencia_comentario    TEXT,                     -- feedback del admin
    proyecto_estado         TEXT CHECK (proyecto_estado IN ('no_presentado', 'en_desarrollo', 'presentado', 'aprobado')),
    fecha_certificacion     TIMESTAMPTZ,             -- cuando se emitio
    credential_json         JSONB,                   -- OB 3.0 firmado (misma infra Ed25519 que badges)
    verificacion_hash       TEXT UNIQUE,             -- umce.online/credential/{hash}
    certificado_por         TEXT,                     -- email del admin que aprobo
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now(),
    UNIQUE(docente_email, certificacion_id)
);

-- Evidencias pedagogicas (para certificacion TIC)
CREATE TABLE IF NOT EXISTS portal.evidencias_sdpa (
    id                  SERIAL PRIMARY KEY,
    docente_email       TEXT NOT NULL,
    certificacion_id    INTEGER NOT NULL REFERENCES portal.certificaciones_sdpa(id),
    titulo              TEXT NOT NULL,
    descripcion         TEXT,
    tipo                TEXT NOT NULL CHECK (tipo IN ('documento', 'enlace', 'video', 'portafolio', 'otro')),
    url                 TEXT,
    archivo_url         TEXT,
    estado              TEXT NOT NULL DEFAULT 'pendiente'
                        CHECK (estado IN ('pendiente', 'en_revision', 'aprobada', 'rechazada')),
    revisado_por        TEXT,
    comentario_revision TEXT,
    fecha_revision      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- PASO 3: INDEXES
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_act_sdpa_docente  ON portal.actividades_sdpa(docente_email);
CREATE INDEX IF NOT EXISTS idx_act_sdpa_linea    ON portal.actividades_sdpa(linea);
CREATE INDEX IF NOT EXISTS idx_act_sdpa_fecha    ON portal.actividades_sdpa(fecha_inicio);

CREATE INDEX IF NOT EXISTS idx_prog_cert_docente ON portal.progreso_certificaciones(docente_email);
CREATE INDEX IF NOT EXISTS idx_prog_cert_hash    ON portal.progreso_certificaciones(verificacion_hash);

CREATE INDEX IF NOT EXISTS idx_evid_sdpa_docente ON portal.evidencias_sdpa(docente_email);
CREATE INDEX IF NOT EXISTS idx_evid_sdpa_cert    ON portal.evidencias_sdpa(certificacion_id);
CREATE INDEX IF NOT EXISTS idx_evid_sdpa_estado  ON portal.evidencias_sdpa(estado);

-- ---------------------------------------------------------------------------
-- PASO 4: VIEWS
-- ---------------------------------------------------------------------------

-- Vista resumen por docente
CREATE OR REPLACE VIEW portal.v_resumen_docente_sdpa AS
SELECT
    a.docente_email,
    COUNT(*) AS total_actividades,
    SUM(a.horas_cronologicas) AS total_horas,
    SUM(a.horas_cronologicas) FILTER (WHERE a.linea = 'integracion_tic') AS horas_tic,
    SUM(a.horas_cronologicas) FILTER (WHERE a.linea = 'docencia') AS horas_docencia,
    SUM(a.horas_cronologicas) FILTER (WHERE a.linea = 'investigacion') AS horas_investigacion,
    COUNT(*) FILTER (WHERE a.estado = 'completada') AS actividades_completadas,
    MIN(a.fecha_inicio) AS primera_actividad,
    MAX(a.fecha_termino) AS ultima_actividad,
    (SELECT COUNT(*) FROM portal.progreso_certificaciones pc
     WHERE pc.docente_email = a.docente_email AND pc.estado = 'certificado') AS certificaciones_obtenidas
FROM portal.actividades_sdpa a
WHERE a.estado = 'completada'
GROUP BY a.docente_email;

-- Vista progreso hacia certificaciones
CREATE OR REPLACE VIEW portal.v_progreso_certificaciones AS
SELECT
    pc.docente_email,
    c.slug AS certificacion_slug,
    c.nombre AS certificacion_nombre,
    c.horas_requeridas,
    pc.horas_acumuladas,
    ROUND((pc.horas_acumuladas / c.horas_requeridas * 100)::numeric, 1) AS porcentaje_avance,
    pc.estado,
    pc.evidencia_estado,
    pc.proyecto_estado,
    pc.fecha_certificacion,
    c.prerequisito_id,
    (SELECT pc2.estado FROM portal.progreso_certificaciones pc2
     WHERE pc2.docente_email = pc.docente_email
       AND pc2.certificacion_id = c.prerequisito_id) AS estado_prerequisito
FROM portal.progreso_certificaciones pc
JOIN portal.certificaciones_sdpa c ON c.id = pc.certificacion_id
WHERE c.activa = true;

-- ---------------------------------------------------------------------------
-- PASO 5: ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

ALTER TABLE portal.actividades_sdpa ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal.certificaciones_sdpa ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal.progreso_certificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal.evidencias_sdpa ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- actividades_sdpa
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='portal' AND tablename='actividades_sdpa' AND policyname='Public read actividades_sdpa') THEN
        CREATE POLICY "Public read actividades_sdpa" ON portal.actividades_sdpa FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='portal' AND tablename='actividades_sdpa' AND policyname='Service write actividades_sdpa') THEN
        CREATE POLICY "Service write actividades_sdpa" ON portal.actividades_sdpa FOR ALL USING (current_setting('role') = 'service_role');
    END IF;

    -- certificaciones_sdpa
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='portal' AND tablename='certificaciones_sdpa' AND policyname='Public read certificaciones_sdpa') THEN
        CREATE POLICY "Public read certificaciones_sdpa" ON portal.certificaciones_sdpa FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='portal' AND tablename='certificaciones_sdpa' AND policyname='Service write certificaciones_sdpa') THEN
        CREATE POLICY "Service write certificaciones_sdpa" ON portal.certificaciones_sdpa FOR ALL USING (current_setting('role') = 'service_role');
    END IF;

    -- progreso_certificaciones
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='portal' AND tablename='progreso_certificaciones' AND policyname='Public read progreso_certificaciones') THEN
        CREATE POLICY "Public read progreso_certificaciones" ON portal.progreso_certificaciones FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='portal' AND tablename='progreso_certificaciones' AND policyname='Service write progreso_certificaciones') THEN
        CREATE POLICY "Service write progreso_certificaciones" ON portal.progreso_certificaciones FOR ALL USING (current_setting('role') = 'service_role');
    END IF;

    -- evidencias_sdpa
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='portal' AND tablename='evidencias_sdpa' AND policyname='Public read evidencias_sdpa') THEN
        CREATE POLICY "Public read evidencias_sdpa" ON portal.evidencias_sdpa FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='portal' AND tablename='evidencias_sdpa' AND policyname='Service write evidencias_sdpa') THEN
        CREATE POLICY "Service write evidencias_sdpa" ON portal.evidencias_sdpa FOR ALL USING (current_setting('role') = 'service_role');
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- PASO 6: GRANTS
-- ---------------------------------------------------------------------------

GRANT SELECT ON portal.actividades_sdpa TO anon, authenticated;
GRANT ALL ON portal.actividades_sdpa TO service_role;
GRANT ALL ON portal.actividades_sdpa_id_seq TO service_role;

GRANT SELECT ON portal.certificaciones_sdpa TO anon, authenticated;
GRANT ALL ON portal.certificaciones_sdpa TO service_role;
GRANT ALL ON portal.certificaciones_sdpa_id_seq TO service_role;

GRANT SELECT ON portal.progreso_certificaciones TO anon, authenticated;
GRANT ALL ON portal.progreso_certificaciones TO service_role;
GRANT ALL ON portal.progreso_certificaciones_id_seq TO service_role;

GRANT SELECT ON portal.evidencias_sdpa TO anon, authenticated;
GRANT ALL ON portal.evidencias_sdpa TO service_role;
GRANT ALL ON portal.evidencias_sdpa_id_seq TO service_role;

GRANT SELECT ON portal.v_resumen_docente_sdpa TO anon, authenticated, service_role;
GRANT SELECT ON portal.v_progreso_certificaciones TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- PASO 7: DATOS SEMILLA — 8 certificaciones
-- Ref: CURSO-VIRTUAL-SPEC.md seccion "Datos semilla (certificaciones_sdpa)"
-- ---------------------------------------------------------------------------

INSERT INTO portal.certificaciones_sdpa
    (slug, nombre, descripcion, horas_requeridas, creditos_sct, linea_principal,
     requiere_evidencia, requiere_proyecto, prerequisito_id, reglas_composicion)
VALUES
    ('tic_inicial',     'Certificacion TIC - Nivel Inicial',
     'Competencia digital docente nivel inicial',
     27, 1, 'integracion_tic', false, false, null, null),

    ('tic_intermedio',  'Certificacion TIC - Nivel Intermedio',
     'Competencia digital docente nivel intermedio',
     54, 2, 'integracion_tic', false, false, null, null),

    ('tic_avanzado',    'Certificacion TIC - Nivel Avanzado',
     'Competencia digital docente nivel avanzado. Requiere evidencia pedagogica.',
     81, 3, 'integracion_tic', true, false, null, null),

    ('ruta_ia_1',       'Ruta IA - Nivel 1 Iniciacion',
     'Fundamentos y alfabetizacion digital con IA (4 cursos)',
     40, 1.5, 'integracion_tic', false, false, null,
     '{"cursos_requeridos": ["ia_intro_alfabetizacion", "ia_etica", "ia_generativa_primeros_pasos", "ia_ciudadania_digital"]}'::jsonb),

    ('ruta_ia_2',       'Ruta IA - Nivel 2 Aplicacion',
     'Integracion pedagogica y eficiencia con IA (4 cursos)',
     44, 1.6, 'integracion_tic', false, false, null,
     '{"cursos_requeridos": ["ia_recursos_educativos", "ia_automatizacion", "ia_evaluacion_retroalimentacion", "ia_inclusion"]}'::jsonb),

    ('ruta_ia_3',       'Ruta IA - Nivel 3 Integracion',
     'Innovacion y liderazgo pedagogico con IA (4 cursos)',
     48, 1.8, 'integracion_tic', false, false, null,
     '{"cursos_requeridos": ["ia_personalizacion", "ia_diseno_instruccional", "ia_investigacion", "ia_liderazgo_comunidades"]}'::jsonb),

    ('diplomado_docencia_ia',   'Diplomado en Docencia Universitaria - Mencion Investigacion-Accion',
     'Diplomado formal UMCE (8 SCT)',
     216, 8, 'docencia', false, true, null,
     '{"creditos_area_principal": 4, "creditos_transversalidad": 1, "creditos_proyecto": 3}'::jsonb),

    ('diplomado_docencia_curr', 'Diplomado en Docencia Universitaria - Mencion Procesos Curriculares',
     'Diplomado formal UMCE (8 SCT)',
     216, 8, 'docencia', false, true, null,
     '{"creditos_area_principal": 4, "creditos_transversalidad": 1, "creditos_proyecto": 3}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- Prerequisitos (se aplican despues del INSERT porque necesitan los IDs)
-- tic_intermedio requiere tic_inicial
UPDATE portal.certificaciones_sdpa SET prerequisito_id = (
    SELECT id FROM portal.certificaciones_sdpa WHERE slug = 'tic_inicial'
) WHERE slug = 'tic_intermedio' AND prerequisito_id IS NULL;

-- tic_avanzado requiere tic_intermedio
UPDATE portal.certificaciones_sdpa SET prerequisito_id = (
    SELECT id FROM portal.certificaciones_sdpa WHERE slug = 'tic_intermedio'
) WHERE slug = 'tic_avanzado' AND prerequisito_id IS NULL;

-- ruta_ia_2 requiere ruta_ia_1
UPDATE portal.certificaciones_sdpa SET prerequisito_id = (
    SELECT id FROM portal.certificaciones_sdpa WHERE slug = 'ruta_ia_1'
) WHERE slug = 'ruta_ia_2' AND prerequisito_id IS NULL;

-- ruta_ia_3 requiere ruta_ia_2
UPDATE portal.certificaciones_sdpa SET prerequisito_id = (
    SELECT id FROM portal.certificaciones_sdpa WHERE slug = 'ruta_ia_2'
) WHERE slug = 'ruta_ia_3' AND prerequisito_id IS NULL;
