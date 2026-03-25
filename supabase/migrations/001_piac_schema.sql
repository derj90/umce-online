-- PIAC Schema for umce.online
-- Supabase self-hosted: supabase.udfv.cloud
-- Created: 2026-03-25

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- ─── piacs ───────────────────────────────────────────────────────────────────
create table if not exists piacs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,

  -- Bloque 1: Identificación
  nombre_actividad text not null,
  programa text not null,
  unidad_academica text not null,
  docente_responsable text not null,
  email_docente text not null,
  semestre text not null,

  -- Bloque 2: Modalidad
  tipo_docencia text not null default 'docencia'
    check (tipo_docencia in ('docencia', 'co-docencia', 'colegiada', 'mixta')),
  tipo_interaccion text not null default 'virtual'
    check (tipo_interaccion in ('virtual', 'semipresencial')),
  num_semanas smallint not null default 16
    check (num_semanas between 4 and 20),
  horas_sincronicas smallint not null default 3
    check (horas_sincronicas between 0 and 20),
  horas_asincronicas smallint not null default 3
    check (horas_asincronicas between 0 and 20),
  horas_autonomas smallint not null default 4
    check (horas_autonomas between 0 and 20),

  -- Bloque 5: Bibliografía
  bibliografia_obligatoria text default '',
  bibliografia_complementaria text default '',

  -- Workflow
  status text not null default 'borrador'
    check (status in ('borrador', 'enviado', 'en_revision', 'aprobado', 'devuelto')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── piac_nucleos ────────────────────────────────────────────────────────────
create table if not exists piac_nucleos (
  id uuid primary key default uuid_generate_v4(),
  piac_id uuid not null references piacs(id) on delete cascade,
  orden smallint not null default 1,
  nombre text not null,
  semana_inicio smallint not null,
  semana_fin smallint not null,
  resultado_formativo text default '',
  criterios_evaluacion text default '',
  temas text default '',
  actividades_sincronicas text default '',
  actividades_asincronicas text default '',
  actividades_autonomas text default '',

  check (semana_fin >= semana_inicio)
);

-- ─── piac_evaluaciones ───────────────────────────────────────────────────────
create table if not exists piac_evaluaciones (
  id uuid primary key default uuid_generate_v4(),
  piac_id uuid not null references piacs(id) on delete cascade,
  nucleo_id uuid references piac_nucleos(id) on delete set null,
  nombre text not null,
  tipo text not null default 'tarea'
    check (tipo in ('tarea', 'prueba', 'proyecto', 'portfolio')),
  ponderacion smallint not null default 0
    check (ponderacion between 0 and 100),
  semana_entrega smallint not null default 1
);

-- ─── piac_versiones ──────────────────────────────────────────────────────────
create table if not exists piac_versiones (
  id uuid primary key default uuid_generate_v4(),
  piac_id uuid not null references piacs(id) on delete cascade,
  version smallint not null default 1,
  data_snapshot jsonb not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
create index if not exists idx_piacs_user_id on piacs(user_id);
create index if not exists idx_piacs_status on piacs(status);
create index if not exists idx_piacs_semestre on piacs(semestre);
create index if not exists idx_piac_nucleos_piac_id on piac_nucleos(piac_id);
create index if not exists idx_piac_evaluaciones_piac_id on piac_evaluaciones(piac_id);
create index if not exists idx_piac_versiones_piac_id on piac_versiones(piac_id);

-- ─── Updated_at trigger ──────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger piacs_updated_at
  before update on piacs
  for each row execute function update_updated_at();

-- ─── RLS Policies ────────────────────────────────────────────────────────────
alter table piacs enable row level security;
alter table piac_nucleos enable row level security;
alter table piac_evaluaciones enable row level security;
alter table piac_versiones enable row level security;

-- Docentes: CRUD on their own PIACs
create policy "Docentes can view own PIACs"
  on piacs for select
  using (auth.uid() = user_id);

create policy "Docentes can insert own PIACs"
  on piacs for insert
  with check (auth.uid() = user_id);

create policy "Docentes can update own PIACs"
  on piacs for update
  using (auth.uid() = user_id);

create policy "Docentes can delete own draft PIACs"
  on piacs for delete
  using (auth.uid() = user_id and status = 'borrador');

-- DIs (service_role or specific role): can view all PIACs
-- Note: service_role bypasses RLS by default in Supabase.
-- For app-level DI users, add a custom claim or role check here.

-- Nucleos: follow parent PIAC ownership
create policy "Nucleos follow PIAC ownership (select)"
  on piac_nucleos for select
  using (exists (select 1 from piacs where piacs.id = piac_id and piacs.user_id = auth.uid()));

create policy "Nucleos follow PIAC ownership (insert)"
  on piac_nucleos for insert
  with check (exists (select 1 from piacs where piacs.id = piac_id and piacs.user_id = auth.uid()));

create policy "Nucleos follow PIAC ownership (update)"
  on piac_nucleos for update
  using (exists (select 1 from piacs where piacs.id = piac_id and piacs.user_id = auth.uid()));

create policy "Nucleos follow PIAC ownership (delete)"
  on piac_nucleos for delete
  using (exists (select 1 from piacs where piacs.id = piac_id and piacs.user_id = auth.uid()));

-- Evaluaciones: follow parent PIAC ownership
create policy "Evaluaciones follow PIAC ownership (select)"
  on piac_evaluaciones for select
  using (exists (select 1 from piacs where piacs.id = piac_id and piacs.user_id = auth.uid()));

create policy "Evaluaciones follow PIAC ownership (insert)"
  on piac_evaluaciones for insert
  with check (exists (select 1 from piacs where piacs.id = piac_id and piacs.user_id = auth.uid()));

create policy "Evaluaciones follow PIAC ownership (update)"
  on piac_evaluaciones for update
  using (exists (select 1 from piacs where piacs.id = piac_id and piacs.user_id = auth.uid()));

create policy "Evaluaciones follow PIAC ownership (delete)"
  on piac_evaluaciones for delete
  using (exists (select 1 from piacs where piacs.id = piac_id and piacs.user_id = auth.uid()));

-- Versiones: follow parent PIAC ownership (read-only for docentes)
create policy "Versiones follow PIAC ownership (select)"
  on piac_versiones for select
  using (exists (select 1 from piacs where piacs.id = piac_id and piacs.user_id = auth.uid()));

create policy "Versiones follow PIAC ownership (insert)"
  on piac_versiones for insert
  with check (exists (select 1 from piacs where piacs.id = piac_id and piacs.user_id = auth.uid()));
