import { NextResponse } from 'next/server';
import { isSpotifyLinkedForCurrentUser } from '@/libs/spotifyTokens';

export const dynamic = 'force-dynamic';

/**
 * Returns whether the current user has Spotify linked (tokens in DB or session).
 * Used by client when session.provider_token is null (e.g. after Supabase session refresh).
 */
export async function GET() {
  const linked = await isSpotifyLinkedForCurrentUser();
  return NextResponse.json({ linked });
}
