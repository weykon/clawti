import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/src/lib/db';
import { requireAuth } from '@/src/lib/requireAuth';

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);

    const profile = await queryOne<{ energy: number }>(
      'SELECT energy FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    return NextResponse.json({ energy: profile?.energy ?? 1000 });
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Energy GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
