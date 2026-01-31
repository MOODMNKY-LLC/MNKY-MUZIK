import { NextResponse } from 'next/server';
import { getOpenAIClient, isOpenAIConfigured, getDefaultMaxTokens } from '@/libs/openai';
import { getSavedTracks, getTopArtists } from '@/libs/spotifyWithToken';
import { getNavidromeRandomSongs, isNavidromeConfigured } from '@/actions/getNavidromeBrowse';
import { getSongs } from '@/actions/getSongs';
import type { Track, NavidromeTrack, SupabaseTrack } from '@/types';

export const dynamic = 'force-dynamic';

const MAX_PROMPT_LENGTH = 500;
const CATALOG_SAMPLE_SIZE = 120;
const MAX_SUGGESTIONS = 15;
const SPOTIFY_TASTE_LIMIT = 30;

interface CatalogEntry {
  title: string;
  artist: string;
  source: 'navidrome' | 'supabase';
  id: string;
}

function toCatalogEntry(
  title: string,
  artist: string,
  source: 'navidrome' | 'supabase',
  id: string
): CatalogEntry {
  return { title, artist, source, id };
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

async function buildCatalogSample(): Promise<CatalogEntry[]> {
  const entries: CatalogEntry[] = [];
  if (isNavidromeConfigured()) {
    const songs = await getNavidromeRandomSongs(CATALOG_SAMPLE_SIZE);
    songs.forEach((s) => {
      entries.push(toCatalogEntry(s.title, s.artist ?? '', 'navidrome', s.id));
    });
  }
  const supabaseSongs = await getSongs();
  supabaseSongs.slice(0, 50).forEach((s) => {
    entries.push(toCatalogEntry(s.title, s.author, 'supabase', String(s.id)));
  });
  return entries;
}

/** Optional: build a short "taste" string from Spotify saved/top for AI context. Only catalog tracks are returned. */
async function getSpotifyTasteContext(providerToken: string): Promise<string> {
  const parts: string[] = [];
  try {
    const [saved, top] = await Promise.all([
      getSavedTracks(providerToken, 20, 0),
      getTopArtists(providerToken, 5),
    ]);
    if (saved?.items?.length) {
      const names = saved.items
        .slice(0, 15)
        .map((i) => i.track?.name && i.track?.artists?.[0]?.name ? `${i.track.name} by ${i.track.artists[0].name}` : null)
        .filter(Boolean) as string[];
      if (names.length) parts.push(`Saved: ${names.slice(0, 10).join('; ')}`);
    }
    if (top?.items?.length) {
      const artists = top.items.map((a) => a.name).filter(Boolean);
      if (artists.length) parts.push(`Top artists: ${artists.join(', ')}`);
    }
  } catch {
    // ignore
  }
  return parts.length ? parts.join('. ') : '';
}

function findInCatalog(
  catalog: CatalogEntry[],
  title: string,
  artist: string
): CatalogEntry | null {
  const titleNorm = normalize(title);
  const artistNorm = normalize(artist);
  for (const e of catalog) {
    if (normalize(e.title) === titleNorm && normalize(e.artist) === artistNorm) return e;
    if (
      (normalize(e.title).includes(titleNorm) || titleNorm.includes(normalize(e.title))) &&
      (!artistNorm || normalize(e.artist).includes(artistNorm) || artistNorm.includes(normalize(e.artist)))
    ) {
      return e;
    }
  }
  return null;
}

function entryToTrack(
  entry: CatalogEntry,
  supabaseSongs: Awaited<ReturnType<typeof getSongs>>
): Track | null {
  if (entry.source === 'navidrome') {
    return {
      id: entry.id,
      source: 'navidrome',
      title: entry.title,
      artist: entry.artist,
    } as NavidromeTrack;
  }
  const song = supabaseSongs.find((s) => String(s.id) === entry.id);
  if (song) {
    return { ...song, source: 'supabase' } as SupabaseTrack;
  }
  return null;
}

export async function POST(request: Request) {
  if (!isOpenAIConfigured()) {
    return NextResponse.json({ error: 'OpenAI not configured' }, { status: 503 });
  }

  let body: { prompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) {
    return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json({ error: 'Prompt too long' }, { status: 400 });
  }

  const catalog = await buildCatalogSample();
  if (catalog.length === 0) {
    return NextResponse.json({
      error: 'No catalog available. Add songs to your library or connect Navidrome.',
      tracks: [],
    }, { status: 200 });
  }

  const catalogText = catalog
    .slice(0, 100)
    .map((e) => `${e.title} | ${e.artist}`)
    .join('\n');

  let spotifyTaste = '';
  try {
    const { getSpotifyTokensForCurrentUser } = await import('@/libs/spotifyTokens');
    const tokens = await getSpotifyTokensForCurrentUser();
    if (tokens) {
      spotifyTaste = await getSpotifyTasteContext(tokens.accessToken);
    }
  } catch {
    // ignore
  }

  const openai = await getOpenAIClient();
  if (!openai) {
    return NextResponse.json({ error: 'OpenAI not configured' }, { status: 503 });
  }

  const systemContent = `You are a music playlist assistant. The user will describe the kind of playlist they want. You will be given a list of available tracks in the format "title | artist" (one per line). Choose ONLY from that list. Respond with ONLY a JSON array of objects, each with exactly "title" and "artist" keys, choosing up to ${MAX_SUGGESTIONS} tracks that best match the user's request. Do not include any other text, markdown, or explanation. Example: [{"title":"Song A","artist":"Artist A"},{"title":"Song B","artist":"Artist B"}]`;

  const userContent = spotifyTaste
    ? `User wants: ${prompt}\n\nUser's Spotify taste (for context; suggest from available list): ${spotifyTaste.slice(0, SPOTIFY_TASTE_LIMIT * 10)}\n\nAvailable tracks:\n${catalogText}`
    : `User wants: ${prompt}\n\nAvailable tracks:\n${catalogText}`;

  let rawResponse: string;
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: userContent },
      ],
      max_tokens: getDefaultMaxTokens(),
      temperature: 0.7,
    });
    rawResponse = completion.choices[0]?.message?.content?.trim() ?? '';
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OpenAI request failed';
    return NextResponse.json({ error: message, tracks: [] }, { status: 502 });
  }

  let suggested: { title: string; artist: string }[];
  try {
    const cleaned = rawResponse.replace(/^```\w*\n?|\n?```$/g, '').trim();
    suggested = JSON.parse(cleaned) as { title: string; artist: string }[];
    if (!Array.isArray(suggested)) suggested = [];
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response', tracks: [] }, { status: 502 });
  }

  const supabaseSongs = await getSongs();
  const tracks: Track[] = [];
  const seen = new Set<string>();

  for (const item of suggested.slice(0, MAX_SUGGESTIONS)) {
    const title = String(item?.title ?? '').trim();
    const artist = String(item?.artist ?? '').trim();
    if (!title) continue;
    const entry = findInCatalog(catalog, title, artist);
    if (!entry || seen.has(entry.id + entry.source)) continue;
    seen.add(entry.id + entry.source);
    const track = entryToTrack(entry, supabaseSongs);
    if (track) tracks.push(track);
  }

  return NextResponse.json({ tracks });
}
