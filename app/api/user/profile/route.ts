import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/src/lib/db';
import { requireAuth } from '@/src/lib/requireAuth';

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);

    const user = await queryOne<{ id: string; email: string; username: string }>(
      'SELECT id, email, username FROM users WHERE id = $1',
      [userId]
    );
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const profile = await queryOne<{ energy: number; is_premium: boolean; plan: string }>(
      'SELECT energy, is_premium, plan FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    const friendsCount = await queryOne<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM user_friends WHERE user_id = $1',
      [userId]
    );

    const creationsCount = await queryOne<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM creatures WHERE creator_id = $1',
      [userId]
    );

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      energy: profile?.energy ?? 1000,
      membershipTier: profile?.plan ?? 'free',
      friendsCount: parseInt(friendsCount?.count || '0', 10),
      creationsCount: parseInt(creationsCount?.count || '0', 10),
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Profile GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const body = await req.json();
    const { username } = body;

    if (username) {
      await query('UPDATE users SET username = $1 WHERE id = $2', [username, userId]);
    }

    const user = await queryOne<{ id: string; email: string; username: string }>(
      'SELECT id, email, username FROM users WHERE id = $1',
      [userId]
    );
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const profile = await queryOne<{ energy: number; is_premium: boolean; plan: string }>(
      'SELECT energy, is_premium, plan FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    const friendsCount = await queryOne<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM user_friends WHERE user_id = $1',
      [userId]
    );

    const creationsCount = await queryOne<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM creatures WHERE creator_id = $1',
      [userId]
    );

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      energy: profile?.energy ?? 1000,
      membershipTier: profile?.plan ?? 'free',
      friendsCount: parseInt(friendsCount?.count || '0', 10),
      creationsCount: parseInt(creationsCount?.count || '0', 10),
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Profile PUT error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
