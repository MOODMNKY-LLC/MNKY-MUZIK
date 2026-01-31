import { NextResponse } from 'next/server';
import { getSpotifyTokensForCurrentUser, saveSpotifyTokens } from '@/libs/spotifyTokens';
import { getPlaylist, refreshSpotifyToken } from '@/libs/spotifyWithToken';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing playlist id' }, { status: 400 });
  }

  const tokens = await getSpotifyTokensForCurrentUser();
  if (!tokens) {
    return NextResponse.json(
      { error: 'Sign in with Spotify to view this playlist' },
      { status: 401 }
    );
  }

  let data = await getPlaylist(tokens.accessToken, id);
  if (data === null) {
    const newToken = await refreshSpotifyToken(tokens.refreshToken);
    if (newToken) {
      await saveSpotifyTokens(tokens.userId, newToken, tokens.refreshToken);
      data = await getPlaylist(newToken, id);
    }
  }
  if (data === null) {
    return NextResponse.json(
      { error: 'Failed to fetch Spotify playlist' },
      { status: 401 }
    );
  }

  return NextResponse.json(data);
}
