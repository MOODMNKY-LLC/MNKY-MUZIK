/**
 * Server-only MusicBrainz API client.
 * No API key required. Rate limit ~1 req/s; we throttle requests.
 * Do not import in client components.
 */

const API_BASE = 'https://musicbrainz.org/ws/2';
const USER_AGENT = 'SpotifyClone/1.0 (https://github.com/your-repo)';

let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1100;

async function throttle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

async function musicbrainzFetch<T>(path: string, params?: Record<string, string>): Promise<T | null> {
  await throttle();
  const url = new URL(path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  if (!url.searchParams.has('fmt')) {
    url.searchParams.set('fmt', 'json');
  }
  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT },
    cache: 'no-store',
  });
  if (res.status === 503 || res.status === 429) {
    await new Promise((r) => setTimeout(r, 2000));
    return musicbrainzFetch<T>(path, params);
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

export interface MusicBrainzArtist {
  id: string;
  name: string;
  disambiguation?: string;
  'sort-name'?: string;
  type?: string;
  'life-span'?: { begin?: string; end?: string };
  relations?: { url?: { id: string; resource: string }; type?: string }[];
}

export interface MusicBrainzSearchResult<T> {
  artists?: T[];
  releases?: T[];
  recordings?: T[];
  count?: number;
  offset?: number;
}

export async function searchArtists(query: string, limit = 20): Promise<MusicBrainzArtist[]> {
  const encoded = encodeURIComponent(query);
  const data = await musicbrainzFetch<{ artists?: MusicBrainzArtist[] }>(
    `/artist?query=${encoded}&limit=${Math.min(limit, 100)}`
  );
  return data?.artists ?? [];
}

export async function searchReleases(query: string, limit = 20): Promise<unknown[]> {
  const encoded = encodeURIComponent(query);
  const data = await musicbrainzFetch<{ releases?: unknown[] }>(
    `/release?query=${encoded}&limit=${Math.min(limit, 100)}`
  );
  return data?.releases ?? [];
}

export async function searchRecordings(query: string, limit = 20): Promise<unknown[]> {
  const encoded = encodeURIComponent(query);
  const data = await musicbrainzFetch<{ recordings?: unknown[] }>(
    `/recording?query=${encoded}&limit=${Math.min(limit, 100)}`
  );
  return data?.recordings ?? [];
}

export interface MusicBrainzArtistLookup extends MusicBrainzArtist {
  relations?: { url?: { id: string; resource: string }; type?: string }[];
}

export async function getArtist(mbid: string): Promise<MusicBrainzArtistLookup | null> {
  return musicbrainzFetch<MusicBrainzArtistLookup>(`/artist/${mbid}?inc=url-relations`);
}

export interface MusicBrainzRelease {
  id: string;
  title: string;
  date?: string;
  'artist-credit'?: { name: string; artist?: { id: string; name: string } }[];
  'release-group'?: { id: string; title: string };
  relations?: { url?: { resource: string }; type?: string }[];
}

export async function getRelease(mbid: string): Promise<MusicBrainzRelease | null> {
  return musicbrainzFetch<MusicBrainzRelease>(`/release/${mbid}?inc=artist-credits+release-groups+url-relations`);
}
