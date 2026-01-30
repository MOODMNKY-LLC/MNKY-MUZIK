import { NextResponse } from 'next/server';
import { buildStreamUrl, isNavidromeConfigured } from '@/libs/navidrome';

export async function GET(request: Request) {
  if (!isNavidromeConfigured()) {
    return NextResponse.json({ error: 'Navidrome not configured' }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const url = buildStreamUrl(id);
  if (!url) {
    return NextResponse.json({ error: 'Failed to build stream URL' }, { status: 500 });
  }
  return NextResponse.redirect(url, 302);
}
