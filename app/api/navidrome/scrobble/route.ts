import { NextResponse } from 'next/server';
import { scrobble, isNavidromeConfigured } from '@/libs/navidrome';

export async function POST(request: Request) {
  if (!isNavidromeConfigured()) {
    return NextResponse.json({ error: 'Navidrome not configured' }, { status: 503 });
  }
  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const id = body.id;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const ok = await scrobble(id);
  return NextResponse.json({ ok });
}
