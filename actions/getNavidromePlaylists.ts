'use server';

import { getPlaylists, getPlaylist, isNavidromeConfigured } from '@/libs/navidrome';
import type { NavidromeTrack } from '@/types';

export interface NavidromePlaylistSummary {
  id: string;
  name: string;
  songCount?: number;
  duration?: number;
}

function mapChildToTrack(child: Record<string, unknown>): NavidromeTrack {
  const id = String(child.id ?? '');
  return {
    id,
    source: 'navidrome',
    title: String(child.title ?? ''),
    artist: child.artist != null ? String(child.artist) : undefined,
    album: child.album != null ? String(child.album) : undefined,
    coverArt: child.coverArt != null ? String(child.coverArt) : undefined,
    duration: typeof child.duration === 'number' ? child.duration : undefined,
    contentType: child.contentType != null ? String(child.contentType) : undefined,
  };
}

export async function getNavidromePlaylistsList(): Promise<NavidromePlaylistSummary[]> {
  if (!isNavidromeConfigured()) return [];
  const data = await getPlaylists();
  const list = data?.playlists as { playlist?: Record<string, unknown>[] } | undefined;
  const playlists = list?.playlist ?? [];
  if (!Array.isArray(playlists)) return [];
  return playlists.map((p) => ({
    id: String(p.id ?? ''),
    name: String(p.name ?? ''),
    songCount: typeof p.songCount === 'number' ? p.songCount : undefined,
    duration: typeof p.duration === 'number' ? p.duration : undefined,
  }));
}

export async function getNavidromePlaylistById(id: string): Promise<{
  name: string;
  tracks: NavidromeTrack[];
} | null> {
  if (!isNavidromeConfigured()) return null;
  const data = await getPlaylist(id);
  const playlist = data?.playlist as Record<string, unknown> | undefined;
  if (!playlist) return null;
  const entry = playlist.entry;
  const entries = Array.isArray(entry) ? entry : entry ? [entry] : [];
  const tracks = entries.map((e) => mapChildToTrack(e as Record<string, unknown>));
  return {
    name: String(playlist.name ?? ''),
    tracks,
  };
}

export { isNavidromeConfigured };
