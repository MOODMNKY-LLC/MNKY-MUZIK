import { NextResponse } from 'next/server';
import { search } from '@/libs/spotify';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const type = (searchParams.get('type') as 'artist' | 'album' | 'track') || 'artist';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10) || 20, 50);

  if (!q) {
    return NextResponse.json({ error: 'Missing q' }, { status: 400 });
  }

  const data = await search(q, type, limit);
  if (data === null) {
    return NextResponse.json({ error: 'Spotify not configured or request failed' }, { status: 502 });
  }

  return NextResponse.json(data);
}
