import { NextResponse } from 'next/server';
import { getAlbum, isNavidromeConfigured } from '@/libs/navidrome';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isNavidromeConfigured()) {
    return NextResponse.json({ error: 'Navidrome not configured' }, { status: 503 });
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing album id' }, { status: 400 });
  }
  const data = await getAlbum(id);
  if (!data) {
    return NextResponse.json({ error: 'Album not found' }, { status: 404 });
  }
  return NextResponse.json(data);
}
