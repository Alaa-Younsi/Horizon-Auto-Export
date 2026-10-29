-- =============================================================================
-- 0003_rls.sql — row-level security on every table
--
-- Public (anon): reads published content only. It never writes a table directly:
-- inquiries go through submit_inquiry() (0004), which validates and rate-limits.
-- Staff (authenticated + admin_profiles row): per-section, via has_section().
-- =============================================================================

alter table public.brands enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_images enable row level security;
alter table public.vehicle_private enable row level security;
alter table public.inquiries enable row level security;
alter table public.site_settings enable row level security;

-- ---------------------------------------------------------------- brands ----
create policy "public read active brands" on public.brands
  for select to anon, authenticated using (active);
-- Every admin can list all makes (the vehicle form's brand picker needs them).
create policy "admin read brands" on public.brands
  for select to authenticated using (public.is_admin());
create policy "admin manage brands" on public.brands
  for all to authenticated
  using (public.has_section('brands')) with check (public.has_section('brands'));

-- -------------------------------------------------------------- vehicles ----
-- Drafts are invisible to the public; sold vehicles stay reachable by URL.
create policy "public read published vehicles" on public.vehicles
  for select to anon, authenticated using (status <> 'draft');
create policy "admin read vehicles" on public.vehicles
  for select to authenticated
  using (public.has_section('vehicles') or public.has_section('inquiries'));
create policy "admin manage vehicles" on public.vehicles
  for all to authenticated
  using (public.has_section('vehicles')) with check (public.has_section('vehicles'));

create policy "public read published vehicle images" on public.vehicle_images
  for select to anon, authenticated using (
    exists (select 1 from public.vehicles v where v.id = vehicle_id and v.status <> 'draft')
  );
create policy "admin manage vehicle images" on public.vehicle_images
  for all to authenticated
  using (public.has_section('vehicles')) with check (public.has_section('vehicles'));

-- Purchase price / VIN / supplier: staff with the vehicles section only.
create policy "admin manage vehicle private" on public.vehicle_private
  for all to authenticated
  using (public.has_section('vehicles')) with check (public.has_section('vehicles'));

-- ------------------------------------------------------------- inquiries ----
-- No INSERT policy at all: the only way in is submit_inquiry().
create policy "admin read inquiries" on public.inquiries
  for select to authenticated using (public.has_section('inquiries'));
create policy "admin update inquiries" on public.inquiries
  for update to authenticated
  using (public.has_section('inquiries')) with check (public.has_section('inquiries'));
create policy "admin delete inquiries" on public.inquiries
  for delete to authenticated using (public.has_section('inquiries'));

-- --------------------------------------------------------- site_settings ----
create policy "public read site settings" on public.site_settings
  for select to anon, authenticated using (true);
create policy "admin update site settings" on public.site_settings
  for update to authenticated
  using (public.has_section('settings')) with check (public.has_section('settings'));
