-- Migration 004: RLS policies for PIAC state transitions
-- DI and coordinador roles need to read all PIACs and update status.
-- Uses profiles.rol to determine access level.

-- ─── Helper: get current user's role ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_user_rol()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol FROM public.profiles WHERE id = auth.uid();
$$;

-- ─── PIACs: DI can read all non-draft PIACs ─────────────────────────────────

CREATE POLICY "di_read_piacs"
  ON public.piacs
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_rol() = 'di'
    AND status != 'borrador'
  );

-- ─── PIACs: DI can update status on PIACs (not content) ─────────────────────

CREATE POLICY "di_update_piac_status"
  ON public.piacs
  FOR UPDATE
  TO authenticated
  USING (
    public.get_user_rol() = 'di'
    AND status != 'borrador'
  )
  WITH CHECK (
    public.get_user_rol() = 'di'
    AND status != 'borrador'
  );

-- ─── PIACs: Coordinador can read and update all ─────────────────────────────

CREATE POLICY "coordinador_read_piacs"
  ON public.piacs
  FOR SELECT
  TO authenticated
  USING (public.get_user_rol() = 'coordinador');

CREATE POLICY "coordinador_update_piacs"
  ON public.piacs
  FOR UPDATE
  TO authenticated
  USING (public.get_user_rol() = 'coordinador')
  WITH CHECK (public.get_user_rol() = 'coordinador');

-- ─── Child tables: DI can read nucleos/evaluaciones of non-draft PIACs ──────

CREATE POLICY "di_read_piac_nucleos"
  ON public.piac_nucleos
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_rol() = 'di'
    AND EXISTS (
      SELECT 1 FROM public.piacs
      WHERE piacs.id = piac_nucleos.piac_id
      AND piacs.status != 'borrador'
    )
  );

CREATE POLICY "di_read_piac_evaluaciones"
  ON public.piac_evaluaciones
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_rol() = 'di'
    AND EXISTS (
      SELECT 1 FROM public.piacs
      WHERE piacs.id = piac_evaluaciones.piac_id
      AND piacs.status != 'borrador'
    )
  );

-- ─── Child tables: Coordinador can read all ─────────────────────────────────

CREATE POLICY "coordinador_read_piac_nucleos"
  ON public.piac_nucleos
  FOR SELECT
  TO authenticated
  USING (public.get_user_rol() = 'coordinador');

CREATE POLICY "coordinador_read_piac_evaluaciones"
  ON public.piac_evaluaciones
  FOR SELECT
  TO authenticated
  USING (public.get_user_rol() = 'coordinador');

-- ─── Versiones: DI and coordinador can insert version snapshots ─────────────

CREATE POLICY "di_insert_piac_versiones"
  ON public.piac_versiones
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_rol() IN ('di', 'coordinador')
  );

CREATE POLICY "di_read_piac_versiones"
  ON public.piac_versiones
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_rol() IN ('di', 'coordinador')
    OR changed_by = auth.uid()::text
  );
