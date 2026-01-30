import { NextResponse } from 'next/server';
import { getPlaylist, isNavidromeConfigured } from '@/libs/navidrome';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isNavidromeConfigured()) {
    return NextResponse.json({ error: 'Navidrome not configured' }, { status: 503 });
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing playlist id' }, { status: 400 });
  }
  const data = await getPlaylist(id);
  if (!data) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
  }
  return NextResponse.json(data);
}
