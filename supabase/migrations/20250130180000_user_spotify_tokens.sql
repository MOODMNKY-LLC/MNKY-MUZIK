/*
 * user_spotify_tokens: persist Spotify provider tokens independent of Supabase session.
 * When Supabase refreshes its session, provider_token is nulled. Storing tokens here
 * allows Spotify API routes to work even after session refresh.
 * Affected: Spotify user-scoped APIs (playlists, saved-tracks, recommendations, profile).
 */

-- Store Spotify OAuth tokens per user; refreshed server-side when expired
create table public.user_spotify_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz,
  updated_at timestamptz default now()
);
comment on table public.user_spotify_tokens is 'Spotify OAuth tokens; persisted so API routes work after Supabase session refresh.';

alter table public.user_spotify_tokens enable row level security;

-- Users can only access their own tokens
create policy "user_spotify_tokens_select_authenticated"
  on public.user_spotify_tokens for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_spotify_tokens_insert_authenticated"
  on public.user_spotify_tokens for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_spotify_tokens_update_authenticated"
  on public.user_spotify_tokens for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
