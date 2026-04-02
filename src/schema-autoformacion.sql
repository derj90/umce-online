-- Autoformación enrollments
CREATE TABLE IF NOT EXISTS portal.autoformacion_enrollments (
  id SERIAL PRIMARY KEY,
  course_slug TEXT NOT NULL DEFAULT 'sustentabilidad',
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT NOT NULL,
  institucion TEXT,
  estamento TEXT,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  progress JSONB DEFAULT '{}',
  access_token TEXT UNIQUE,
  UNIQUE(course_slug, email)
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_autoformacion_email ON portal.autoformacion_enrollments(email);
CREATE INDEX IF NOT EXISTS idx_autoformacion_slug ON portal.autoformacion_enrollments(course_slug);

-- RLS
ALTER TABLE portal.autoformacion_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON portal.autoformacion_enrollments FOR ALL USING (true);
