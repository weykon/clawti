import { NextResponse } from 'next/server';
import { query, queryOne } from '@/src/lib/db';
const db = { query, queryOne };
import { hashPassword, signJwt } from '@/src/lib/authUtils';

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const existing = await db.queryOne('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const name = username || email.split('@')[0];

    const row = await db.queryOne<{ id: string; email: string; username: string }>(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email, username',
      [name, email.toLowerCase().trim(), passwordHash]
    );

    if (!row) throw new Error('Insert failed');

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
