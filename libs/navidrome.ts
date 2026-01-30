/**
 * Server-only Navidrome (Subsonic API) client.
 * Uses env: NAVIDROME_URL, NAVIDROME_USER, NAVIDROME_PASSWORD.
 * Do not import in client components.
 */

import { randomBytes, createHash } from 'crypto';

const SUBSONIC_VERSION = '1.16.1';
const CLIENT_NAME = 'spotify-clone';

function getConfig(): { baseUrl: string; user: string; password: string } | null {
  const baseUrl = process.env.NAVIDROME_URL?.trim()?.replace(/\/$/, '');
  const user = process.env.NAVIDROME_USER?.trim();
  const password = process.env.NAVIDROME_PASSWORD?.trim();
  if (!baseUrl || !user || !password) {
    return null;
  }
  return { baseUrl, user, password };
}

/**
 * Build Subsonic auth query params (token-based, no plain password).
 */
function buildAuthParams(password: string): { u: string; t: string; s: string; v: string; c: string; f: string } {
  const salt = randomBytes(4).toString('hex');
  const token = createHash('md5').update(password + salt).digest('hex').toLowerCase();
  return {
    u: process.env.NAVIDROME_USER!,
    t: token,
    s: salt,
    v: SUBSONIC_VERSION,
    c: CLIENT_NAME,
    f: 'json',
  };
}

/**
 * Append auth params to a URL or return query string.
 */
function appendAuth(url: URL, password: string): void {
  const params = buildAuthParams(password);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
}

/**
 * Build stream URL for a track id (redirect or use as audio src).
 * Use format=mp3 so transcoding works with use-sound.
 */
export function buildStreamUrl(trackId: string, format = 'mp3'): string | null {
  const config = getConfig();
  if (!config) return null;
  const url = new URL(`${config.baseUrl}/rest/stream`);
  url.searchParams.set('id', trackId);
  url.searchParams.set('format', format);
  appendAuth(url, config.password);
  return url.toString();
}

/**
 * Build getCoverArt URL for cover id.
 */
export function buildCoverArtUrl(coverId: string, size?: number): string | null {
  const config = getConfig();
  if (!config) return null;
  const url = new URL(`${config.baseUrl}/rest/getCoverArt`);
  url.searchParams.set('id', coverId);
  if (size != null) url.searchParams.set('size', String(size));
  appendAuth(url, config.password);
  return url.toString();
}

/**
 * Generic GET to Subsonic REST; returns parsed JSON subsonic response.
 * Returns null on fetch failure (Navidrome down, wrong URL, network error) so the app does not crash.
 */
async function subsonicGet(path: string, extraParams: Record<string, string> = {}): Promise<Record<string, unknown> | null> {
  const config = getConfig();
  if (!config) return null;
  const url = new URL(`${config.baseUrl}/rest/${path}`);
  appendAuth(url, config.password);
  Object.entries(extraParams).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as { 'subsonic-response'?: { status?: string; error?: { code?: number; message?: string }; [key: string]: unknown } };
    const sub = data['subsonic-response'];
    if (!sub || sub.status !== 'ok') return null;
    return sub as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * getIndexes – artists/index structure.
 */
export async function getIndexes(musicFolderId?: string): Promise<Record<string, unknown> | null> {
  const params: Record<string, string> = {};
  if (musicFolderId) params.musicFolderId = musicFolderId;
  return subsonicGet('getIndexes.view', params);
}

/**
 * getMusicDirectory – contents of a folder (artist albums or album tracks).
 */
export async function getMusicDirectory(id: string): Promise<Record<string, unknown> | null> {
  return subsonicGet('getMusicDirectory.view', { id });
}

/**
 * getAlbum – album by id (ID3); returns album with song list.
 */
export async function getAlbum(id: string): Promise<Record<string, unknown> | null> {
  return subsonicGet('getAlbum.view', { id });
}

/**
 * search2 – search for artists, albums, songs.
 */
export async function search2(query: string, musicFolderId?: string): Promise<Record<string, unknown> | null> {
  const params: Record<string, string> = { query: query.trim() };
  if (musicFolderId) params.musicFolderId = musicFolderId;
  return subsonicGet('search2.view', params);
}

/**
 * getAlbumList2 – list albums (type: newest, recent, frequent, etc.).
 */
export async function getAlbumList2(type: string, size = 20, offset = 0): Promise<Record<string, unknown> | null> {
  return subsonicGet('getAlbumList2.view', { type, size: String(size), offset: String(offset) });
}

/**
 * getRandomSongs – random tracks (optional size).
 */
export async function getRandomSongs(size = 50): Promise<Record<string, unknown> | null> {
  return subsonicGet('getRandomSongs.view', { size: String(size) });
}

/**
 * getSong – single track by id.
 */
export async function getSong(id: string): Promise<Record<string, unknown> | null> {
  return subsonicGet('getSong.view', { id });
}

/**
 * getPlaylists – all playlists for the user.
 */
export async function getPlaylists(): Promise<Record<string, unknown> | null> {
  return subsonicGet('getPlaylists.view');
}

/**
 * getPlaylist – single playlist by id (returns entry/entry[] for tracks).
 */
export async function getPlaylist(id: string): Promise<Record<string, unknown> | null> {
  return subsonicGet('getPlaylist.view', { id });
}

/**
 * scrobble – mark track as played (submission=true for play count / Last.fm).
 */
export async function scrobble(trackId: string, submission = true): Promise<boolean> {
  const params: Record<string, string> = { id: trackId };
  if (submission) params.submission = 'true';
  const data = await subsonicGet('scrobble.view', params);
  return data != null;
}

export function isNavidromeConfigured(): boolean {
  return getConfig() !== null;
}
