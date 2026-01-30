import { NextResponse } from 'next/server';
import { albumLookup, isLidarrConfigured } from '@/libs/lidarr';

export async function GET(request: Request) {
  if (!isLidarrConfigured()) {
    return NextResponse.json({ error: 'Lidarr not configured' }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const term = searchParams.get('term') ?? searchParams.get('q') ?? '';
  const data = await albumLookup(term);
  return NextResponse.json(data);
}
