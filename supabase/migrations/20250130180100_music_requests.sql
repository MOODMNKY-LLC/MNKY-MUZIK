/*
 * music_requests: track user requests for artists/albums via Lidarr.
 * Used for request history and status display (Jellyseerr-inspired UX).
 */

create table public.music_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('artist', 'album')),
  lidarr_id text,
  title text not null,
  artist_name text,
  status text not null default 'requested' check (status in ('requested', 'available')),
  created_at timestamptz default now()
);
comment on table public.music_requests is 'User music requests via Lidarr; for history and status display.';

create index music_requests_user_id_idx on public.music_requests (user_id);
create index music_requests_created_at_idx on public.music_requests (created_at desc);

alter table public.music_requests enable row level security;

create policy "music_requests_select_authenticated"
  on public.music_requests for select
  to authenticated
  using (auth.uid() = user_id);

create policy "music_requests_insert_authenticated"
  on public.music_requests for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "music_requests_update_authenticated"
  on public.music_requests for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
