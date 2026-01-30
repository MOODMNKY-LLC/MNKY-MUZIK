/*
 * liked_navidrome_tracks: user likes for Navidrome (Subsonic) tracks.
 * Keeps liked_songs for Supabase songs; this table for Navidrome track ids.
 * Affected: new table liked_navidrome_tracks, RLS.
 */

-- User likes for Navidrome tracks (track id is Subsonic string id).
create table public.liked_navidrome_tracks (
  user_id uuid not null references public.users (id) on delete cascade,
  navidrome_track_id text not null,
  created_at timestamptz default now(),
  primary key (user_id, navidrome_track_id)
);
comment on table public.liked_navidrome_tracks is 'User likes for Navidrome (Subsonic) tracks; track id is from Navidrome API.';

alter table public.liked_navidrome_tracks enable row level security;

create policy "liked_navidrome_tracks_select_authenticated"
  on public.liked_navidrome_tracks for select
  to authenticated
  using (auth.uid() = user_id);

create policy "liked_navidrome_tracks_insert_authenticated"
  on public.liked_navidrome_tracks for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "liked_navidrome_tracks_delete_authenticated"
  on public.liked_navidrome_tracks for delete
  to authenticated
  using (auth.uid() = user_id);
