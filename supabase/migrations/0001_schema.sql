-- =============================================================================
-- 0001_schema.sql — Horizon Auto Export core tables
--
-- Localized text is jsonb {"ro": "...", "en": "...", "fr": "..."}. Every
-- language is optional per row: the site resolves active language -> Romanian
-- (source) -> English, per field, so a half-translated row degrades to real text.
--
-- Migration numbering is sequential; never edit or renumber a migration that may
-- already have run — add a new one.
-- =============================================================================

create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Localized jsonb must be an object whose values are strings, keys from our set.
create or replace function public.is_localized(v jsonb)
returns boolean language sql immutable as $$
  select v is null or (
    jsonb_typeof(v) = 'object'
    and not exists (
      select 1 from jsonb_each(v) e
      where e.key not in ('ro', 'en', 'fr') or jsonb_typeof(e.value) <> 'string'
    )
  );
$$;

-- ---------------------------------------------------------------- brands ----
create table public.brands (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null check (char_length(btrim(name)) between 1 and 60),
  -- NULL = use the built-in mark for this slug (src/data/brand-logos.ts), or a wordmark.
  logo_url    text,
  show_on_home boolean not null default true,
  active      boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger brands_updated_at before update on public.brands
  for each row execute function public.update_updated_at();

-- -------------------------------------------------------------- vehicles ----
create table public.vehicles (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title         jsonb not null default '{}' check (public.is_localized(title)),
  description   jsonb not null default '{}' check (public.is_localized(description)),
  -- One item per line, per language.
  equipment     jsonb not null default '{}' check (public.is_localized(equipment)),
  -- Only meaningful for category 'damaged'.
  damage_notes  jsonb not null default '{}' check (public.is_localized(damage_notes)),
  category      text not null default 'passenger'
                check (category in ('passenger', 'commercial', 'damaged')),
  body_type     text not null default 'sedan'
                check (body_type in ('sedan','suv','hatchback','estate','coupe','convertible',
                                     'mpv','van','pickup','truck','other')),
  brand_id      uuid references public.brands(id) on delete set null,
  model         text check (model is null or char_length(model) <= 80),
  year          integer check (year is null or year between 1950 and 2100),
  mileage_km    integer check (mileage_km is null or mileage_km between 0 and 5000000),
  fuel          text check (fuel is null or fuel in ('petrol','diesel','hybrid','plugin_hybrid',
                                                     'electric','lpg','cng','other')),
  transmission  text check (transmission is null or transmission in ('manual','automatic')),
  drivetrain    text check (drivetrain is null or drivetrain in ('fwd','rwd','awd')),
  power_hp      integer check (power_hp is null or power_hp between 1 and 3000),
  engine_cc     integer check (engine_cc is null or engine_cc between 1 and 30000),
  color         text check (color is null or char_length(color) <= 40),
  doors         smallint check (doors is null or doors between 1 and 8),
  seats         smallint check (seats is null or seats between 1 and 80),
  euro_norm     text check (euro_norm is null or char_length(euro_norm) <= 12),
  location      text check (location is null or char_length(location) <= 80),
  -- NULL price = "price on request" (common in B2B).
  price         numeric(12,2) check (price is null or price >= 0),
  currency      text not null default 'EUR' check (currency in ('EUR','RON')),
  vat_deductible boolean not null default false,
  status        text not null default 'draft'
                check (status in ('draft','available','reserved','sold')),
  featured      boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint vehicles_title_present check (title ?| array['ro','en','fr'])
);
create index vehicles_status_idx on public.vehicles (status, featured desc, sort_order, created_at desc);
create index vehicles_brand_idx on public.vehicles (brand_id);
create trigger vehicles_updated_at before update on public.vehicles
  for each row execute function public.update_updated_at();

create table public.vehicle_images (
  id          uuid primary key default gen_random_uuid(),
  vehicle_id  uuid not null references public.vehicles(id) on delete cascade,
  url         text not null,
  alt         text,
  -- Lowest sort_order = cover photo (cards, link previews, inquiry snapshot).
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index vehicle_images_vehicle_idx on public.vehicle_images (vehicle_id, sort_order);

-- Internal data kept OFF the public vehicles table: RLS is row-level, and anon
-- can read published vehicle rows — a column there would publish the margins.
create table public.vehicle_private (
  vehicle_id      uuid primary key references public.vehicles(id) on delete cascade,
  vin             text check (vin is null or char_length(vin) <= 32),
  purchase_price  numeric(12,2) check (purchase_price is null or purchase_price >= 0),
  purchase_currency text not null default 'EUR' check (purchase_currency in ('EUR','RON')),
  supplier        text check (supplier is null or char_length(supplier) <= 120),
  internal_notes  text check (internal_notes is null or char_length(internal_notes) <= 4000),
  updated_at      timestamptz not null default now()
);
create trigger vehicle_private_updated_at before update on public.vehicle_private
  for each row execute function public.update_updated_at();

-- ------------------------------------------------------------- inquiries ----
-- Written ONLY through submit_inquiry() (0004): anon has no INSERT policy.
create table public.inquiries (
  id            uuid primary key default gen_random_uuid(),
  reference     text not null unique,
  kind          text not null default 'general'
                check (kind in ('general','vehicle','sourcing','sell','export')),
  vehicle_id    uuid references public.vehicles(id) on delete set null,
  -- Snapshot, so the inquiry stays readable after the vehicle is edited or deleted.
  vehicle_label text,
  name          text not null,
  company       text,
  email         text not null,
  phone         text,
  country       text,
  message       text not null,
  language      text not null default 'ro' check (language in ('ro','en','fr')),
  consent_at    timestamptz not null,
  status        text not null default 'new'
                check (status in ('new','contacted','negotiating','won','lost','spam')),
  admin_notes   text,
  notified_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index inquiries_status_idx on public.inquiries (status, created_at desc);
create index inquiries_email_idx on public.inquiries (lower(email), created_at desc);
create index inquiries_created_idx on public.inquiries (created_at desc);
create trigger inquiries_updated_at before update on public.inquiries
  for each row execute function public.update_updated_at();

-- --------------------------------------------------------- site_settings ----
-- Singleton (id is always true). Blank columns fall back to the values compiled
-- into src/lib/contact.ts, so a half-filled row never blanks the footer.
create table public.site_settings (
  id              boolean primary key default true check (id),
  company_name    text,
  phone_display   text,
  phone_e164      text check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  whatsapp_e164   text check (whatsapp_e164 is null or whatsapp_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  email           text,
  address         jsonb check (public.is_localized(address)),
  hours           jsonb check (public.is_localized(hours)),
  vat_id          text,
  trade_register  text,
  map_url         text,
  hero_image_url  text,
  about_image_url text,
  socials         jsonb not null default '{}',
  updated_at      timestamptz not null default now()
);
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.update_updated_at();
insert into public.site_settings (id) values (true) on conflict do nothing;
