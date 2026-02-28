import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/src/lib/db';
import { authRoute } from '@/src/lib/apiRoute';

export const GET = authRoute(async (_req, { userId }) => {
  const user = await queryOne<{ id: string; email: string; username: string }>(
    'SELECT id, email, username FROM users WHERE id = $1',
    [userId]
  );

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const profile = await queryOne<{ energy: number; is_premium: boolean; plan: string }>(
    'SELECT energy, is_premium, plan FROM user_profiles WHERE user_id = $1',
    [userId]
  );

  return NextResponse.json({
    id: user.id,
    email: user.email,
    username: user.username,
    energy: profile?.energy ?? 1000,
    is_premium: profile?.is_premium ?? false,
    plan: profile?.plan ?? 'free',
  });
});
