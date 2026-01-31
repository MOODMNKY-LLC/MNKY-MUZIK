import { NextResponse } from 'next/server';
import {
  getRecommendations,
  getTopArtists,
  getRecentlyPlayed,
  refreshSpotifyToken,
} from '@/libs/spotifyWithToken';
import { getSpotifyTokensForCurrentUser, saveSpotifyTokens } from '@/libs/spotifyTokens';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const tokens = await getSpotifyTokensForCurrentUser();
  if (!tokens) {
    return NextResponse.json(
      { error: 'Sign in with Spotify for recommendations' },
      { status: 401 }
    );
  }

  const tryWithToken = async (token: string) => {
    let seedArtists = '';
    let seedTracks = '';
    const top = await getTopArtists(token, 2);
    if (top?.items?.length) {
      seedArtists = top.items.slice(0, 2).map((a) => a.id).join(',');
    }
    const recent = await getRecentlyPlayed(token, 5);
    if (recent?.items?.length) {
      seedTracks = recent.items
        .slice(0, 3)
        .map((i) => i.track?.id)
        .filter(Boolean)
        .join(',');
    }
    const params: { seed_artists?: string; seed_tracks?: string; seed_genres?: string; limit: number } = {
      limit: Math.min(parseInt(new URL(request.url).searchParams.get('limit') ?? '20', 10) || 20, 50),
    };
    if (seedArtists) params.seed_artists = seedArtists;
    if (seedTracks) params.seed_tracks = seedTracks;
    if (!seedArtists && !seedTracks) params.seed_genres = 'pop,rock';
    return getRecommendations(token, params);
  };

  let data = await tryWithToken(tokens.accessToken);
  if (data === null) {
    const newToken = await refreshSpotifyToken(tokens.refreshToken);
    if (newToken) {
      await saveSpotifyTokens(tokens.userId, newToken, tokens.refreshToken);
      data = await tryWithToken(newToken);
    }
  }
  if (data === null) {
    return NextResponse.json(
      { error: 'Failed to fetch Spotify recommendations' },
      { status: 401 }
    );
  }

  return NextResponse.json(data);
}
