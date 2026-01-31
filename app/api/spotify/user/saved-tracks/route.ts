import { NextResponse } from 'next/server';
import { getSpotifyTokensForCurrentUser, saveSpotifyTokens } from '@/libs/spotifyTokens';
import { getSavedTracks, refreshSpotifyToken } from '@/libs/spotifyWithToken';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const tokens = await getSpotifyTokensForCurrentUser();
  if (!tokens) {
    return NextResponse.json(
      { error: 'Sign in with Spotify to view your saved tracks' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10) || 20, 50);
  const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10));

  let data = await getSavedTracks(tokens.accessToken, limit, offset);
  if (data === null) {
    const newToken = await refreshSpotifyToken(tokens.refreshToken);
    if (newToken) {
      await saveSpotifyTokens(tokens.userId, newToken, tokens.refreshToken);
      data = await getSavedTracks(newToken, limit, offset);
    }
  }
  if (data === null) {
    return NextResponse.json(
      { error: 'Failed to fetch Spotify saved tracks' },
      { status: 401 }
    );
  }

  return NextResponse.json(data);
}
