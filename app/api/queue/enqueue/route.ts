import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/src/lib/db';

export async function POST(req: NextRequest) {
  // TODO: Add auth check once NextAuth is wired up
  // const session = await auth();
  // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { type, payload } = await req.json();

    const validTypes = ['create_creature', 'import_card', 'heartbeat'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 });
    }

    if (!payload) {
      return NextResponse.json({ error: 'Payload is required' }, { status: 400 });
    }

    const userId = 'anonymous'; // TODO: session.user.id
    const result = await pool.query(
      'INSERT INTO task_queue (user_id, type, payload) VALUES ($1, $2, $3) RETURNING id',
      [userId, type, JSON.stringify(payload)]
    );

    return NextResponse.json({ taskId: result.rows[0].id });
  } catch (err) {
    console.error('Enqueue error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
