-- =============================================================================
-- 0002_admin_permissions.sql — staff accounts with per-section access
--
-- A Supabase session is NOT authorization. Only a row in admin_profiles makes
-- someone staff; everything an admin can write is gated on has_section('<key>')
-- in 0003_rls.sql, so a stray authenticated user (e.g. via public sign-up) gets
-- nothing. Still: disable public sign-up in Authentication -> Settings.
--
-- KEEP IN SYNC (a mismatch fails silently — granted in the UI, dropped on save):
--   src/pages/admin/adminSections.ts  ·  has_section('…') in 0003/0004
--   ·  ALLOWED_SECTIONS in supabase/functions/create-staff/index.ts
--
-- Section keys: vehicles, inquiries, brands, settings
--
-- AFTER THIS RUNS ONLY SEEDED ADMINS CAN WRITE. Seed the owner below
-- (see the go-live checklist in README.md).
-- =============================================================================

create table public.admin_profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  is_owner    boolean not null default false,
  sections    text[] not null default '{}',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.admin_profiles enable row level security;

-- SECURITY DEFINER is required, not a shortcut: these read admin_profiles past its
-- own RLS. Without it, every policy calling has_section() would re-enter
-- admin_profiles' policies and Postgres would error with infinite recursion.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_profiles where user_id = auth.uid() and active);
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_profiles where user_id = auth.uid() and active and is_owner);
$$;

create or replace function public.has_section(s text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_profiles
    where user_id = auth.uid() and active and (is_owner or s = any(sections))
  );
$$;

create policy "read own admin profile" on public.admin_profiles
  for select to authenticated using (user_id = auth.uid());
create policy "owner manages admin profiles" on public.admin_profiles
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- Owner seed. Create the user in Authentication -> Users FIRST, then replace the
-- e-mail below with that login before running in production. Re-running is safe.
insert into public.admin_profiles (user_id, email, is_owner, sections)
select id, email, true, '{}' from auth.users where email = 'horizonautoexport@gmail.com'
on conflict (user_id) do update set is_owner = true, active = true;
