import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/src/lib/db';
import { authRoute } from '@/src/lib/apiRoute';

const USERNAME_RE = /^[a-zA-Z0-9_-]+$/;

async function buildProfileResponse(userId: string) {
  const user = await queryOne<{ id: string; email: string; username: string }>(
    'SELECT id, email, username FROM users WHERE id = $1',
    [userId]
  );
  if (!user) return null;

  const [profile, friendsCount, creationsCount] = await Promise.all([
    queryOne<{ energy: number; is_premium: boolean; plan: string }>(
      'SELECT energy, is_premium, plan FROM user_profiles WHERE user_id = $1',
      [userId]
    ),
    queryOne<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM user_friends WHERE user_id = $1',
      [userId]
    ),
    queryOne<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM creatures WHERE creator_id = $1',
      [userId]
    ),
  ]);

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    energy: profile?.energy ?? 1000,
    membershipTier: profile?.plan ?? 'free',
    friendsCount: parseInt(friendsCount?.count || '0', 10),
    creationsCount: parseInt(creationsCount?.count || '0', 10),
  };
}

export const GET = authRoute(async (_req, { userId }) => {
  const data = await buildProfileResponse(userId);
  if (!data) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json(data);
});

export const PUT = authRoute(async (req, { userId }) => {
  const body = await req.json();
  const { username } = body;

  if (username !== undefined) {
    const name = String(username).trim();
    if (name.length < 1 || name.length > 50) {
      return NextResponse.json({ error: 'Username must be 1-50 characters' }, { status: 400 });
    }
    if (!USERNAME_RE.test(name)) {
      return NextResponse.json({ error: 'Username may only contain letters, numbers, underscores, and hyphens' }, { status: 400 });
    }
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id != $2',
      [name, userId]
    );
    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }
    await query('UPDATE users SET username = $1 WHERE id = $2', [name, userId]);
  }

  const data = await buildProfileResponse(userId);
  if (!data) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json(data);
});
