import { NextResponse } from 'next/server';
import { getArtist } from '@/libs/musicbrainz';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mbid: string }> }
) {
  const { mbid } = await params;
  if (!mbid) {
    return NextResponse.json({ error: 'Missing mbid' }, { status: 400 });
  }

  const data = await getArtist(mbid);
  if (data === null) {
    return NextResponse.json({ error: 'Artist not found or request failed' }, { status: 502 });
  }

  return NextResponse.json(data);
}
