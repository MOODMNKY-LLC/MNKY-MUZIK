import { NextResponse } from 'next/server';
import { artistLookup, isLidarrConfigured } from '@/libs/lidarr';

export async function GET(request: Request) {
  if (!isLidarrConfigured()) {
    return NextResponse.json({ error: 'Lidarr not configured' }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const term = searchParams.get('term') ?? searchParams.get('q') ?? '';
  const data = await artistLookup(term);
  return NextResponse.json(data);
}
