-- Vehicle details requested by the client:
--   * first registration date = the existing `year` + an optional month,
--   * "accident-free history" yes / no (null = not stated),
--   * options as a checklist: stable keys from src/data/vehicle-options.ts
--     (labels live in the app, in three languages), replacing the free-text
--     `equipment` field (kept, so older listings still show their text).
-- Re-running is safe.

alter table public.vehicles
  add column if not exists registration_month smallint
    check (registration_month is null or registration_month between 1 and 12),
  add column if not exists accident_free boolean,
  add column if not exists options text[] not null default '{}';

alter table public.vehicles drop constraint if exists vehicles_options_check;
alter table public.vehicles add constraint vehicles_options_check check (
  cardinality(options) <= 150
  and array_to_string(options, ',') ~ '^[a-z0-9_]*(,[a-z0-9_]+)*$'
);
