-- =============================================================================
-- 0005_notifications.sql — e-mail staff when an inquiry arrives
--
-- Flow: the visitor's browser calls submit_inquiry() (0004), then fire-and-forgets
-- the `notify` edge function with the returned reference. The function (service
-- role) claims the row exactly once through claim_inquiry_notification() and
-- e-mails every active staff member who opted in on their "My account" page.
--
-- The claim function is deliberately NOT granted to anon/authenticated: the
-- service role needs no grant, and a public grant would let anyone (a) read an
-- inquirer's phone/e-mail and (b) burn the one-time claim so the real
-- notification never goes out.
-- =============================================================================

create table public.admin_notification_prefs (
  user_id        uuid primary key references public.admin_profiles(user_id) on delete cascade,
  email_enabled  boolean not null default false,
  notify_email   text check (notify_email is null or notify_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  updated_at     timestamptz not null default now()
);
alter table public.admin_notification_prefs enable row level security;
create trigger admin_notification_prefs_updated_at before update on public.admin_notification_prefs
  for each row execute function public.update_updated_at();

-- Personal contact details: each account manages only its own row.
create policy "admin manages own notification prefs" on public.admin_notification_prefs
  for all to authenticated
  using (user_id = auth.uid() and public.is_admin())
  with check (user_id = auth.uid() and public.is_admin());

create or replace function public.claim_inquiry_notification(p_reference text)
returns table (reference text, kind text, vehicle_label text, name text, company text,
               email text, phone text, country text, message text, language text,
               created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  return query
    update public.inquiries i set notified_at = now()
     where i.reference = p_reference and i.notified_at is null and i.status <> 'spam'
    returning i.reference, i.kind, i.vehicle_label, i.name, i.company, i.email, i.phone,
              i.country, i.message, i.language, i.created_at;
end;
$$;
revoke execute on function public.claim_inquiry_notification(text) from public, anon, authenticated;
grant execute on function public.claim_inquiry_notification(text) to service_role;
