-- Autoformación enrollments
-- NOTE: rut is nullable — some courses (e.g. modelo-educativo) don't require it
CREATE TABLE IF NOT EXISTS portal.autoformacion_enrollments (
  id SERIAL PRIMARY KEY,
  course_slug TEXT NOT NULL DEFAULT 'sustentabilidad',
  rut TEXT,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT NOT NULL,
  universidad TEXT,
  estamento TEXT,
  access_token TEXT NOT NULL,
  moodle_user_id INTEGER,
  moodle_enrolled BOOLEAN DEFAULT false,
  progress JSONB DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(email, course_slug),
  UNIQUE(access_token)
);

-- Indexes for lookups
CREATE INDEX IF NOT EXISTS idx_autoformacion_email ON portal.autoformacion_enrollments(email);
CREATE INDEX IF NOT EXISTS idx_autoformacion_slug ON portal.autoformacion_enrollments(course_slug);
CREATE INDEX IF NOT EXISTS idx_autoformacion_rut ON portal.autoformacion_enrollments(rut);
CREATE INDEX IF NOT EXISTS idx_autoformacion_token ON portal.autoformacion_enrollments(access_token);

-- RLS
ALTER TABLE portal.autoformacion_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "autoformacion_service_all" ON portal.autoformacion_enrollments FOR ALL USING (true) WITH CHECK (true);
