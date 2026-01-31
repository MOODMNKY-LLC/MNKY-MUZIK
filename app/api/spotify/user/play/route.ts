import { NextResponse } from 'next/server';
import { getSpotifyTokensForCurrentUser, saveSpotifyTokens } from '@/libs/spotifyTokens';
import { refreshSpotifyToken } from '@/libs/spotifyWithToken';

export const dynamic = 'force-dynamic';

/**
 * Start/resume playback on the user's Spotify device (e.g. Web Playback SDK).
 * POST body: { uris: string[], device_id?: string }
 */
export async function POST(request: Request) {
  const tokens = await getSpotifyTokensForCurrentUser();
  if (!tokens) {
    return NextResponse.json({ error: 'Not linked to Spotify' }, { status: 401 });
  }

  let body: { uris?: string[]; device_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const uris = Array.isArray(body.uris) ? body.uris.filter((u) => typeof u === 'string' && u.startsWith('spotify:')) : [];
  if (uris.length === 0) {
    return NextResponse.json({ error: 'Missing or invalid uris' }, { status: 400 });
  }

  let token = tokens.accessToken;
  const res = await fetch('https://api.spotify.com/v1/me/player/play' + (body.device_id ? `?device_id=${encodeURIComponent(body.device_id)}` : ''), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ uris }),
    cache: 'no-store',
  });

  if (res.status === 401) {
    const newToken = await refreshSpotifyToken(tokens.refreshToken);
    if (newToken) {
      await saveSpotifyTokens(tokens.userId, newToken, tokens.refreshToken);
      const retry = await fetch('https://api.spotify.com/v1/me/player/play' + (body.device_id ? `?device_id=${encodeURIComponent(body.device_id)}` : ''), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${newToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris }),
        cache: 'no-store',
      });
      if (!retry.ok) {
        const err = await retry.text();
        return NextResponse.json({ error: err || 'Playback failed' }, { status: retry.status });
      }
      return NextResponse.json({ ok: true });
    }
  }

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err || 'Playback failed' }, { status: res.status });
  }
  return NextResponse.json({ ok: true });
}
