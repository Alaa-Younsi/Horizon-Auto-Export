-- =============================================================================
-- 0007_seed.sql — initial content (identity only; safe to re-run)
--
-- Brands from the client's mock-up ("Mărci disponibile"). logo_url stays NULL:
-- the site draws the built-in mark for these slugs (src/data/brand-logos.ts) or a
-- wordmark when there is none (CUPRA). Admins can upload a logo per brand later.
--
-- Contact details are NOT seeded: blank settings fall back to src/lib/contact.ts,
-- so the compiled values stay the single source until the client edits them.
-- =============================================================================

insert into public.brands (slug, name, sort_order) values
  ('volkswagen', 'Volkswagen', 10),
  ('audi', 'Audi', 20),
  ('skoda', 'Škoda', 30),
  ('seat', 'SEAT', 40),
  ('cupra', 'CUPRA', 50),
  ('porsche', 'Porsche', 60),
  ('bmw', 'BMW', 70)
on conflict (slug) do nothing;
