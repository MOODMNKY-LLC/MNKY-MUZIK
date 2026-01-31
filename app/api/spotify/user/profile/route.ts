import { NextResponse } from 'next/server';
import { getSpotifyTokensForCurrentUser, saveSpotifyTokens } from '@/libs/spotifyTokens';
import { getCurrentUserProfile, refreshSpotifyToken } from '@/libs/spotifyWithToken';

export const dynamic = 'force-dynamic';

export async function GET() {
  const tokens = await getSpotifyTokensForCurrentUser();
  if (!tokens) {
    return NextResponse.json(
      { error: 'Sign in with Spotify to view your profile' },
      { status: 401 }
    );
  }

  let profile = await getCurrentUserProfile(tokens.accessToken);
  if (profile === null) {
    const newToken = await refreshSpotifyToken(tokens.refreshToken);
    if (newToken) {
      await saveSpotifyTokens(tokens.userId, newToken, tokens.refreshToken);
      profile = await getCurrentUserProfile(newToken);
    }
  }
  if (profile === null) {
    return NextResponse.json(
      { error: 'Failed to fetch Spotify profile' },
      { status: 401 }
    );
  }

  return NextResponse.json(profile);
}
