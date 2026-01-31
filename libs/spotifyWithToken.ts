/**
 * Server-only Spotify Web API client for user-scoped requests.
 * Accepts a user access token (e.g. session.provider_token from Supabase after Spotify OAuth).
 * Do not import in client components.
 */

const API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

/**
 * Refresh Spotify access token using provider_refresh_token.
 * Returns new access_token or null. Requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.
 */
export async function refreshSpotifyToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: body.toString(),
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

async function spotifyFetchWithToken<T>(
  accessToken: string,
  path: string,
  params?: Record<string, string>
): Promise<T | null> {
  const url = new URL(
    path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
  );
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (res.status === 401) return null;
  if (res.status === 429) {
    const retryAfter = res.headers.get('Retry-After');
    if (retryAfter) {
      await new Promise((r) => setTimeout(r, parseInt(retryAfter, 10) * 1000));
      return spotifyFetchWithToken<T>(accessToken, path, params);
    }
  }
  if (!res.ok) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export interface SpotifyUserProfile {
  id: string;
  display_name: string | null;
  email?: string;
  images?: { url: string; height?: number; width?: number }[];
  external_urls?: { spotify?: string };
  country?: string;
  product?: string;
  followers?: { total: number };
}

export async function getCurrentUserProfile(
  accessToken: string
): Promise<SpotifyUserProfile | null> {
  return spotifyFetchWithToken<SpotifyUserProfile>(accessToken, '/me');
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  images?: { url: string; height?: number; width?: number }[];
  tracks?: { total: number };
  external_urls?: { spotify?: string };
  owner?: { display_name?: string };
}

export interface SpotifyUserPlaylistsResponse {
  items: SpotifyPlaylist[];
  next: string | null;
  total: number;
}

export async function getCurrentUserPlaylists(
  accessToken: string,
  limit = 20,
  offset = 0
): Promise<SpotifyUserPlaylistsResponse | null> {
  return spotifyFetchWithToken<SpotifyUserPlaylistsResponse>(accessToken, '/me/playlists', {
    limit: String(limit),
    offset: String(offset),
  });
}

export interface SpotifyPlaylistTrack {
  track: {
    id: string;
    name: string;
    duration_ms?: number;
    artists?: { id: string; name: string }[];
    album?: { id: string; name: string; images?: { url: string }[] };
    external_urls?: { spotify?: string };
  } | null;
}

export interface SpotifyPlaylistWithTracks {
  id: string;
  name: string;
  description: string | null;
  images?: { url: string }[];
  tracks: {
    items: SpotifyPlaylistTrack[];
    total: number;
  };
  external_urls?: { spotify?: string };
}

export async function getPlaylist(
  accessToken: string,
  playlistId: string
): Promise<SpotifyPlaylistWithTracks | null> {
  return spotifyFetchWithToken<SpotifyPlaylistWithTracks>(
    accessToken,
    `/playlists/${encodeURIComponent(playlistId)}`,
    { market: 'from_token' }
  );
}

export interface SpotifyTrackInfo {
  id: string;
  name: string;
  uri: string;
  duration_ms?: number;
  artists?: { id: string; name: string }[];
  album?: { id: string; name: string; images?: { url: string }[] };
}

export async function getTrack(
  accessToken: string,
  trackId: string
): Promise<SpotifyTrackInfo | null> {
  return spotifyFetchWithToken<SpotifyTrackInfo>(
    accessToken,
    `/tracks/${encodeURIComponent(trackId)}`,
    { market: 'from_token' }
  );
}

export interface SpotifySavedTrack {
  added_at?: string;
  track: {
    id: string;
    name: string;
    duration_ms?: number;
    artists?: { id: string; name: string }[];
    album?: { id: string; name: string; images?: { url: string }[] };
    external_urls?: { spotify?: string };
  };
}

export interface SpotifySavedTracksResponse {
  items: SpotifySavedTrack[];
  next: string | null;
  total: number;
}

export async function getSavedTracks(
  accessToken: string,
  limit = 20,
  offset = 0
): Promise<SpotifySavedTracksResponse | null> {
  return spotifyFetchWithToken<SpotifySavedTracksResponse>(accessToken, '/me/tracks', {
    limit: String(limit),
    offset: String(offset),
  });
}

export interface SpotifyRecommendationsResponse {
  tracks: {
    id: string;
    name: string;
    artists?: { id: string; name: string }[];
    album?: { id: string; name: string; images?: { url: string }[] };
    duration_ms?: number;
    external_urls?: { spotify?: string };
  }[];
}

export async function getRecommendations(
  accessToken: string,
  params: { seed_artists?: string; seed_tracks?: string; seed_genres?: string; limit?: number }
): Promise<SpotifyRecommendationsResponse | null> {
  const q: Record<string, string> = {};
  if (params.seed_artists) q.seed_artists = params.seed_artists;
  if (params.seed_tracks) q.seed_tracks = params.seed_tracks;
  if (params.seed_genres) q.seed_genres = params.seed_genres;
  q.limit = String(params.limit ?? 20);
  return spotifyFetchWithToken<SpotifyRecommendationsResponse>(accessToken, '/recommendations', q);
}

export interface SpotifyTopItemsResponse {
  items: { id: string; name: string; images?: { url: string }[] }[];
}

export async function getTopArtists(
  accessToken: string,
  limit = 5,
  timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'
): Promise<SpotifyTopItemsResponse | null> {
  return spotifyFetchWithToken<SpotifyTopItemsResponse>(accessToken, '/me/top/artists', {
    limit: String(limit),
    time_range: timeRange,
  });
}

export async function getRecentlyPlayed(
  accessToken: string,
  limit = 20
): Promise<{ items: { track: { id: string; name: string; artists?: { id: string; name: string }[] } }[] } | null> {
  return spotifyFetchWithToken(accessToken, '/me/player/recently-played', { limit: String(limit) });
}
