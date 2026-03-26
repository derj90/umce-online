-- =============================================================================
-- Curso Virtual — Schema SQL Migration
-- Supabase Self-Hosted (supabase.udfv.cloud) — schema portal
-- Created: 2026-03-25
-- Fase 3: Visado + Curso virtual del estudiante
-- =============================================================================

-- ---------------------------------------------------------------------------
-- CURSO_VIRTUAL_CONFIG — configuracion del DI para el curso virtual
-- Un registro por piac_link (1:1)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.curso_virtual_config (
    id                          SERIAL PRIMARY KEY,
    piac_link_id                INT NOT NULL REFERENCES portal.piac_links(id) ON DELETE CASCADE,

    -- Docente (QM 1.1)
    docente_foto_url            TEXT,
    docente_bio                 TEXT,
    docente_video_bienvenida    TEXT,
    docente_mensaje_bienvenida  TEXT,
    docente_horario_atencion    TEXT DEFAULT 'Consultar por email',
    docente_tiempos_respuesta   JSONB DEFAULT '{"email": "48h hábiles", "foro": "48h hábiles", "tareas": "7 días hábiles"}',

    -- Curso (QM 1.1, 1.2)
    descripcion_motivacional    TEXT,
    conocimientos_previos       TEXT DEFAULT 'Sin requisitos previos específicos',
    competencias_digitales      TEXT DEFAULT 'Manejo básico de navegador web, correo electrónico y videoconferencia (Zoom)',

    -- Politicas (QM 1.2, 3.5, 5.5)
    politicas_curso             TEXT,
    politica_integridad         TEXT,
    requisitos_participacion    TEXT,

    -- Foros vinculados (QM 1.1, 5.3)
    foro_presentacion_cmid      INT,
    foro_consultas_cmid         INT,

    -- Configuracion por actividad (JSONB indexado por cmid de Moodle)
    -- Formato: { "cmid_123": { "tiempo_estimado_min": 45, "obligatorio": true, "objetivo_semana": "texto..." } }
    actividades_config          JSONB DEFAULT '{}',

    -- Objetivos por semana (JSONB indexado por numero de semana)
    -- Formato: { "3": "Identificar y evaluar fuentes académicas relevantes", "4": "..." }
    objetivos_semanales         JSONB DEFAULT '{}',

    -- Estado de publicacion
    publicado                   BOOLEAN DEFAULT false,
    publicado_at                TIMESTAMPTZ,
    publicado_por               TEXT,

    created_at                  TIMESTAMPTZ DEFAULT now(),
    updated_at                  TIMESTAMPTZ DEFAULT now(),
    updated_by                  TEXT,

    UNIQUE(piac_link_id)
);

-- ---------------------------------------------------------------------------
-- INSTITUTIONAL_DEFAULTS — textos institucionales por defecto
-- Se usan cuando el DI no configura un campo
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.institutional_defaults (
    id          SERIAL PRIMARY KEY,
    key         TEXT NOT NULL UNIQUE,
    value       TEXT NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT now(),
    updated_by  TEXT
);

-- Insertar defaults institucionales iniciales
INSERT INTO portal.institutional_defaults (key, value) VALUES
    ('politicas_curso', 'La asistencia a las sesiones sincrónicas es obligatoria (mínimo 75%). Las entregas fuera de plazo serán aceptadas con un máximo de 48 horas de retraso y penalización de 1 punto. Se espera participación respetuosa en foros y clases.'),
    ('politica_integridad', 'La UMCE promueve la integridad académica. Todo trabajo debe ser original. El plagio, la copia y el uso no declarado de herramientas de inteligencia artificial constituyen faltas graves según el reglamento institucional.'),
    ('competencias_digitales', 'Manejo básico de navegador web, correo electrónico y videoconferencia (Zoom).'),
    ('conocimientos_previos', 'Sin requisitos previos específicos.'),
    ('docente_horario_atencion', 'Consultar por email.'),
    ('docente_tiempos_respuesta', '{"email": "48h hábiles", "foro": "48h hábiles", "tareas": "7 días hábiles"}')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cvc_piac_link ON portal.curso_virtual_config (piac_link_id);
CREATE INDEX IF NOT EXISTS idx_cvc_publicado ON portal.curso_virtual_config (publicado) WHERE publicado = true;

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
ALTER TABLE portal.curso_virtual_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read curso_virtual_config" ON portal.curso_virtual_config FOR SELECT USING (true);
CREATE POLICY "Service write curso_virtual_config" ON portal.curso_virtual_config FOR ALL USING (current_setting('role') = 'service_role');

ALTER TABLE portal.institutional_defaults ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read institutional_defaults" ON portal.institutional_defaults FOR SELECT USING (true);
CREATE POLICY "Service write institutional_defaults" ON portal.institutional_defaults FOR ALL USING (current_setting('role') = 'service_role');

-- ---------------------------------------------------------------------------
-- GRANTS
-- ---------------------------------------------------------------------------
GRANT SELECT ON portal.curso_virtual_config TO anon, authenticated;
GRANT ALL ON portal.curso_virtual_config TO service_role;
GRANT ALL ON portal.curso_virtual_config_id_seq TO service_role;

GRANT SELECT ON portal.institutional_defaults TO anon, authenticated;
GRANT ALL ON portal.institutional_defaults TO service_role;
GRANT ALL ON portal.institutional_defaults_id_seq TO service_role;
