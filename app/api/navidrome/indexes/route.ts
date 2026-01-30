import { NextResponse } from 'next/server';
import { getIndexes, isNavidromeConfigured } from '@/libs/navidrome';

export async function GET(request: Request) {
  if (!isNavidromeConfigured()) {
    return NextResponse.json({ error: 'Navidrome not configured' }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const musicFolderId = searchParams.get('musicFolderId') ?? undefined;
  const data = await getIndexes(musicFolderId);
  if (!data) {
    return NextResponse.json({ error: 'Failed to fetch indexes' }, { status: 502 });
  }
  return NextResponse.json(data);
}
