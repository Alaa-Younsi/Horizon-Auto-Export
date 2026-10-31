-- =============================================================================
-- 0008_seed_dacia_renault.sql — two more makes the client trades (safe to re-run)
--
-- Same rules as 0007: identity only, logo_url NULL (the site draws the built-in
-- mark from src/data/brand-logos.ts). Existing rows are never touched.
-- =============================================================================

insert into public.brands (slug, name, sort_order) values
  ('dacia', 'Dacia', 80),
  ('renault', 'Renault', 90)
on conflict (slug) do nothing;
