-- =============================================================================
-- 0006_storage.sql — one public-read bucket for site media
--   media/vehicles/<vehicle id>/…   media/brands/…   media/site/…
-- Files are uploaded under a UUID path with cacheControl 31536000 (immutable),
-- after being downscaled + re-encoded to WebP in the browser (src/lib/image.ts).
-- Writes need an active staff account; the tables that reference the uploads
-- are what is gated per section.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 8388608, array['image/webp','image/jpeg','image/png','image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "public read media" on storage.objects
  for select to anon, authenticated using (bucket_id = 'media');
create policy "staff upload media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy "staff update media" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());
create policy "staff delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());
