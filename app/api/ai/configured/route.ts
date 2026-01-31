import { NextResponse } from 'next/server';
import { isOpenAIConfigured } from '@/libs/openai';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ configured: isOpenAIConfigured() });
}
