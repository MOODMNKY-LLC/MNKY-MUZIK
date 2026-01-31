import { NextResponse } from 'next/server';
import { getSpotifyTokensForCurrentUser } from '@/libs/spotifyTokens';

export const dynamic = 'force-dynamic';

/**
 * Returns Spotify access token for Web Playback SDK use.
 * Used by the client to initialize the SDK (getOAuthToken callback).
 */
export async function GET() {
  const tokens = await getSpotifyTokensForCurrentUser();
  if (!tokens) {
    return NextResponse.json({ error: 'Not linked to Spotify' }, { status: 401 });
  }
  return NextResponse.json({ token: tokens.accessToken });
}
