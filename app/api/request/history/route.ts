import { NextResponse } from 'next/server';
import { getMusicRequestsForCurrentUser } from '@/libs/musicRequests';

export const dynamic = 'force-dynamic';

/**
 * Returns recent music requests for the current user.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10) || 20, 50);
  const requests = await getMusicRequestsForCurrentUser(limit);
  return NextResponse.json({ requests });
}
