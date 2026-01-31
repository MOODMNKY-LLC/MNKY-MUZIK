import { NextResponse } from 'next/server';
import {
  isLidarrConfigured,
  albumLookup,
  artistLookup,
  addAlbum,
  addArtist,
} from '@/libs/lidarr';

export const dynamic = 'force-dynamic';

function stripEnrichment(obj: Record<string, unknown>): Record<string, unknown> {
  const { imageUrl, spotifyUrl, genres, alreadyInLibrary, ...rest } = obj;
  return rest;
}

export async function POST(request: Request) {
  if (!isLidarrConfigured()) {
    return NextResponse.json(
      { error: 'Lidarr not configured' },
      { status: 503 }
    );
  }

  let body: { title?: string; artist?: string; album?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const artist = typeof body.artist === 'string' ? body.artist.trim() : '';
  const album = typeof body.album === 'string' ? body.album.trim() : '';

  if (!title && !artist) {
    return NextResponse.json(
      { error: 'At least title or artist is required' },
      { status: 400 }
    );
  }

  const searchTerm = artist
    ? album
      ? `${artist} ${album}`
      : `${artist} ${title}`
    : title;

  try {
    const albums = await albumLookup(searchTerm);
    const albumList = Array.isArray(albums) ? albums : [];
    if (albumList.length > 0) {
      const first = albumList[0] as Record<string, unknown>;
      const payload = stripEnrichment(first);
      await addAlbum(payload);
      return NextResponse.json({
        success: true,
        message: 'Album added to Lidarr. It will download and appear in your library when ready.',
      });
    }

    const artistTerm = artist || title;
    const artists = await artistLookup(artistTerm);
    const artistList = Array.isArray(artists) ? artists : [];
    if (artistList.length > 0) {
      const first = artistList[0] as Record<string, unknown>;
      const payload = stripEnrichment(first);
      await addArtist(payload);
      return NextResponse.json({
        success: true,
        message: 'Artist added to Lidarr. It will download and appear in your library when ready.',
      });
    }

    return NextResponse.json(
      { error: 'No matching album or artist found in Lidarr' },
      { status: 404 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Request failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
