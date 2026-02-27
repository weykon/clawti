import { NextResponse } from 'next/server';
import { queryOne } from '@/src/lib/db';
const db = { queryOne };
import { verifyPassword, signJwt } from '@/src/lib/authUtils';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const row = await db.queryOne<{ id: string; email: string; username: string; password_hash: string }>(
      'SELECT id, email, username, password_hash FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (!row) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await verifyPassword(password, row.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = signJwt({ userId: row.id, email: row.email });

    return NextResponse.json({
      token,
      user: { id: row.id, email: row.email, username: row.username },
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
