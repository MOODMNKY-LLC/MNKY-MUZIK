/**
 * Server-only Spotify Web API client (public metadata only).
 * Uses Client Credentials flow. Env: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET.
 * Do not import in client components.
 */

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API_BASE = 'https://api.spotify.com/v1';

let cachedToken: { access_token: string; expires_at: number } | null = null;
const TOKEN_BUFFER_MS = 60 * 1000;

function getConfig(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

async function getAccessToken(): Promise<string | null> {
  const config = getConfig();
  if (!config) return null;
  const now = Date.now();
  if (cachedToken && cachedToken.expires_at > now + TOKEN_BUFFER_MS) {
    return cachedToken.access_token;
  }
  const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  const access_token = data.access_token;
  const expires_in = typeof data.expires_in === 'number' ? data.expires_in : 3600;
  if (!access_token) return null;
  cachedToken = {
    access_token,
    expires_at: now + expires_in * 1000,
  };
  return access_token;
}

async function spotifyFetch<T>(path: string, params?: Record<string, string>): Promise<T | null> {
  const token = await getAccessToken();
  if (!token) return null;
  const url = new URL(path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (res.status === 429) {
    const retryAfter = res.headers.get('Retry-After');
    if (retryAfter) {
      await new Promise((r) => setTimeout(r, parseInt(retryAfter, 10) * 1000));
      return spotifyFetch<T>(path, params);
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

export function isSpotifyConfigured(): boolean {
  return getConfig() !== null;
}

export interface SpotifySearchResult {
  artists?: { items: unknown[] };
  albums?: { items: unknown[] };
  tracks?: { items: unknown[] };
}

export async function search(
  q: string,
  type: 'artist' | 'album' | 'track' = 'artist',
  limit = 20
): Promise<SpotifySearchResult | null> {
  const encoded = encodeURIComponent(q);
  return spotifyFetch<SpotifySearchResult>(
    `/search?q=${encoded}&type=${type}&limit=${Math.min(limit, 50)}`
  );
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images?: { url: string; height?: number; width?: number }[];
  genres?: string[];
  external_urls?: { spotify?: string };
}

export async function getArtist(id: string): Promise<SpotifyArtist | null> {
  return spotifyFetch<SpotifyArtist>(`/artists/${id}`);
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  artists?: { id: string; name: string }[];
  images?: { url: string; height?: number; width?: number }[];
  release_date?: string;
  external_urls?: { spotify?: string };
}

export async function getAlbum(id: string): Promise<SpotifyAlbum | null> {
  return spotifyFetch<SpotifyAlbum>(`/albums/${id}`);
}

export interface SpotifyAlbumTrack {
  id: string;
  name: string;
  duration_ms?: number;
  track_number?: number;
}

export interface SpotifyAlbumTracksResponse {
  items: SpotifyAlbumTrack[];
  next?: string | null;
}

export async function getAlbumTracks(albumId: string): Promise<SpotifyAlbumTracksResponse | null> {
  return spotifyFetch<SpotifyAlbumTracksResponse>(`/albums/${albumId}/tracks?limit=50`);
}

/** Optional enrichment: search by album + artist and return first match (image + link). */
export interface SpotifyEnrichment {
  imageUrl: string | null;
  spotifyUrl: string | null;
  name: string;
}

export async function enrichAlbumByQuery(albumName: string, artistName: string): Promise<SpotifyEnrichment | null> {
  const q = `album:${albumName.replace(/"/g, '')} artist:${artistName.replace(/"/g, '')}`.trim();
  if (!q) return null;
  const data = await search(q, 'album', 5);
  const items = data?.albums?.items as { images?: { url: string; height?: number }[]; external_urls?: { spotify?: string }; name?: string }[] | undefined;
  const first = Array.isArray(items) ? items[0] : null;
  if (!first) return null;
  const images = first.images;
  const sorted = Array.isArray(images) ? [...images].sort((a, b) => (b.height ?? 0) - (a.height ?? 0)) : [];
  const imageUrl = sorted[0]?.url ?? null;
  return {
    imageUrl: imageUrl ?? null,
    spotifyUrl: first.external_urls?.spotify ?? null,
    name: first.name ?? albumName,
  };
}
