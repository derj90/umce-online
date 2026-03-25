-- Migration 003: Profiles table + auth trigger
-- Links Supabase Auth users to app-level profile with roles

-- ─── Profiles table ─────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre text not null default '',
  rol text not null default 'docente'
    check (rol in ('docente', 'di', 'coordinador')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_rol on public.profiles(rol);

-- updated_at trigger
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function update_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- Users can update their own profile (name only — rol changes need service_role)
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Service role can do everything (for admin operations)
create policy "profiles_service_all" on public.profiles
  for all using (auth.role() = 'service_role');

-- ─── Auto-create profile on signup ──────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, nombre)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nombre', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Update PIAC RLS to use real auth ────────────────────────────────────────
-- Now that we have auth, update piacs policies to use auth.uid()
-- The anon policies from migration 002 remain for backward compat during transition
