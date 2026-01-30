import { NextResponse } from 'next/server';
import { search2, isNavidromeConfigured } from '@/libs/navidrome';

export async function GET(request: Request) {
  if (!isNavidromeConfigured()) {
    return NextResponse.json({ error: 'Navidrome not configured' }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') ?? searchParams.get('q') ?? '';
  const musicFolderId = searchParams.get('musicFolderId') ?? undefined;
  const data = await search2(query, musicFolderId);
  if (!data) {
    return NextResponse.json({ error: 'Search failed' }, { status: 502 });
  }
  return NextResponse.json(data);
}
