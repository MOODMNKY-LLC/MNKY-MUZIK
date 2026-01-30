import { NextResponse } from 'next/server';
import { getAlbum } from '@/libs/spotify';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const data = await getAlbum(id);
  if (data === null) {
    return NextResponse.json({ error: 'Spotify not configured or request failed' }, { status: 502 });
  }

  return NextResponse.json(data);
}
