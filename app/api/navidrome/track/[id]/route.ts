import { NextResponse } from 'next/server';
import { getSong, isNavidromeConfigured } from '@/libs/navidrome';
import type { NavidromeTrack } from '@/types';

function normalizeSong(song: Record<string, unknown>): NavidromeTrack {
  const id = String(song.id ?? '');
  return {
    id,
    source: 'navidrome',
    title: String(song.title ?? ''),
    artist: song.artist != null ? String(song.artist) : undefined,
    album: song.album != null ? String(song.album) : undefined,
    coverArt: song.coverArt != null ? String(song.coverArt) : undefined,
    duration: typeof song.duration === 'number' ? song.duration : undefined,
    contentType: song.contentType != null ? String(song.contentType) : undefined,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isNavidromeConfigured()) {
    return NextResponse.json({ error: 'Navidrome not configured' }, { status: 503 });
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing track id' }, { status: 400 });
  }
  const data = await getSong(id);
  if (!data) {
    return NextResponse.json({ error: 'Track not found' }, { status: 404 });
  }
  const song = data.song as Record<string, unknown> | undefined;
  if (!song) {
    return NextResponse.json({ error: 'Invalid response' }, { status: 502 });
  }
  return NextResponse.json(normalizeSong(song));
}
