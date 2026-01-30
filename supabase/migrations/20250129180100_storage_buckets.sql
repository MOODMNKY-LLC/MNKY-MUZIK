/*
 * Create Storage buckets for app: images (artwork), songs (audio).
 * Both public so getPublicUrl() works for playback and thumbnails.
 */

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'images',
  'images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'songs',
  'songs',
  true,
  52428800,
  array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
)
on conflict (id) do nothing;

-- RLS: allow authenticated upload/update/delete to own objects; public read
create policy "images_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'images');

create policy "images_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'images');

create policy "images_update_authenticated"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'images');

create policy "images_delete_authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'images');

create policy "songs_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'songs');

create policy "songs_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'songs');

create policy "songs_update_authenticated"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'songs');

create policy "songs_delete_authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'songs');
