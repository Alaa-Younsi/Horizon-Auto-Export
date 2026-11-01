-- The owner's admin login is admin@horizon.com (0002 seeded a placeholder e-mail).
-- Create that user in Authentication -> Users FIRST, then run this. Re-running is safe;
-- if the user doesn't exist yet it does nothing, so run it again once they do.
insert into public.admin_profiles (user_id, email, is_owner, sections)
select id, email, true, '{}' from auth.users where lower(email) = 'admin@horizon.com'
on conflict (user_id) do update set is_owner = true, active = true;
