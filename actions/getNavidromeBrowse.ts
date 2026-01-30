'use server';

import {
  getAlbumList2,
  getRandomSongs,
  search2,
  getAlbum,
  getMusicDirectory,
  isNavidromeConfigured,
} from '@/libs/navidrome';
import type { NavidromeTrack } from '@/types';

export interface NavidromeAlbumSummary {
  id: string;
  name: string;
  artist?: string;
  artistId?: string;
  coverArt?: string;
  songCount?: number;
}

export interface NavidromeArtistSummary {
  id: string;
  name: string;
  coverArt?: string;
  albumCount?: number;
}

export interface NavidromeSearchResult {
  artists: NavidromeArtistSummary[];
  albums: NavidromeAlbumSummary[];
  songs: NavidromeTrack[];
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

function mapAlbum(album: Record<string, unknown>): NavidromeAlbumSummary {
  return {
    id: String(album.id ?? ''),
    name: String(album.name ?? ''),
    artist: album.artist != null ? String(album.artist) : undefined,
    artistId: album.artistId != null ? String(album.artistId) : undefined,
    coverArt: album.coverArt != null ? String(album.coverArt) : undefined,
    songCount: typeof album.songCount === 'number' ? album.songCount : undefined,
  };
}

function mapArtist(artist: Record<string, unknown>): NavidromeArtistSummary {
  return {
    id: String(artist.id ?? ''),
    name: String(artist.name ?? artist.title ?? ''),
    coverArt: artist.coverArt != null ? String(artist.coverArt) : undefined,
    albumCount: typeof artist.albumCount === 'number' ? artist.albumCount : undefined,
  };
}

export async function getNavidromeAlbumList(
  type: 'newest' | 'recent' | 'frequent' | 'random',
  size = 12
): Promise<NavidromeAlbumSummary[]> {
  if (!isNavidromeConfigured()) return [];
  const data = await getAlbumList2(type, size, 0);
  const list = data?.albumList2 as { album?: Record<string, unknown>[] } | undefined;
  const albums = list?.album ?? [];
  return Array.isArray(albums) ? albums.map((a) => mapAlbum(a as Record<string, unknown>)) : [];
}

export async function getNavidromeRandomSongs(size = 10): Promise<NavidromeTrack[]> {
  if (!isNavidromeConfigured()) return [];
  const data = await getRandomSongs(size);
  const list = data?.randomSongs as { song?: Record<string, unknown>[] } | undefined;
  const songs = list?.song ?? [];
  return Array.isArray(songs) ? songs.map((s) => mapChildToTrack(s as Record<string, unknown>)) : [];
}

export async function getNavidromeSearch(query: string): Promise<NavidromeSearchResult> {
  const empty: NavidromeSearchResult = { artists: [], albums: [], songs: [] };
  if (!isNavidromeConfigured() || !query.trim()) return empty;
  const data = await search2(query.trim());
  const sr = data?.searchResult2 as Record<string, unknown> | undefined;
  if (!sr) return empty;
  const artists = (Array.isArray(sr.artist) ? sr.artist : []) as Record<string, unknown>[];
  const albums = (Array.isArray(sr.album) ? sr.album : []) as Record<string, unknown>[];
  const songs = (Array.isArray(sr.song) ? sr.song : []) as Record<string, unknown>[];
  return {
    artists: artists.map((a) => mapArtist(a)),
    albums: albums.map((a) => mapAlbum(a)),
    songs: songs.map((s) => mapChildToTrack(s)),
  };
}

export async function getNavidromeAlbumById(id: string): Promise<{
  album: NavidromeAlbumSummary;
  songs: NavidromeTrack[];
} | null> {
  if (!isNavidromeConfigured()) return null;
  const data = await getAlbum(id);
  const album = data?.album as Record<string, unknown> | undefined;
  if (!album) return null;
  const songList = (Array.isArray(album.song) ? album.song : []) as Record<string, unknown>[];
  return {
    album: mapAlbum(album),
    songs: songList.map((s) => mapChildToTrack(s)),
  };
}

export async function getNavidromeArtistById(id: string): Promise<{
  name: string;
  albums: NavidromeAlbumSummary[];
  songs: NavidromeTrack[];
} | null> {
  if (!isNavidromeConfigured()) return null;
  const data = await getMusicDirectory(id);
  const dir = data?.directory as Record<string, unknown> | undefined;
  if (!dir) return null;
  const children = (Array.isArray(dir.child) ? dir.child : []) as Record<string, unknown>[];
  const name = String(dir.name ?? '');
  const albums: NavidromeAlbumSummary[] = [];
  const songs: NavidromeTrack[] = [];
  for (const c of children) {
    const isDir = c.isDir === true;
    if (isDir) {
      albums.push(mapAlbum(c));
    } else {
      songs.push(mapChildToTrack(c));
    }
  }
  return { name, albums, songs };
}

export { isNavidromeConfigured };
