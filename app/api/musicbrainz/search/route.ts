import { NextResponse } from 'next/server';
import { searchArtists, searchReleases, searchRecordings } from '@/libs/musicbrainz';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const type = searchParams.get('type') || 'artist';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10) || 20, 100);

  if (!q) {
    return NextResponse.json({ error: 'Missing q' }, { status: 400 });
  }

  try {
    if (type === 'artist') {
      const artists = await searchArtists(q, limit);
      return NextResponse.json({ artists });
    }
    if (type === 'release') {
      const releases = await searchReleases(q, limit);
      return NextResponse.json({ releases });
    }
    if (type === 'recording') {
      const recordings = await searchRecordings(q, limit);
      return NextResponse.json({ recordings });
    }
    return NextResponse.json({ error: 'Invalid type; use artist, release, or recording' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Request failed' }, { status: 502 });
  }
}
