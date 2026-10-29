-- =============================================================================
-- 0004_functions.sql — the public write path + the admin dashboard aggregate
--
-- submit_inquiry() is the ONLY way a visitor writes to the database. The anon key
-- ships in the JS bundle, so a bot can call this RPC directly and skip every
-- browser-side check (zod, honeypot): everything is re-validated here.
-- Errors are stable ERR_* codes; the browser maps them to translated messages
-- (src/lib/rpcErrors.ts) and never shows Postgres text.
-- =============================================================================

create or replace function public.submit_inquiry(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_name     text := btrim(coalesce(p->>'name', ''));
  v_email    text := lower(btrim(coalesce(p->>'email', '')));
  v_phone    text := nullif(btrim(coalesce(p->>'phone', '')), '');
  v_company  text := nullif(btrim(coalesce(p->>'company', '')), '');
  v_country  text := nullif(btrim(coalesce(p->>'country', '')), '');
  v_message  text := btrim(coalesce(p->>'message', ''));
  v_kind     text := coalesce(nullif(p->>'kind', ''), 'general');
  v_lang     text := p->>'language';
  v_elapsed  text := coalesce(p->>'elapsed_ms', '');
  v_vehicle  uuid;
  v_label    text;
  v_status   text := 'new';
  v_ref      text;
  v_recent   integer;
begin
  -- Scripted bots submit instantly; a person needs a few seconds to fill the form.
  if v_elapsed !~ '^[0-9]{1,9}$' or v_elapsed::bigint < 2500 then
    raise exception 'ERR_INVALID_INPUT: timing';
  end if;
  if char_length(v_name) not between 2 and 100 then
    raise exception 'ERR_INVALID_INPUT: name';
  end if;
  if char_length(v_email) > 160 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' then
    raise exception 'ERR_INVALID_INPUT: email';
  end if;
  if v_phone is not null and v_phone !~ '^\+?[0-9][0-9 ().\-/]{5,22}$' then
    raise exception 'ERR_INVALID_INPUT: phone';
  end if;
  if char_length(coalesce(v_company, '')) > 120 or char_length(coalesce(v_country, '')) > 80 then
    raise exception 'ERR_INVALID_INPUT: length';
  end if;
  if char_length(v_message) not between 10 and 4000 then
    raise exception 'ERR_INVALID_INPUT: message';
  end if;
  if v_kind not in ('general', 'vehicle', 'sourcing', 'sell', 'export') then
    raise exception 'ERR_INVALID_INPUT: kind';
  end if;
  if coalesce(p->>'consent', '') <> 'true' then
    raise exception 'ERR_INVALID_INPUT: consent';
  end if;
  if v_lang is null or v_lang not in ('ro', 'en', 'fr') then
    v_lang := 'ro';
  end if;

  -- Optional vehicle: must exist and be published. The label is snapshotted.
  if nullif(p->>'vehicle_id', '') is not null then
    if (p->>'vehicle_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'ERR_INVALID_INPUT: vehicle';
    end if;
    select v.id,
           left(concat_ws(' ', coalesce(v.title->>'ro', v.title->>'en', v.title->>'fr'),
                          '(' || v.year || ')', '· ' || v.slug), 200)
      into v_vehicle, v_label
      from public.vehicles v
     where v.id = (p->>'vehicle_id')::uuid and v.status <> 'draft';
    if v_vehicle is null then
      raise exception 'ERR_INVALID_INPUT: vehicle';
    end if;
    v_kind := 'vehicle';
  end if;

  -- Per-sender limit (rejects): 3 per 10 minutes, 10 per day.
  select count(*) into v_recent from public.inquiries
   where lower(email) = v_email and created_at > now() - interval '10 minutes';
  if v_recent >= 3 then
    raise exception 'ERR_RATE_LIMIT';
  end if;
  select count(*) into v_recent from public.inquiries
   where lower(email) = v_email and created_at > now() - interval '24 hours';
  if v_recent >= 10 then
    raise exception 'ERR_RATE_LIMIT';
  end if;

  -- Global burst guard: LOG, don't reject. A one-minute window self-heals, and a
  -- flood can never lock real visitors out — burst rows are filed as 'spam'
  -- (still visible in the admin, never e-mailed).
  select count(*) into v_recent from public.inquiries
   where created_at > now() - interval '1 minute';
  if v_recent >= 30 then
    v_status := 'spam';
    raise warning '[submit_inquiry] global burst: % inquiries in the last minute', v_recent;
  end if;

  -- 10 hex chars (~1.1e12 values): not enumerable.
  loop
    v_ref := 'HAE-' || to_char(now() at time zone 'Europe/Bucharest', 'YYMMDD') || '-'
             || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));
    exit when not exists (select 1 from public.inquiries where reference = v_ref);
  end loop;

  insert into public.inquiries (reference, kind, vehicle_id, vehicle_label, name, company, email,
                                phone, country, message, language, consent_at, status)
  values (v_ref, v_kind, v_vehicle, v_label, left(v_name, 100), v_company, v_email,
          v_phone, v_country, v_message, v_lang, now(), v_status);

  return v_ref;
end;
$$;
revoke execute on function public.submit_inquiry(jsonb) from public;
grant execute on function public.submit_inquiry(jsonb) to anon, authenticated;

-- ------------------------------------------------------------------ stats ----
-- Dashboard KPIs computed in SQL (never by summing every row in the browser).
-- Each block is NULL unless the caller holds that section.
create or replace function public.get_admin_stats()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_vehicles jsonb;
  v_inquiries jsonb;
  v_daily jsonb;
begin
  if not public.is_admin() then
    raise exception 'ERR_FORBIDDEN';
  end if;

  if public.has_section('vehicles') then
    select jsonb_build_object(
      'available', count(*) filter (where status = 'available'),
      'reserved',  count(*) filter (where status = 'reserved'),
      'sold',      count(*) filter (where status = 'sold'),
      'draft',     count(*) filter (where status = 'draft'),
      'sold_30d',  count(*) filter (where status = 'sold' and updated_at > now() - interval '30 days')
    ) into v_vehicles from public.vehicles;
  end if;

  if public.has_section('inquiries') then
    select jsonb_build_object(
      'new',     count(*) filter (where status = 'new'),
      'open',    count(*) filter (where status in ('new', 'contacted', 'negotiating')),
      'last_30d', count(*) filter (where created_at > now() - interval '30 days' and status <> 'spam'),
      'won_30d', count(*) filter (where status = 'won' and updated_at > now() - interval '30 days'),
      'spam',    count(*) filter (where status = 'spam')
    ) into v_inquiries from public.inquiries;

    -- Every day of the window, including empty ones (a chart that skips empty
    -- days spaces a fortnight like a single day).
    select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'count', coalesce(c.n, 0)) order by d.day), '[]')
      into v_daily
      from (
        select (generate_series((now() at time zone 'Europe/Bucharest')::date - 29,
                                (now() at time zone 'Europe/Bucharest')::date, interval '1 day'))::date as day
      ) d
      left join (
        select (created_at at time zone 'Europe/Bucharest')::date as day, count(*) as n
          from public.inquiries
         where created_at > now() - interval '31 days' and status <> 'spam'
         group by 1
      ) c on c.day = d.day;
  end if;

  return jsonb_build_object('vehicles', v_vehicles, 'inquiries', v_inquiries, 'daily', v_daily);
end;
$$;
revoke execute on function public.get_admin_stats() from public, anon;
grant execute on function public.get_admin_stats() to authenticated;
