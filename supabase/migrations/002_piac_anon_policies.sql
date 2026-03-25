-- Temporary anonymous access policies for PIAC tables
-- These allow unauthenticated users to CRUD PIACs with user_id IS NULL.
-- Remove/replace these once Supabase Auth is integrated.
-- Created: 2026-03-25

-- ─── piacs ──────────────────────────────────────────────────────────────────
create policy "anon_select_piacs"
  on piacs for select using (user_id is null);

create policy "anon_insert_piacs"
  on piacs for insert with check (user_id is null);

create policy "anon_update_piacs"
  on piacs for update using (user_id is null);

create policy "anon_delete_piacs"
  on piacs for delete using (user_id is null and status = 'borrador');

-- ─── piac_nucleos ───────────────────────────────────────────────────────────
create policy "anon_select_nucleos"
  on piac_nucleos for select
  using (exists (select 1 from piacs where piacs.id = piac_id and piacs.user_id is null));

create policy "anon_insert_nucleos"
  on piac_nucleos for insert
  with check (exists (select 1 from piacs where piacs.id = piac_id and piacs.user_id is null));

create policy "anon_update_nucleos"
  on piac_nucleos for update
  using (exists (select 1 from piacs where piacs.id = piac_id and piacs.user_id is null));

create policy "anon_delete_nucleos"
  on piac_nucleos for delete
  using (exists (select 1 from piacs where piacs.id = piac_id and piacs.user_id is null));

-- ─── piac_evaluaciones ──────────────────────────────────────────────────────
create policy "anon_select_evaluaciones"
  on piac_evaluaciones for select
  using (exists (select 1 from piacs where piacs.id = piac_id and piacs.user_id is null));

create policy "anon_insert_evaluaciones"
  on piac_evaluaciones for insert
  with check (exists (select 1 from piacs where piacs.id = piac_id and piacs.user_id is null));

create policy "anon_update_evaluaciones"
  on piac_evaluaciones for update
  using (exists (select 1 from piacs where piacs.id = piac_id and piacs.user_id is null));

create policy "anon_delete_evaluaciones"
  on piac_evaluaciones for delete
  using (exists (select 1 from piacs where piacs.id = piac_id and piacs.user_id is null));

-- ─── piac_versiones ─────────────────────────────────────────────────────────
create policy "anon_select_versiones"
  on piac_versiones for select
  using (exists (select 1 from piacs where piacs.id = piac_id and piacs.user_id is null));

create policy "anon_insert_versiones"
  on piac_versiones for insert
  with check (exists (select 1 from piacs where piacs.id = piac_id and piacs.user_id is null));
