import { NextResponse } from 'next/server';
import { queryOne } from '@/src/lib/db';
import { authRoute } from '@/src/lib/apiRoute';

export const GET = authRoute(async (_req, { userId }) => {
  const profile = await queryOne<{ energy: number }>(
    'SELECT energy FROM user_profiles WHERE user_id = $1',
    [userId]
  );

  return NextResponse.json({ energy: profile?.energy ?? 1000 });
});
