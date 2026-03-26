-- =============================================================================
-- Bibliografia del Curso Virtual — Schema SQL Migration (Evolutiva)
-- Supabase Self-Hosted (supabase.udfv.cloud) — schema portal
-- Created: 2026-03-26
-- Spec: CURSO-VIRTUAL-SPEC.md lineas 1745-1833
-- IDEMPOTENTE: puede re-ejecutarse sin errores. NO borra columnas existentes.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PASO 1: CREATE TABLE (si no existe — primera ejecucion)
-- Usa TEXT + CHECK en lugar de CREATE TYPE para compatibilidad PostgREST
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.curso_virtual_bibliografia (
    id                  SERIAL PRIMARY KEY,
    piac_link_id        INTEGER NOT NULL REFERENCES portal.piac_links(id) ON DELETE CASCADE,

    -- Datos bibliograficos (obligatorios)
    titulo              TEXT NOT NULL,
    autores             TEXT NOT NULL,          -- formato APA: "Apellido, N., Apellido, N."
    anio_publicacion    INTEGER NOT NULL,

    -- Clasificacion
    tipo                TEXT NOT NULL DEFAULT 'otro' CHECK (tipo IN (
                            'libro', 'capitulo_libro', 'articulo_revista', 'articulo_conferencia',
                            'tesis', 'sitio_web', 'video', 'norma_ley', 'recurso_educativo_abierto', 'otro'
                        )),
    clasificacion       TEXT NOT NULL DEFAULT 'complementaria' CHECK (clasificacion IN ('obligatoria', 'complementaria')),
    nucleo_asociado     INTEGER,                -- numero de nucleo del PIAC (1, 2, 3...)
    idioma              TEXT DEFAULT 'es',      -- codigo ISO 639-1

    -- Identificadores y acceso
    url                 TEXT,                   -- link directo al recurso
    doi                 TEXT,                   -- Digital Object Identifier
    issn_isbn           TEXT,                   -- ISSN o ISBN
    acceso              TEXT DEFAULT 'restringido' CHECK (acceso IN (
                            'abierto', 'biblioteca_umce', 'suscripcion', 'restringido'
                        )),

    -- Validacion automatica
    url_status          TEXT DEFAULT 'no_verificado' CHECK (url_status IN (
                            'activo', 'roto', 'no_verificado', 'sin_url'
                        )),
    url_last_check      TIMESTAMPTZ,
    url_fail_count      INTEGER DEFAULT 0,      -- reintentos fallidos consecutivos
    doi_verificado      BOOLEAN DEFAULT false,
    doi_metadata        JSONB,                  -- metadatos de CrossRef (titulo confirmado, journal, etc.)
    doi_last_check      TIMESTAMPTZ,

    -- Vigencia
    es_clasico          BOOLEAN DEFAULT false,  -- marcado por DI: no caduca (ej: Piaget, Vygotsky)
    vigente             BOOLEAN GENERATED ALWAYS AS (
                            es_clasico OR (anio_publicacion >= EXTRACT(YEAR FROM now())::int - 5)
                        ) STORED,

    -- Fuente del dato
    origen              TEXT DEFAULT 'piac' CHECK (origen IN ('piac', 'di_manual', 'importado')),

    -- Audit
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),
    updated_by          TEXT
);

-- ---------------------------------------------------------------------------
-- PASO 2: ALTER — agregar columnas si la tabla ya existia (migration evolutiva)
-- ---------------------------------------------------------------------------

-- tipo
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'portal'
          AND table_name   = 'curso_virtual_bibliografia'
          AND column_name  = 'tipo'
    ) THEN
        ALTER TABLE portal.curso_virtual_bibliografia
            ADD COLUMN tipo TEXT NOT NULL DEFAULT 'otro' CHECK (tipo IN (
                'libro', 'capitulo_libro', 'articulo_revista', 'articulo_conferencia',
                'tesis', 'sitio_web', 'video', 'norma_ley', 'recurso_educativo_abierto', 'otro'
            ));
    END IF;
END $$;

-- clasificacion
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'portal'
          AND table_name   = 'curso_virtual_bibliografia'
          AND column_name  = 'clasificacion'
    ) THEN
        ALTER TABLE portal.curso_virtual_bibliografia
            ADD COLUMN clasificacion TEXT NOT NULL DEFAULT 'complementaria'
            CHECK (clasificacion IN ('obligatoria', 'complementaria'));
    END IF;
END $$;

ALTER TABLE portal.curso_virtual_bibliografia ADD COLUMN IF NOT EXISTS nucleo_asociado INTEGER;
ALTER TABLE portal.curso_virtual_bibliografia ADD COLUMN IF NOT EXISTS idioma TEXT DEFAULT 'es';
ALTER TABLE portal.curso_virtual_bibliografia ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE portal.curso_virtual_bibliografia ADD COLUMN IF NOT EXISTS doi TEXT;
ALTER TABLE portal.curso_virtual_bibliografia ADD COLUMN IF NOT EXISTS issn_isbn TEXT;

-- acceso
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'portal'
          AND table_name   = 'curso_virtual_bibliografia'
          AND column_name  = 'acceso'
    ) THEN
        ALTER TABLE portal.curso_virtual_bibliografia
            ADD COLUMN acceso TEXT DEFAULT 'restringido'
            CHECK (acceso IN ('abierto', 'biblioteca_umce', 'suscripcion', 'restringido'));
    END IF;
END $$;

-- url_status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'portal'
          AND table_name   = 'curso_virtual_bibliografia'
          AND column_name  = 'url_status'
    ) THEN
        ALTER TABLE portal.curso_virtual_bibliografia
            ADD COLUMN url_status TEXT DEFAULT 'no_verificado'
            CHECK (url_status IN ('activo', 'roto', 'no_verificado', 'sin_url'));
    END IF;
END $$;

ALTER TABLE portal.curso_virtual_bibliografia ADD COLUMN IF NOT EXISTS url_last_check TIMESTAMPTZ;
ALTER TABLE portal.curso_virtual_bibliografia ADD COLUMN IF NOT EXISTS url_fail_count INTEGER DEFAULT 0;
ALTER TABLE portal.curso_virtual_bibliografia ADD COLUMN IF NOT EXISTS doi_verificado BOOLEAN DEFAULT false;
ALTER TABLE portal.curso_virtual_bibliografia ADD COLUMN IF NOT EXISTS doi_metadata JSONB;
ALTER TABLE portal.curso_virtual_bibliografia ADD COLUMN IF NOT EXISTS doi_last_check TIMESTAMPTZ;
ALTER TABLE portal.curso_virtual_bibliografia ADD COLUMN IF NOT EXISTS es_clasico BOOLEAN DEFAULT false;
ALTER TABLE portal.curso_virtual_bibliografia ADD COLUMN IF NOT EXISTS origen TEXT DEFAULT 'piac' CHECK (origen IN ('piac', 'di_manual', 'importado'));
ALTER TABLE portal.curso_virtual_bibliografia ADD COLUMN IF NOT EXISTS updated_by TEXT;

-- Nota: la columna vigente GENERATED ALWAYS no puede agregarse via ALTER ADD COLUMN IF NOT EXISTS
-- si la tabla fue creada sin ella. Se maneja con un bloque DO:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'portal'
          AND table_name   = 'curso_virtual_bibliografia'
          AND column_name  = 'vigente'
    ) THEN
        ALTER TABLE portal.curso_virtual_bibliografia
            ADD COLUMN vigente BOOLEAN GENERATED ALWAYS AS (
                es_clasico OR (anio_publicacion >= EXTRACT(YEAR FROM now())::int - 5)
            ) STORED;
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- PASO 3: INDEXES
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_bib_piac_link  ON portal.curso_virtual_bibliografia (piac_link_id);
CREATE INDEX IF NOT EXISTS idx_bib_nucleo     ON portal.curso_virtual_bibliografia (piac_link_id, nucleo_asociado);
CREATE INDEX IF NOT EXISTS idx_bib_url_status ON portal.curso_virtual_bibliografia (url_status) WHERE url_status = 'roto';
CREATE INDEX IF NOT EXISTS idx_bib_vigente    ON portal.curso_virtual_bibliografia (vigente) WHERE vigente = false;

-- ---------------------------------------------------------------------------
-- PASO 4: MATERIALIZED VIEW mv_calidad_bibliografica
-- Se usa DROP + CREATE para que siempre quede actualizada al correr la migracion
-- ---------------------------------------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS portal.mv_calidad_bibliografica;

CREATE MATERIALIZED VIEW portal.mv_calidad_bibliografica AS
SELECT
    pl.id AS piac_link_id,
    pl.moodle_platform,
    pl.moodle_course_id,
    COUNT(*)                                                                                AS total_refs,
    COUNT(*) FILTER (WHERE b.clasificacion = 'obligatoria')                                AS refs_obligatorias,
    COUNT(*) FILTER (WHERE b.clasificacion = 'complementaria')                             AS refs_complementarias,
    ROUND(100.0 * COUNT(*) FILTER (WHERE b.vigente) / NULLIF(COUNT(*), 0), 1)             AS pct_vigentes,
    ROUND(100.0 * COUNT(*) FILTER (WHERE b.acceso = 'abierto') / NULLIF(COUNT(*), 0), 1)  AS pct_acceso_abierto,
    COUNT(*) FILTER (WHERE b.url_status = 'activo')                                        AS urls_activas,
    COUNT(*) FILTER (WHERE b.url_status = 'roto')                                          AS urls_rotas,
    COUNT(*) FILTER (WHERE b.doi_verificado)                                               AS dois_verificados,
    COUNT(DISTINCT b.nucleo_asociado)                                                       AS nucleos_con_refs,
    jsonb_object_agg(
        COALESCE(b.tipo::text, 'otro'),
        COUNT(*) FILTER (WHERE b.tipo IS NOT NULL)
    ) FILTER (WHERE b.tipo IS NOT NULL)                                                     AS distribucion_tipos,
    now()                                                                                   AS refreshed_at
FROM portal.piac_links pl
LEFT JOIN portal.curso_virtual_bibliografia b ON b.piac_link_id = pl.id
GROUP BY pl.id, pl.moodle_platform, pl.moodle_course_id;

CREATE UNIQUE INDEX idx_mv_calidad_piac ON portal.mv_calidad_bibliografica (piac_link_id);
-- Refresh: REFRESH MATERIALIZED VIEW CONCURRENTLY portal.mv_calidad_bibliografica;

-- ---------------------------------------------------------------------------
-- PASO 5: ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
ALTER TABLE portal.curso_virtual_bibliografia ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'portal' AND tablename = 'curso_virtual_bibliografia'
          AND policyname = 'Public read curso_virtual_bibliografia'
    ) THEN
        CREATE POLICY "Public read curso_virtual_bibliografia"
            ON portal.curso_virtual_bibliografia FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'portal' AND tablename = 'curso_virtual_bibliografia'
          AND policyname = 'Service write curso_virtual_bibliografia'
    ) THEN
        CREATE POLICY "Service write curso_virtual_bibliografia"
            ON portal.curso_virtual_bibliografia FOR ALL
            USING (current_setting('role') = 'service_role');
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- PASO 6: GRANTS
-- ---------------------------------------------------------------------------
GRANT SELECT ON portal.curso_virtual_bibliografia        TO anon, authenticated;
GRANT ALL    ON portal.curso_virtual_bibliografia        TO service_role;
GRANT ALL    ON portal.curso_virtual_bibliografia_id_seq TO service_role;

GRANT SELECT ON portal.mv_calidad_bibliografica TO anon, authenticated, service_role;
