-- =============================================================================
-- 0013_storage_no_public_listing.sql — visitors can't list the media bucket
--
-- 0006 let anon SELECT on storage.objects for the `media` bucket. Displaying a
-- photo never needs that (the bucket is public: files are served by their URL
-- without any policy), but the policy also lets anyone call the storage API's
-- list endpoint and enumerate every file — including photos of draft vehicles
-- that aren't published yet. Staff keep SELECT: the dashboard's delete and
-- replace calls need it. Safe to re-run.
-- =============================================================================

drop policy if exists "public read media" on storage.objects;
drop policy if exists "staff read media" on storage.objects;

create policy "staff read media" on storage.objects
  for select to authenticated using (bucket_id = 'media' and public.is_admin());
