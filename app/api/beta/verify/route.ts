import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/libs/supabaseAdmin';

export const dynamic = 'force-dynamic';

const BETA_DAYS = 90;

function constantTimeCompare(a: string): boolean {
  const pin = process.env.BETA_ACCESS_PIN?.trim() ?? '';
  if (pin.length === 0) return false;
  if (a.length !== pin.length) return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(pin, 'utf8');
  if (bufA.length !== bufB.length) return false;
  try {
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const pin = typeof body.pin === 'string' ? body.pin.trim() : '';

    if (!pin) {
      return NextResponse.json({ error: 'PIN required' }, { status: 400 });
    }

    if (!constantTimeCompare(pin)) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    const betaUntil = new Date();
    betaUntil.setDate(betaUntil.getDate() + BETA_DAYS);

    const { error } = await supabaseAdmin
      .from('users')
      .update({
        role: 'beta',
        beta_until: betaUntil.toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update access' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
