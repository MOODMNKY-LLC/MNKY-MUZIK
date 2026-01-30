import { NextResponse } from 'next/server';
import { getPlaylists, isNavidromeConfigured } from '@/libs/navidrome';

export async function GET() {
  if (!isNavidromeConfigured()) {
    return NextResponse.json({ error: 'Navidrome not configured' }, { status: 503 });
  }
  const data = await getPlaylists();
  if (!data) {
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 502 });
  }
  return NextResponse.json(data);
}
