import { NextResponse } from 'next/server';
import {
  isLidarrConfigured,
  addArtist,
  addAlbum,
  artistLookup,
} from '@/libs/lidarr';

export async function POST(request: Request) {
  if (!isLidarrConfigured()) {
    return NextResponse.json({ error: 'Lidarr not configured' }, { status: 503 });
  }

  let body: { type?: string; artist?: Record<string, unknown>; album?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { type, artist: artistBody, album: albumBody } = body;

  const stripEnrichment = (obj: Record<string, unknown>) => {
    const { imageUrl, spotifyUrl, genres, alreadyInLibrary, ...rest } = obj;
    return rest;
  };

  if (type === 'artist' && artistBody) {
    try {
      const payload = stripEnrichment(artistBody);
      const result = await addArtist(payload);
      if (result == null) {
        return NextResponse.json(
          { error: 'Lidarr did not add the artist' },
          { status: 502 }
        );
      }
      return NextResponse.json({ success: true, data: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add artist';
      console.error('[Lidarr request] Artist add failed:', message);
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (type === 'album' && albumBody) {
    try {
      const payload = stripEnrichment(albumBody);
      const result = await addAlbum(payload);
      if (result == null) {
        return NextResponse.json(
          { error: 'Lidarr did not add the album' },
          { status: 502 }
        );
      }
      return NextResponse.json({ success: true, data: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add album';
      console.error('[Lidarr request] Album add failed:', message);
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  console.error('[Lidarr request] 400: Missing type or artist/album body.', { type, hasArtist: !!artistBody, hasAlbum: !!albumBody });
  return NextResponse.json({ error: 'Missing type and artist/album body' }, { status: 400 });
}
