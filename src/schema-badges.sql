-- =============================================================================
-- User Badges / Insignias SDPA — Schema SQL Migration
-- Supabase Self-Hosted (supabase.udfv.cloud) — schema portal
-- Created: 2026-03-26
-- Sistema de insignias para progreso docente en SDPA
-- =============================================================================

-- ---------------------------------------------------------------------------
-- USER_BADGES — insignias/logros de docentes y académicos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.user_badges (
    id                  SERIAL PRIMARY KEY,
    user_email          VARCHAR NOT NULL,
    badge_type          VARCHAR NOT NULL CHECK (badge_type IN (
        'certificacion_tic',     -- Certificación competencias digitales (3 niveles)
        'ruta_ia',               -- Ruta Formativa IA (12 cursos, 3 niveles)
        'capacitacion',          -- Curso de capacitación UDFV completado
        'curso_completado',      -- Curso regular completado (como docente)
        'mentor',                -- Participación como mentor SDPA
        'innovacion'             -- Proyecto de innovación docente
    )),
    badge_level         VARCHAR CHECK (badge_level IN ('inicial', 'intermedio', 'avanzado', NULL)),
    title               VARCHAR NOT NULL,
    description         TEXT,
    icon_name           VARCHAR DEFAULT 'award',  -- Lucide icon name
    color               VARCHAR DEFAULT '#0033A1', -- Badge color (hex)
    course_id           INT REFERENCES portal.courses(id),
    program_id          INT REFERENCES portal.programs(id),
    moodle_course_id    INT,
    moodle_platform     VARCHAR,
    earned_at           TIMESTAMPTZ DEFAULT now(),
    verified_by         VARCHAR,  -- email del verificador
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- BADGE_DEFINITIONS — catálogo de badges disponibles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.badge_definitions (
    id                  SERIAL PRIMARY KEY,
    badge_type          VARCHAR NOT NULL,
    badge_level         VARCHAR,
    title               VARCHAR NOT NULL,
    description         TEXT,
    icon_name           VARCHAR DEFAULT 'award',
    color               VARCHAR DEFAULT '#0033A1',
    criteria            TEXT,  -- Texto legible de los criterios para obtener el badge
    hours_required      INT,   -- Horas de formación requeridas (si aplica)
    display_order       INT DEFAULT 0,
    active              BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- Insertar definiciones iniciales de badges
INSERT INTO portal.badge_definitions (badge_type, badge_level, title, description, icon_name, color, criteria, hours_required, display_order) VALUES
    ('certificacion_tic', 'inicial', 'Competencias Digitales — Nivel Inicial', 'Certificación en competencias digitales docentes nivel inicial (Marco TPACK)', 'shield-check', '#0033A1', 'Completar 27 horas de formación en 3 dominios × 4 ámbitos del Marco de Competencias TIC UMCE', 27, 1),
    ('certificacion_tic', 'intermedio', 'Competencias Digitales — Nivel Intermedio', 'Certificación en competencias digitales docentes nivel intermedio', 'shield-check', '#FF9E18', 'Completar 54 horas de formación (nivel inicial + intermedio) en competencias TIC', 54, 2),
    ('certificacion_tic', 'avanzado', 'Competencias Digitales — Nivel Avanzado', 'Certificación en competencias digitales docentes nivel avanzado', 'shield-check', '#059669', 'Completar 81 horas de formación (3 niveles) en competencias TIC', 81, 3),
    ('ruta_ia', 'inicial', 'Ruta Formativa IA — Nivel Básico', 'Alfabetización e integración básica de IA en educación (4 cursos, 40h)', 'brain', '#7C3AED', 'Completar cursos 1-4 de la Ruta Formativa IA', 40, 4),
    ('ruta_ia', 'intermedio', 'Ruta Formativa IA — Nivel Intermedio', 'Diseño instruccional y evaluación con IA (4 cursos, 44h)', 'brain', '#7C3AED', 'Completar cursos 5-8 de la Ruta Formativa IA', 84, 5),
    ('ruta_ia', 'avanzado', 'Ruta Formativa IA — Nivel Avanzado', 'Liderazgo e investigación con IA en educación (4 cursos, 48h)', 'brain', '#7C3AED', 'Completar los 12 cursos de la Ruta Formativa IA (132h total)', 132, 6),
    ('capacitacion', NULL, 'Capacitación UDFV', 'Curso de capacitación completado en la Unidad de Desarrollo y Formación Virtual', 'book-open', '#0033A1', NULL, NULL, 10),
    ('mentor', NULL, 'Mentor SDPA', 'Participación como mentor en el Sistema de Desarrollo Profesional Académico', 'users', '#B45309', 'Participar activamente como mentor en al menos un ciclo del programa de mentoría', NULL, 20),
    ('innovacion', NULL, 'Innovación Docente', 'Proyecto de innovación en docencia desarrollado y presentado', 'lightbulb', '#EA580C', 'Desarrollar y presentar un proyecto de innovación docente', NULL, 30)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_badges_email ON portal.user_badges (user_email);
CREATE INDEX IF NOT EXISTS idx_user_badges_type ON portal.user_badges (badge_type);
CREATE INDEX IF NOT EXISTS idx_user_badges_email_type ON portal.user_badges (user_email, badge_type);
CREATE INDEX IF NOT EXISTS idx_badge_definitions_type ON portal.badge_definitions (badge_type, badge_level);

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
ALTER TABLE portal.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read user_badges" ON portal.user_badges FOR SELECT USING (true);
CREATE POLICY "Service write user_badges" ON portal.user_badges FOR ALL USING (current_setting('role') = 'service_role');

ALTER TABLE portal.badge_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read badge_definitions" ON portal.badge_definitions FOR SELECT USING (true);
CREATE POLICY "Service write badge_definitions" ON portal.badge_definitions FOR ALL USING (current_setting('role') = 'service_role');

-- ---------------------------------------------------------------------------
-- GRANTS
-- ---------------------------------------------------------------------------
GRANT SELECT ON portal.user_badges TO anon, authenticated;
GRANT ALL ON portal.user_badges TO service_role;
GRANT ALL ON portal.user_badges_id_seq TO service_role;

GRANT SELECT ON portal.badge_definitions TO anon, authenticated;
GRANT ALL ON portal.badge_definitions TO service_role;
GRANT ALL ON portal.badge_definitions_id_seq TO service_role;
