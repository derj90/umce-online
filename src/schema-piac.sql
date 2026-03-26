-- =============================================================================
-- PIAC System — Schema SQL Migration
-- Supabase Self-Hosted (supabase.udfv.cloud) — schema portal
-- Created: 2026-03-25
-- Fase 2: Lector PIAC + Lector Moodle + Matching
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PIAC LINKS — vinculo entre un PIAC (Google Drive) y un curso Moodle
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.piac_links (
    id                  SERIAL PRIMARY KEY,
    program_id          INT REFERENCES portal.programs(id),
    moodle_course_id    INT NOT NULL,
    moodle_platform     VARCHAR NOT NULL,
    drive_file_id       VARCHAR,
    drive_url           TEXT NOT NULL,
    course_name         VARCHAR,
    linked_by           VARCHAR NOT NULL,
    status              VARCHAR NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- PIAC PARSED — estructura JSON extraida del Word via LLM
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.piac_parsed (
    id                  SERIAL PRIMARY KEY,
    piac_link_id        INT NOT NULL REFERENCES portal.piac_links(id) ON DELETE CASCADE,
    version             INT NOT NULL DEFAULT 1,
    raw_text            TEXT,
    parsed_json         JSONB,
    llm_model           VARCHAR,
    tokens_used         INT,
    parsed_at           TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- MOODLE SNAPSHOTS — snapshot de la estructura del curso Moodle
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.moodle_snapshots (
    id                  SERIAL PRIMARY KEY,
    piac_link_id        INT NOT NULL REFERENCES portal.piac_links(id) ON DELETE CASCADE,
    sections_count      INT DEFAULT 0,
    activities_count    INT DEFAULT 0,
    snapshot_json       JSONB,
    snapshot_at         TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- MATCHING RESULTS — resultado del matching PIAC <-> Moodle
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.matching_results (
    id                  SERIAL PRIMARY KEY,
    piac_link_id        INT NOT NULL REFERENCES portal.piac_links(id) ON DELETE CASCADE,
    piac_parsed_id      INT REFERENCES portal.piac_parsed(id) ON DELETE SET NULL,
    moodle_snapshot_id  INT REFERENCES portal.moodle_snapshots(id) ON DELETE SET NULL,
    matches_json        JSONB,
    summary_json        JSONB,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- DISCREPANCIES — discrepancias individuales detectadas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.discrepancies (
    id                  SERIAL PRIMARY KEY,
    matching_id         INT NOT NULL REFERENCES portal.matching_results(id) ON DELETE CASCADE,
    type                VARCHAR NOT NULL CHECK (type IN ('missing_in_moodle', 'missing_in_piac', 'mismatch')),
    severity            VARCHAR NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
    piac_element        TEXT,
    moodle_element      TEXT,
    description         TEXT NOT NULL,
    resolved            BOOLEAN DEFAULT false,
    resolved_by         VARCHAR,
    resolved_at         TIMESTAMPTZ,
    resolution_type     VARCHAR CHECK (resolution_type IN ('linked_activity', 'external_url', 'dismissed', 'fixed_in_moodle')),
    resolution_note     TEXT,
    linked_cmid         INT,              -- Moodle course module ID vinculado
    linked_mod_name     VARCHAR,          -- modname del modulo vinculado (assign, url, quiz, etc.)
    linked_mod_title    VARCHAR,          -- nombre del modulo vinculado
    external_url        TEXT,             -- URL externa (Google Forms, Padlet, etc.)
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- Migration: add resolution columns if table already exists
ALTER TABLE portal.discrepancies ADD COLUMN IF NOT EXISTS resolution_type VARCHAR CHECK (resolution_type IN ('linked_activity', 'external_url', 'dismissed', 'fixed_in_moodle'));
ALTER TABLE portal.discrepancies ADD COLUMN IF NOT EXISTS resolution_note TEXT;
ALTER TABLE portal.discrepancies ADD COLUMN IF NOT EXISTS linked_cmid INT;
ALTER TABLE portal.discrepancies ADD COLUMN IF NOT EXISTS linked_mod_name VARCHAR;
ALTER TABLE portal.discrepancies ADD COLUMN IF NOT EXISTS linked_mod_title VARCHAR;
ALTER TABLE portal.discrepancies ADD COLUMN IF NOT EXISTS external_url TEXT;

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_piac_links_platform ON portal.piac_links (moodle_platform);
CREATE INDEX IF NOT EXISTS idx_piac_links_status ON portal.piac_links (status);
CREATE INDEX IF NOT EXISTS idx_piac_links_course ON portal.piac_links (moodle_platform, moodle_course_id);
CREATE INDEX IF NOT EXISTS idx_piac_parsed_link ON portal.piac_parsed (piac_link_id);
CREATE INDEX IF NOT EXISTS idx_moodle_snapshots_link ON portal.moodle_snapshots (piac_link_id);
CREATE INDEX IF NOT EXISTS idx_matching_results_link ON portal.matching_results (piac_link_id);
CREATE INDEX IF NOT EXISTS idx_discrepancies_matching ON portal.discrepancies (matching_id);
CREATE INDEX IF NOT EXISTS idx_discrepancies_severity ON portal.discrepancies (severity);
CREATE INDEX IF NOT EXISTS idx_discrepancies_unresolved ON portal.discrepancies (resolved) WHERE resolved = false;

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

-- piac_links
ALTER TABLE portal.piac_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read piac_links" ON portal.piac_links FOR SELECT USING (true);
CREATE POLICY "Service write piac_links" ON portal.piac_links FOR ALL USING (current_setting('role') = 'service_role');

-- piac_parsed
ALTER TABLE portal.piac_parsed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read piac_parsed" ON portal.piac_parsed FOR SELECT USING (true);
CREATE POLICY "Service write piac_parsed" ON portal.piac_parsed FOR ALL USING (current_setting('role') = 'service_role');

-- moodle_snapshots
ALTER TABLE portal.moodle_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read moodle_snapshots" ON portal.moodle_snapshots FOR SELECT USING (true);
CREATE POLICY "Service write moodle_snapshots" ON portal.moodle_snapshots FOR ALL USING (current_setting('role') = 'service_role');

-- matching_results
ALTER TABLE portal.matching_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read matching_results" ON portal.matching_results FOR SELECT USING (true);
CREATE POLICY "Service write matching_results" ON portal.matching_results FOR ALL USING (current_setting('role') = 'service_role');

-- discrepancies
ALTER TABLE portal.discrepancies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read discrepancies" ON portal.discrepancies FOR SELECT USING (true);
CREATE POLICY "Service write discrepancies" ON portal.discrepancies FOR ALL USING (current_setting('role') = 'service_role');

-- ---------------------------------------------------------------------------
-- GRANTS
-- ---------------------------------------------------------------------------
GRANT SELECT ON portal.piac_links TO anon, authenticated;
GRANT ALL ON portal.piac_links TO service_role;
GRANT ALL ON portal.piac_links_id_seq TO service_role;

GRANT SELECT ON portal.piac_parsed TO anon, authenticated;
GRANT ALL ON portal.piac_parsed TO service_role;
GRANT ALL ON portal.piac_parsed_id_seq TO service_role;

GRANT SELECT ON portal.moodle_snapshots TO anon, authenticated;
GRANT ALL ON portal.moodle_snapshots TO service_role;
GRANT ALL ON portal.moodle_snapshots_id_seq TO service_role;

GRANT SELECT ON portal.matching_results TO anon, authenticated;
GRANT ALL ON portal.matching_results TO service_role;
GRANT ALL ON portal.matching_results_id_seq TO service_role;

GRANT SELECT ON portal.discrepancies TO anon, authenticated;
GRANT ALL ON portal.discrepancies TO service_role;
GRANT ALL ON portal.discrepancies_id_seq TO service_role;
