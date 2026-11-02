-- =============================================================================
-- 0012_seed_european_brands.sql — every European make in the brand filter
-- (safe to re-run)
--
-- Same rules as 0007/0008: identity only, logo_url NULL (the site draws the
-- built-in mark from src/data/brand-logos.ts, or the name as a wordmark).
-- show_on_home = false: they appear in the vehicles page's brand filter, while
-- the home page strip keeps the makes the client trades most. Existing rows
-- (and any edits the client made to them) are never touched.
-- =============================================================================

insert into public.brands (slug, name, sort_order, show_on_home) values
  ('abarth', 'Abarth', 100, false),
  ('alfa-romeo', 'Alfa Romeo', 110, false),
  ('alpine', 'Alpine', 120, false),
  ('aston-martin', 'Aston Martin', 130, false),
  ('bentley', 'Bentley', 140, false),
  ('bugatti', 'Bugatti', 150, false),
  ('citroen', 'Citroën', 160, false),
  ('daf', 'DAF', 170, false),
  ('ds', 'DS Automobiles', 180, false),
  ('ferrari', 'Ferrari', 190, false),
  ('fiat', 'Fiat', 200, false),
  ('iveco', 'Iveco', 210, false),
  ('jaguar', 'Jaguar', 220, false),
  ('lamborghini', 'Lamborghini', 230, false),
  ('lancia', 'Lancia', 240, false),
  ('land-rover', 'Land Rover', 250, false),
  ('lotus', 'Lotus', 260, false),
  ('man', 'MAN', 270, false),
  ('maserati', 'Maserati', 280, false),
  ('mclaren', 'McLaren', 290, false),
  ('mercedes-benz', 'Mercedes-Benz', 300, false),
  ('mini', 'MINI', 310, false),
  ('opel', 'Opel', 320, false),
  ('peugeot', 'Peugeot', 330, false),
  ('polestar', 'Polestar', 340, false),
  ('rolls-royce', 'Rolls-Royce', 350, false),
  ('saab', 'Saab', 360, false),
  ('scania', 'Scania', 370, false),
  ('smart', 'smart', 380, false),
  ('volvo', 'Volvo', 390, false)
on conflict (slug) do nothing;
