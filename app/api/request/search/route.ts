import { NextResponse } from 'next/server';
import {
  artistLookup,
  albumLookup,
  isLidarrConfigured,
} from '@/libs/lidarr';
import { getArtist as getMusicBrainzArtist, getRelease as getMusicBrainzRelease } from '@/libs/musicbrainz';
import { search2, isNavidromeConfigured } from '@/libs/navidrome';
import {
  search as spotifySearch,
  enrichAlbumByQuery,
  isSpotifyConfigured,
} from '@/libs/spotify';
import type {
  LidarrArtistLookup,
  LidarrAlbumLookup,
  EnrichedRequestArtist,
  EnrichedRequestAlbum,
} from '@/types';

export const dynamic = 'force-dynamic';

const MAX_ARTISTS = 10;
const MAX_ALBUMS = 10;
const MAX_MUSICBRAINZ_ARTISTS = 3;
const MAX_MUSICBRAINZ_ALBUMS = 3;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function lidarrImageUrl(url: string | undefined): string | null {
  if (!url) return null;
  const base = process.env.LIDARR_URL?.trim()?.replace(/\/$/, '');
  if (!base) return null;
  return url.startsWith('http') ? url : `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

function firstImageUrl(images: { url?: string; coverType?: string }[] | undefined): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;
  const u = images[0]?.url;
  return u ? lidarrImageUrl(u) : null;
}

export async function GET(request: Request) {
  if (!isLidarrConfigured()) {
    return NextResponse.json(
      { error: 'Lidarr not configured', artists: [], albums: [] },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? searchParams.get('term')?.trim() ?? '';
  if (!q) {
    return NextResponse.json({ artists: [], albums: [] });
  }

  try {
    const [lidarrArtists, lidarrAlbums] = await Promise.all([
      artistLookup(q),
      albumLookup(q),
    ]);

    const artists = (Array.isArray(lidarrArtists) ? lidarrArtists : []) as LidarrArtistLookup[];
    const albums = (Array.isArray(lidarrAlbums) ? lidarrAlbums : []) as LidarrAlbumLookup[];
    const artistsSlice = artists.slice(0, MAX_ARTISTS);
    const albumsSlice = albums.slice(0, MAX_ALBUMS);

    let navidromeArtists: { name: string }[] = [];
    let navidromeAlbums: { name: string; artist?: string }[] = [];

    if (isNavidromeConfigured()) {
      const ndData = await search2(q);
      const sr = ndData?.searchResult2 as { artist?: { name?: string }[]; album?: { name?: string; artist?: string }[] } | undefined;
      if (sr) {
        navidromeArtists = (Array.isArray(sr.artist) ? sr.artist : []).map((a) => ({
          name: String(a?.name ?? ''),
        }));
        navidromeAlbums = (Array.isArray(sr.album) ? sr.album : []).map((a) => ({
          name: String(a?.name ?? ''),
          artist: a?.artist != null ? String(a.artist) : undefined,
        }));
      }
    }

    const artistNameSet = new Set(navidromeArtists.map((a) => normalize(a.name)));
    const albumKeySet = new Set(
      navidromeAlbums.map((a) => `${normalize(a.name)}|${normalize(a.artist ?? '')}`)
    );

    const enrichedArtists: EnrichedRequestArtist[] = await Promise.all(
      artistsSlice.map(async (a): Promise<EnrichedRequestArtist> => {
        const name = String(a.artistName ?? a.name ?? '');
        const alreadyInLibrary = artistNameSet.has(normalize(name));

        let imageUrl: string | null = firstImageUrl(a.images) ?? null;
        let spotifyUrl: string | null = null;
        let genres: string[] | undefined;

        if (isSpotifyConfigured() && name) {
          const spotifyData = await spotifySearch(name, 'artist', 1);
          const items = spotifyData?.artists?.items as { images?: { url: string }[]; external_urls?: { spotify?: string }; genres?: string[] }[] | undefined;
          const first = Array.isArray(items) ? items[0] : null;
          if (first) {
            if (!imageUrl && first.images?.length) {
              imageUrl = first.images[0]?.url ?? null;
            }
            spotifyUrl = first.external_urls?.spotify ?? null;
            genres = first.genres;
          }
        }

        return {
          ...a,
          imageUrl: imageUrl ?? undefined,
          spotifyUrl: spotifyUrl ?? undefined,
          genres,
          alreadyInLibrary,
        };
      })
    );

    const enrichedAlbums: EnrichedRequestAlbum[] = await Promise.all(
      albumsSlice.map(async (a): Promise<EnrichedRequestAlbum> => {
        const title = String(a.title ?? '');
        const artistName = typeof a.artist === 'object' && a.artist
          ? String((a.artist as { artistName?: string; name?: string }).artistName ?? (a.artist as { name?: string }).name ?? '')
          : String(a.artistName ?? '');
        const albumKey = `${normalize(title)}|${normalize(artistName)}`;
        const alreadyInLibrary = albumKeySet.has(albumKey);

        let imageUrl: string | null = firstImageUrl(a.images) ?? null;
        let spotifyUrl: string | null = null;

        if (isSpotifyConfigured() && title) {
          const enrich = await enrichAlbumByQuery(title, artistName);
          if (enrich) {
            if (!imageUrl) imageUrl = enrich.imageUrl;
            spotifyUrl = enrich.spotifyUrl;
          }
        }

        return {
          ...a,
          imageUrl: imageUrl ?? undefined,
          spotifyUrl: spotifyUrl ?? undefined,
          alreadyInLibrary,
        };
      })
    );

    // Optional MusicBrainz enrichment: disambiguation for artists, release date for albums (rate-limited ~1 req/s)
    for (let i = 0; i < Math.min(MAX_MUSICBRAINZ_ARTISTS, enrichedArtists.length); i++) {
      const a = enrichedArtists[i];
      const mbid = a.foreignArtistId;
      if (mbid && !a.disambiguation) {
        const mb = await getMusicBrainzArtist(mbid);
        if (mb?.disambiguation) {
          enrichedArtists[i] = { ...a, disambiguation: mb.disambiguation };
        }
      }
    }
    for (let i = 0; i < Math.min(MAX_MUSICBRAINZ_ALBUMS, enrichedAlbums.length); i++) {
      const a = enrichedAlbums[i];
      const mbid = a.foreignAlbumId;
      if (mbid && !a.releaseDate) {
        const mb = await getMusicBrainzRelease(mbid);
        if (mb?.date) {
          enrichedAlbums[i] = { ...a, releaseDate: mb.date };
        }
      }
    }

    return NextResponse.json({ artists: enrichedArtists, albums: enrichedAlbums });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed';
    return NextResponse.json(
      { error: message, artists: [], albums: [] },
      { status: 502 }
    );
  }
}
