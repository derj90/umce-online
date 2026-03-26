-- =============================================================================
-- Fase 4 — Cache, Notifications, User Mapping
-- Supabase Self-Hosted (supabase.udfv.cloud) — schema portal
-- Created: 2026-03-26
-- =============================================================================

-- ---------------------------------------------------------------------------
-- USER_MOODLE_MAPPING — mapeo email UMCE → userid en cada plataforma Moodle
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.user_moodle_mapping (
    id                  SERIAL PRIMARY KEY,
    umce_email          TEXT NOT NULL,
    moodle_platform     TEXT NOT NULL,
    moodle_userid       INT NOT NULL,
    moodle_username     TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(umce_email, moodle_platform)
);

-- ---------------------------------------------------------------------------
-- CACHE TABLES — datos de Moodle cacheados para evitar llamadas en tiempo real
-- ---------------------------------------------------------------------------

-- Completions por estudiante (Fase 5 llena, Fase 4 crea)
CREATE TABLE IF NOT EXISTS portal.cache_completions (
    id                  SERIAL PRIMARY KEY,
    moodle_platform     TEXT NOT NULL,
    moodle_course_id    INT NOT NULL,
    moodle_userid       INT NOT NULL,
    completions_json    JSONB NOT NULL,
    fetched_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(moodle_platform, moodle_course_id, moodle_userid)
);

-- Grades por estudiante (Fase 5 llena, Fase 4 crea)
CREATE TABLE IF NOT EXISTS portal.cache_grades (
    id                  SERIAL PRIMARY KEY,
    moodle_platform     TEXT NOT NULL,
    moodle_course_id    INT NOT NULL,
    moodle_userid       INT NOT NULL,
    grades_json         JSONB NOT NULL,
    fetched_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(moodle_platform, moodle_course_id, moodle_userid)
);

-- Submissions por estudiante (Fase 5 llena, Fase 4 crea)
CREATE TABLE IF NOT EXISTS portal.cache_submissions (
    id                  SERIAL PRIMARY KEY,
    moodle_platform     TEXT NOT NULL,
    moodle_course_id    INT NOT NULL,
    moodle_userid       INT NOT NULL,
    submissions_json    JSONB NOT NULL,
    fetched_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(moodle_platform, moodle_course_id, moodle_userid)
);

-- Calendar events por curso (Fase 4 cron llena)
CREATE TABLE IF NOT EXISTS portal.cache_calendar (
    id                  SERIAL PRIMARY KEY,
    moodle_platform     TEXT NOT NULL,
    moodle_course_id    INT NOT NULL,
    events_json         JSONB NOT NULL,
    fetched_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(moodle_platform, moodle_course_id)
);

-- Recordings por curso — mod_data entries (Fase 4 cron llena)
CREATE TABLE IF NOT EXISTS portal.cache_recordings (
    id                  SERIAL PRIMARY KEY,
    moodle_platform     TEXT NOT NULL,
    moodle_course_id    INT NOT NULL,
    recordings_json     JSONB NOT NULL,
    fetched_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(moodle_platform, moodle_course_id)
);

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS — alertas para DIs y estudiantes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.notifications (
    id                  SERIAL PRIMARY KEY,
    umce_email          TEXT NOT NULL,
    piac_link_id        INT REFERENCES portal.piac_links(id) ON DELETE CASCADE,
    type                TEXT NOT NULL,
    title               TEXT NOT NULL,
    body                TEXT NOT NULL,
    data_json           JSONB,
    read                BOOLEAN DEFAULT false,
    push_sent           BOOLEAN DEFAULT false,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_mapping_email ON portal.user_moodle_mapping (umce_email);
CREATE INDEX IF NOT EXISTS idx_user_mapping_platform ON portal.user_moodle_mapping (moodle_platform, moodle_userid);

CREATE INDEX IF NOT EXISTS idx_cache_completions_lookup ON portal.cache_completions (moodle_platform, moodle_course_id, moodle_userid);
CREATE INDEX IF NOT EXISTS idx_cache_grades_lookup ON portal.cache_grades (moodle_platform, moodle_course_id, moodle_userid);
CREATE INDEX IF NOT EXISTS idx_cache_submissions_lookup ON portal.cache_submissions (moodle_platform, moodle_course_id, moodle_userid);
CREATE INDEX IF NOT EXISTS idx_cache_calendar_lookup ON portal.cache_calendar (moodle_platform, moodle_course_id);
CREATE INDEX IF NOT EXISTS idx_cache_recordings_lookup ON portal.cache_recordings (moodle_platform, moodle_course_id);

CREATE INDEX IF NOT EXISTS idx_notif_email_unread ON portal.notifications (umce_email, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notif_link ON portal.notifications (piac_link_id);
CREATE INDEX IF NOT EXISTS idx_notif_type ON portal.notifications (type);

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
ALTER TABLE portal.user_moodle_mapping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read user_moodle_mapping" ON portal.user_moodle_mapping FOR SELECT USING (true);
CREATE POLICY "Service write user_moodle_mapping" ON portal.user_moodle_mapping FOR ALL USING (current_setting('role') = 'service_role');

ALTER TABLE portal.cache_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read cache_completions" ON portal.cache_completions FOR SELECT USING (true);
CREATE POLICY "Service write cache_completions" ON portal.cache_completions FOR ALL USING (current_setting('role') = 'service_role');

ALTER TABLE portal.cache_grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read cache_grades" ON portal.cache_grades FOR SELECT USING (true);
CREATE POLICY "Service write cache_grades" ON portal.cache_grades FOR ALL USING (current_setting('role') = 'service_role');

ALTER TABLE portal.cache_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read cache_submissions" ON portal.cache_submissions FOR SELECT USING (true);
CREATE POLICY "Service write cache_submissions" ON portal.cache_submissions FOR ALL USING (current_setting('role') = 'service_role');

ALTER TABLE portal.cache_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read cache_calendar" ON portal.cache_calendar FOR SELECT USING (true);
CREATE POLICY "Service write cache_calendar" ON portal.cache_calendar FOR ALL USING (current_setting('role') = 'service_role');

ALTER TABLE portal.cache_recordings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read cache_recordings" ON portal.cache_recordings FOR SELECT USING (true);
CREATE POLICY "Service write cache_recordings" ON portal.cache_recordings FOR ALL USING (current_setting('role') = 'service_role');

ALTER TABLE portal.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read notifications" ON portal.notifications FOR SELECT USING (true);
CREATE POLICY "Service write notifications" ON portal.notifications FOR ALL USING (current_setting('role') = 'service_role');

-- ---------------------------------------------------------------------------
-- GRANTS
-- ---------------------------------------------------------------------------
GRANT SELECT ON portal.user_moodle_mapping TO anon, authenticated;
GRANT ALL ON portal.user_moodle_mapping TO service_role;
GRANT ALL ON portal.user_moodle_mapping_id_seq TO service_role;

GRANT SELECT ON portal.cache_completions TO anon, authenticated;
GRANT ALL ON portal.cache_completions TO service_role;
GRANT ALL ON portal.cache_completions_id_seq TO service_role;

GRANT SELECT ON portal.cache_grades TO anon, authenticated;
GRANT ALL ON portal.cache_grades TO service_role;
GRANT ALL ON portal.cache_grades_id_seq TO service_role;

GRANT SELECT ON portal.cache_submissions TO anon, authenticated;
GRANT ALL ON portal.cache_submissions TO service_role;
GRANT ALL ON portal.cache_submissions_id_seq TO service_role;

GRANT SELECT ON portal.cache_calendar TO anon, authenticated;
GRANT ALL ON portal.cache_calendar TO service_role;
GRANT ALL ON portal.cache_calendar_id_seq TO service_role;

GRANT SELECT ON portal.cache_recordings TO anon, authenticated;
GRANT ALL ON portal.cache_recordings TO service_role;
GRANT ALL ON portal.cache_recordings_id_seq TO service_role;

GRANT SELECT ON portal.notifications TO anon, authenticated;
GRANT ALL ON portal.notifications TO service_role;
GRANT ALL ON portal.notifications_id_seq TO service_role;
