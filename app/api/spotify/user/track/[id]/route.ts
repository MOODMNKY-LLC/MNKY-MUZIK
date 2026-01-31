import { NextResponse } from 'next/server';
import { getSpotifyTokensForCurrentUser, saveSpotifyTokens } from '@/libs/spotifyTokens';
import { getTrack, refreshSpotifyToken } from '@/libs/spotifyWithToken';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing track id' }, { status: 400 });
  }

  const tokens = await getSpotifyTokensForCurrentUser();
  if (!tokens) {
    return NextResponse.json(
      { error: 'Sign in with Spotify to view this track' },
      { status: 401 }
    );
  }

  let data = await getTrack(tokens.accessToken, id);
  if (data === null) {
    const newToken = await refreshSpotifyToken(tokens.refreshToken);
    if (newToken) {
      await saveSpotifyTokens(tokens.userId, newToken, tokens.refreshToken);
      data = await getTrack(newToken, id);
    }
  }
  if (data === null) {
    return NextResponse.json(
      { error: 'Failed to fetch track' },
      { status: 401 }
    );
  }

  const track = {
    id: data.id,
    source: 'spotify' as const,
    title: data.name,
    artist: data.artists?.[0]?.name,
    album: data.album?.name,
    coverArt: data.album?.images?.[0]?.url,
    duration: data.duration_ms ? Math.floor(data.duration_ms / 1000) : undefined,
    uri: data.uri,
  };

  return NextResponse.json(track);
}
