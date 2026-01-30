import { NextResponse } from 'next/server';
import { getMusicDirectory, isNavidromeConfigured } from '@/libs/navidrome';

/**
 * Artist "detail" in Subsonic is getMusicDirectory(artistId) – returns albums/songs under that artist.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isNavidromeConfigured()) {
    return NextResponse.json({ error: 'Navidrome not configured' }, { status: 503 });
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing artist id' }, { status: 400 });
  }
  const data = await getMusicDirectory(id);
  if (!data) {
    return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
  }
  return NextResponse.json(data);
}
