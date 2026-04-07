-- =============================================================================
-- User Badges / Insignias del Estudiante — Schema SQL Migration (Evolutiva)
-- Supabase Self-Hosted (supabase.udfv.cloud) — schema portal
-- Created:  2026-03-26
-- Updated:  2026-03-26 — Migration evolutiva: lleva el schema inicial al target
--                        definido en CURSO-VIRTUAL-SPEC.md (lineas 985-1070)
-- IDEMPOTENTE: puede re-ejecutarse sin errores. NO borra columnas existentes.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PASO 1: CREATE TABLES (si no existen — primera ejecucion)
-- ---------------------------------------------------------------------------

-- badge_definitions — catálogo de badges disponibles
CREATE TABLE IF NOT EXISTS portal.badge_definitions (
    id                  SERIAL PRIMARY KEY,
    badge_type          VARCHAR NOT NULL,
    badge_level         VARCHAR,
    title               VARCHAR NOT NULL,
    description         TEXT,
    icon_name           VARCHAR DEFAULT 'award',
    color               VARCHAR DEFAULT '#0033A1',
    criteria            TEXT,
    hours_required      INT,
    display_order       INT DEFAULT 0,
    active              BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- user_badges — insignias otorgadas a usuarios
CREATE TABLE IF NOT EXISTS portal.user_badges (
    id                  SERIAL PRIMARY KEY,
    user_email          VARCHAR NOT NULL,
    badge_type          VARCHAR NOT NULL CHECK (badge_type IN (
        'certificacion_tic',
        'ruta_ia',
        'capacitacion',
        'curso_completado',
        'mentor',
        'innovacion'
    )),
    badge_level         VARCHAR CHECK (badge_level IN ('inicial', 'intermedio', 'avanzado', NULL)),
    title               VARCHAR NOT NULL,
    description         TEXT,
    icon_name           VARCHAR DEFAULT 'award',
    color               VARCHAR DEFAULT '#0033A1',
    course_id           INT REFERENCES portal.courses(id),
    program_id          INT REFERENCES portal.programs(id),
    moodle_course_id    INT,
    moodle_platform     VARCHAR,
    earned_at           TIMESTAMPTZ DEFAULT now(),
    verified_by         VARCHAR,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- PASO 1b: Relajar CHECK constraint en user_badges.badge_type
-- El schema viejo solo permitia 6 valores; ahora la clasificacion se hace via
-- badge_definitions.categoria. Eliminamos el CHECK restrictivo.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'portal.user_badges'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%badge_type%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE portal.user_badges DROP CONSTRAINT %I', constraint_name);
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- PASO 2: ALTER badge_definitions — agregar columnas del schema objetivo
-- ---------------------------------------------------------------------------

-- slug: identificador unico legible ('nucleo_completado', 'nivel_inicial_tic', etc.)
ALTER TABLE portal.badge_definitions
    ADD COLUMN IF NOT EXISTS slug TEXT;

-- categoria: clasificacion semantica del badge
-- Se hace en bloque DO para poder usar IF NOT EXISTS semanticamente
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'portal'
          AND table_name   = 'badge_definitions'
          AND column_name  = 'categoria'
    ) THEN
        ALTER TABLE portal.badge_definitions
            ADD COLUMN categoria TEXT CHECK (categoria IN ('curso', 'modulo', 'trayectoria', 'manual'));
    END IF;
END $$;

-- regla_auto: condiciones JSON para otorgamiento automatico (null = manual)
ALTER TABLE portal.badge_definitions
    ADD COLUMN IF NOT EXISTS regla_auto JSONB;

-- ---------------------------------------------------------------------------
-- PASO 3: Poblar slug y categoria en registros existentes (semillas viejas)
-- Mapeo conservador: badge_type existente → slug/categoria del nuevo schema
-- ---------------------------------------------------------------------------
-- Migrar registros viejos que aun no tengan slug/categoria
UPDATE portal.badge_definitions SET
    slug      = 'mencion_especial',
    categoria = 'manual'
WHERE badge_type = 'innovacion' AND badge_level IS NULL AND slug IS NULL;

UPDATE portal.badge_definitions SET
    slug      = 'innovador',
    categoria = 'manual'
WHERE badge_type = 'innovacion' AND slug IS NULL;

-- Limpiar registros SDPA legacy: los que tenian categoria='sdpa' se eliminan
-- porque ahora viven en schema-sdpa.sql (sistema separado del docente)
DELETE FROM portal.badge_definitions WHERE categoria = 'sdpa';

-- Cualquier fila sin slug ni categoria aun: fallback conservador
UPDATE portal.badge_definitions SET
    slug      = COALESCE(slug, 'badge_legacy_' || id::TEXT),
    categoria = COALESCE(categoria, 'manual')
WHERE slug IS NULL OR categoria IS NULL;

-- Ahora que todos los registros tienen slug, aplicar UNIQUE y NOT NULL
DO $$
BEGIN
    -- NOT NULL en slug
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'portal'
          AND table_name   = 'badge_definitions'
          AND column_name  = 'slug'
          AND is_nullable  = 'NO'
    ) THEN
        ALTER TABLE portal.badge_definitions ALTER COLUMN slug SET NOT NULL;
    END IF;

    -- UNIQUE constraint en slug (si no existe ya)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'portal.badge_definitions'::regclass
          AND contype   = 'u'
          AND conname   = 'badge_definitions_slug_key'
    ) THEN
        ALTER TABLE portal.badge_definitions ADD CONSTRAINT badge_definitions_slug_key UNIQUE (slug);
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- PASO 4: ALTER user_badges — agregar columnas del schema objetivo
-- ---------------------------------------------------------------------------

-- badge_definition_id: FK al catálogo de badges (nueva relacion)
ALTER TABLE portal.user_badges
    ADD COLUMN IF NOT EXISTS badge_definition_id INTEGER REFERENCES portal.badge_definitions(id);

-- piac_link_id: FK al PIAC donde se logro el badge (null = trayectoria/manual)
ALTER TABLE portal.user_badges
    ADD COLUMN IF NOT EXISTS piac_link_id INTEGER REFERENCES portal.piac_links(id);

-- nucleo_numero: numero de nucleo donde aplica (null si no aplica)
ALTER TABLE portal.user_badges
    ADD COLUMN IF NOT EXISTS nucleo_numero INTEGER;

-- (horas_cronologicas y programa_sdpa removidos — viven en schema-sdpa.sql)

-- granted_by: 'system' para automaticos, email del admin para manuales
ALTER TABLE portal.user_badges
    ADD COLUMN IF NOT EXISTS granted_by TEXT;

-- nota: nota opcional del DI/admin al otorgar el badge
ALTER TABLE portal.user_badges
    ADD COLUMN IF NOT EXISTS nota TEXT;

-- verificacion_hash: hash unico para URL publica umce.online/badge/{hash}
ALTER TABLE portal.user_badges
    ADD COLUMN IF NOT EXISTS verificacion_hash TEXT;

-- credential_json: Verifiable Credential firmado (Open Badges 3.0 / W3C VC)
ALTER TABLE portal.user_badges
    ADD COLUMN IF NOT EXISTS credential_json JSONB;

-- badge_image_url: SVG/PNG con JSON-LD embebido (OB 3.0 baked badge)
ALTER TABLE portal.user_badges
    ADD COLUMN IF NOT EXISTS badge_image_url TEXT;

-- granted_at: alias semantico de earned_at para el nuevo schema
-- (se mantiene earned_at para compatibilidad; granted_at como columna adicional)
ALTER TABLE portal.user_badges
    ADD COLUMN IF NOT EXISTS granted_at TIMESTAMPTZ;

-- Poblar granted_at desde earned_at en registros existentes
UPDATE portal.user_badges SET granted_at = earned_at WHERE granted_at IS NULL AND earned_at IS NOT NULL;

-- UNIQUE constraint compuesto para evitar duplicados
-- Solo se agrega si no existe ya (badge_definition_id puede ser NULL aun en filas viejas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'portal.user_badges'::regclass
          AND contype   = 'u'
          AND conname   = 'user_badges_unique_otorgamiento'
    ) THEN
        ALTER TABLE portal.user_badges
            ADD CONSTRAINT user_badges_unique_otorgamiento
            UNIQUE (user_email, badge_definition_id, piac_link_id, nucleo_numero);
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- PASO 5: INDEXES nuevos
-- ---------------------------------------------------------------------------

-- Indices originales (idempotentes por IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_user_badges_email        ON portal.user_badges (user_email);
CREATE INDEX IF NOT EXISTS idx_user_badges_type         ON portal.user_badges (badge_type);
CREATE INDEX IF NOT EXISTS idx_user_badges_email_type   ON portal.user_badges (user_email, badge_type);
CREATE INDEX IF NOT EXISTS idx_badge_definitions_type   ON portal.badge_definitions (badge_type, badge_level);

-- Indices del schema objetivo (spec lineas 1034-1038)
CREATE INDEX IF NOT EXISTS idx_ub_user       ON portal.user_badges (user_email);
CREATE INDEX IF NOT EXISTS idx_ub_badge      ON portal.user_badges (badge_definition_id);
CREATE INDEX IF NOT EXISTS idx_ub_piac       ON portal.user_badges (piac_link_id)   WHERE piac_link_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ub_hash       ON portal.user_badges (verificacion_hash);
-- idx_ub_sdpa removido — programa_sdpa ahora vive en schema-sdpa.sql

-- Indice para slug en badge_definitions (busqueda frecuente)
CREATE INDEX IF NOT EXISTS idx_badge_def_slug      ON portal.badge_definitions (slug);
CREATE INDEX IF NOT EXISTS idx_badge_def_categoria ON portal.badge_definitions (categoria);

-- PASO 6: mv_progreso_sdpa REMOVIDO — ahora vive en schema-sdpa.sql
-- Las vistas de progreso docente (v_resumen_docente_sdpa, v_progreso_certificaciones)
-- estan definidas en el schema separado del sistema de desarrollo profesional.
DROP MATERIALIZED VIEW IF EXISTS portal.mv_progreso_sdpa;

-- ---------------------------------------------------------------------------
-- PASO 7: Seeds — 12 badge_definitions del estudiante con ON CONFLICT (slug) DO NOTHING
-- (Las insignias SDPA/docente ahora viven en schema-sdpa.sql)
-- ---------------------------------------------------------------------------
INSERT INTO portal.badge_definitions
    (slug, badge_type, badge_level, title, description, icon_name, color,
     categoria, regla_auto, display_order, active)
VALUES
    -- === INSIGNIAS DE CURSO (estudiante) ===
    ('nucleo_completado',    'curso_completado', NULL,         'Nucleo completado',
     'Completaste todas las actividades obligatorias de este nucleo',
     'shield-check', '#16a34a', 'curso',      '{"type": "nucleo_100"}'::jsonb,                          1,  true),

    ('curso_completado',     'curso_completado', NULL,         'Curso completado',
     'Completaste todos los nucleos del curso',
     'star',         '#eab308', 'curso',      '{"type": "curso_100"}'::jsonb,                           2,  true),

    ('participacion_activa', 'capacitacion',     NULL,         'Participacion activa',
     'Participaste en al menos el 80% de los foros del curso',
     'message-circle','#8b5cf6','curso',      '{"type": "foro_80"}'::jsonb,                             3,  true),

    ('entrega_puntual',      'capacitacion',     NULL,         'Entrega puntual',
     'Entregaste todas las evaluaciones antes de la fecha limite',
     'clock',        '#06b6d4', 'curso',      '{"type": "entregas_a_tiempo"}'::jsonb,                   4,  true),

    ('primera_evaluacion',   'capacitacion',     NULL,         'Primera evaluacion',
     'Recibiste tu primera calificacion en este curso',
     'pencil',       '#f97316', 'curso',      '{"type": "primera_nota"}'::jsonb,                        5,  true),

    ('nota_destacada',       'curso_completado', NULL,         'Nota destacada',
     'Obtuviste un promedio igual o superior al umbral de excelencia',
     'medal',        '#dc2626', 'curso',      '{"type": "promedio_sobre_umbral", "threshold": 6.0}'::jsonb, 6, true),

    -- === INSIGNIAS DE MODULO ===
    ('modulo_completado',    'curso_completado', NULL,         'Modulo completado',
     'Completaste esta asignatura/modulo con calificacion aprobatoria',
     'badge-check',  '#0d9488', 'modulo',     '{"type": "modulo_aprobado"}'::jsonb,                     7,  true),

    -- === INSIGNIAS DE TRAYECTORIA ===
    ('primer_curso_completado','curso_completado',NULL,        'Primer curso virtual',
     'Completaste tu primer curso en UMCE Online',
     'rocket',       '#2563eb', 'trayectoria','{"type": "total_cursos_completados", "threshold": 1}'::jsonb, 10, true),

    ('semestre_completo',    'curso_completado', NULL,         'Semestre completo',
     'Completaste todos los cursos del semestre',
     'calendar-check','#059669','trayectoria','{"type": "semestre_100"}'::jsonb,                        11, true),

    ('explorador',           'capacitacion',     NULL,         'Explorador',
     'Accediste a cursos en 2 o mas plataformas Moodle',
     'compass',      '#7c3aed', 'trayectoria','{"type": "plataformas_distintas", "threshold": 2}'::jsonb, 12, true),

    -- === INSIGNIAS MANUALES (admin/DI) ===
    ('mencion_especial',     'innovacion',       NULL,         'Mencion especial',
     'Reconocimiento por trabajo destacado',
     'sparkles',     '#f59e0b', 'manual',     NULL,                                                     30, true),

    ('innovador',            'innovacion',       NULL,         'Innovador',
     'Completaste un proyecto de innovacion educativa',
     'lightbulb',    '#84cc16', 'manual',     NULL,                                                     31, true)

ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- PASO 8: ROW LEVEL SECURITY
-- (Las politicas originales se crean solo si no existen)
-- ---------------------------------------------------------------------------
ALTER TABLE portal.user_badges      ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal.badge_definitions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'portal' AND tablename = 'user_badges'
          AND policyname = 'Public read user_badges'
    ) THEN
        CREATE POLICY "Public read user_badges"
            ON portal.user_badges FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'portal' AND tablename = 'user_badges'
          AND policyname = 'Service write user_badges'
    ) THEN
        CREATE POLICY "Service write user_badges"
            ON portal.user_badges FOR ALL
            USING (current_setting('role') = 'service_role');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'portal' AND tablename = 'badge_definitions'
          AND policyname = 'Public read badge_definitions'
    ) THEN
        CREATE POLICY "Public read badge_definitions"
            ON portal.badge_definitions FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'portal' AND tablename = 'badge_definitions'
          AND policyname = 'Service write badge_definitions'
    ) THEN
        CREATE POLICY "Service write badge_definitions"
            ON portal.badge_definitions FOR ALL
            USING (current_setting('role') = 'service_role');
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- PASO 9: GRANTS
-- ---------------------------------------------------------------------------
GRANT SELECT ON portal.user_badges       TO anon, authenticated;
GRANT ALL    ON portal.user_badges       TO service_role;
GRANT ALL    ON portal.user_badges_id_seq TO service_role;

GRANT SELECT ON portal.badge_definitions       TO anon, authenticated;
GRANT ALL    ON portal.badge_definitions       TO service_role;
GRANT ALL    ON portal.badge_definitions_id_seq TO service_role;

-- GRANT mv_progreso_sdpa removido — vista ahora en schema-sdpa.sql
