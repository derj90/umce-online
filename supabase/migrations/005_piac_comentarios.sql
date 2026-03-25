-- Migration 005: Inline comments from DI per PIAC section
-- DI/coordinador can comment on specific sections; docente can resolve

CREATE TABLE IF NOT EXISTS piac_comentarios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piac_id     UUID NOT NULL REFERENCES piacs(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  seccion     TEXT NOT NULL CHECK (seccion IN (
    'identificacion', 'modalidad', 'nucleo', 'evaluaciones', 'bibliografia', 'general'
  )),
  nucleo_orden INT,  -- only used when seccion = 'nucleo', indicates which nucleo
  texto       TEXT NOT NULL CHECK (char_length(texto) >= 1),
  resolved    BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_piac_comentarios_piac ON piac_comentarios(piac_id);
CREATE INDEX idx_piac_comentarios_seccion ON piac_comentarios(piac_id, seccion);

-- RLS
ALTER TABLE piac_comentarios ENABLE ROW LEVEL SECURITY;

-- DI and coordinador can insert comments on non-borrador PIACs
CREATE POLICY "di_coordinador_insert_comentarios"
  ON piac_comentarios FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_rol() IN ('di', 'coordinador')
  );

-- DI and coordinador can read all comments
CREATE POLICY "di_coordinador_read_comentarios"
  ON piac_comentarios FOR SELECT
  TO authenticated
  USING (
    public.get_user_rol() IN ('di', 'coordinador')
    OR piac_id IN (SELECT id FROM piacs WHERE user_id = auth.uid())
  );

-- Docente can read comments on their own PIACs (covered above)
-- Docente can update (resolve) comments on their own PIACs
CREATE POLICY "docente_resolve_comentarios"
  ON piac_comentarios FOR UPDATE
  TO authenticated
  USING (
    piac_id IN (SELECT id FROM piacs WHERE user_id = auth.uid())
  )
  WITH CHECK (
    piac_id IN (SELECT id FROM piacs WHERE user_id = auth.uid())
  );

-- DI/coordinador can also update their own comments (edit text or resolve)
CREATE POLICY "di_coordinador_update_comentarios"
  ON piac_comentarios FOR UPDATE
  TO authenticated
  USING (
    public.get_user_rol() IN ('di', 'coordinador')
  )
  WITH CHECK (
    public.get_user_rol() IN ('di', 'coordinador')
  );

-- Temporary anon policy for dev (matches pattern from 002)
CREATE POLICY "anon_comentarios_dev"
  ON piac_comentarios FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);
