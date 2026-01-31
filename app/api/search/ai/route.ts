import { NextResponse } from 'next/server';
import { getOpenAIClient, isOpenAIConfigured, getDefaultMaxTokens } from '@/libs/openai';
import { getSongsByTitle } from '@/actions/getSongsByTitle';
import { getNavidromeSearch, isNavidromeConfigured } from '@/actions/getNavidromeBrowse';
import type { Song } from '@/types';
import type { NavidromeSearchResult } from '@/actions/getNavidromeBrowse';

export const dynamic = 'force-dynamic';

const MAX_QUERY_LENGTH = 200;

export async function GET(request: Request) {
  if (!isOpenAIConfigured()) {
    return NextResponse.json(
      { error: 'OpenAI not configured', songs: [], navidrome: null, query: '' },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';
  if (!q || q.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: q ? 'Query too long' : 'Missing query', songs: [], navidrome: null, query: '' },
      { status: 400 }
    );
  }

  const openai = await getOpenAIClient();
  if (!openai) {
    return NextResponse.json(
      { error: 'OpenAI not configured', songs: [], navidrome: null, query: '' },
      { status: 503 }
    );
  }

  const systemContent = `You are a music search assistant. The user will describe the kind of music they want. Reply with ONLY a JSON array of 1-3 short search terms (single words or short phrases) to use in a music library search. Example: ["chill", "ambient"] or ["upbeat", "80s"]. No other text.`;

  let rawResponse: string;
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: `User wants: ${q}` },
      ],
      max_tokens: getDefaultMaxTokens(),
      temperature: 0.3,
    });
    rawResponse = completion.choices[0]?.message?.content?.trim() ?? '';
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OpenAI request failed';
    return NextResponse.json(
      { error: message, songs: [], navidrome: null, query: q },
      { status: 502 }
    );
  }

  let terms: string[];
  try {
    const cleaned = rawResponse.replace(/^```\w*\n?|\n?```$/g, '').trim();
    terms = JSON.parse(cleaned) as string[];
    if (!Array.isArray(terms) || terms.length === 0) {
      terms = [q];
    } else {
      terms = terms.slice(0, 3).filter((t) => typeof t === 'string' && t.trim().length > 0);
      if (terms.length === 0) terms = [q];
    }
  } catch {
    terms = [q];
  }

  const searchTerm = terms[0] ?? q;

  const [songs, navidrome] = await Promise.all([
    getSongsByTitle(searchTerm),
    isNavidromeConfigured() ? getNavidromeSearch(searchTerm) : Promise.resolve(null),
  ]);

  return NextResponse.json({
    songs: songs as Song[],
    navidrome,
    query: searchTerm,
  });
}
