import { NextResponse } from 'next/server';
import { query, queryOne } from '@/src/lib/db';
const db = { query, queryOne };
import { hashPassword, signJwt } from '@/src/lib/authUtils';

const USERNAME_RE = /^[a-zA-Z0-9_-]+$/;

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const name = (username || email.split('@')[0]).trim().slice(0, 50);
    if (!name || !USERNAME_RE.test(name)) {
      return NextResponse.json({ error: 'Username may only contain letters, numbers, underscores, and hyphens' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    // ON CONFLICT prevents TOCTOU race when two registrations hit the same email concurrently
    const row = await db.queryOne<{ id: string; email: string; username: string }>(
      `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, username`,
      [name, email.toLowerCase().trim(), passwordHash]
    );

    if (!row) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Create user_profile entry
    await db.query(
      'INSERT INTO user_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING',
      [row.id]
    );

    const token = signJwt({ userId: row.id, email: row.email });

    return NextResponse.json({
      token,
      user: { id: row.id, email: row.email, username: row.username },
    });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
