import { NextResponse } from 'next/server';
import { buildCoverArtUrl, isNavidromeConfigured } from '@/libs/navidrome';

export async function GET(request: Request) {
  if (!isNavidromeConfigured()) {
    return NextResponse.json({ error: 'Navidrome not configured' }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const sizeParam = searchParams.get('size');
  const size = sizeParam ? parseInt(sizeParam, 10) : undefined;
  const url = buildCoverArtUrl(id, size && Number.isFinite(size) ? size : undefined);
  if (!url) {
    return NextResponse.json({ error: 'Failed to build cover URL' }, { status: 500 });
  }
  return NextResponse.redirect(url, 302);
}
