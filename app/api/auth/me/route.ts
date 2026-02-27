import { NextResponse } from 'next/server';
import { queryOne } from '@/src/lib/db';
const db = { queryOne };
import { verifyJwt } from '@/src/lib/authUtils';

export async function GET(req: Request) {
  try {
    const auth = req.headers.get('authorization') || '';
    const token = auth.replace('Bearer ', '').trim();
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyJwt(token);
    const userId = payload.userId as string;

    const user = await db.queryOne<{ id: string; email: string; username: string }>(
      'SELECT id, email, username FROM users WHERE id = $1',
      [userId]
    );

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const profile = await db.queryOne<{ energy: number; is_premium: boolean; plan: string }>(
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
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
