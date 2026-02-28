import { NextResponse } from 'next/server';
import { queryOne } from '@/src/lib/db';
import { authRoute } from '@/src/lib/apiRoute';

const VALID_TYPES = ['create_creature', 'import_card', 'heartbeat'];

export const POST = authRoute(async (req, { userId }) => {
  const { type, payload } = await req.json();

  if (!type || typeof type !== 'string' || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 });
  }

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Payload is required and must be an object' }, { status: 400 });
  }

  const row = await queryOne<{ id: string }>(
    'INSERT INTO task_queue (user_id, type, payload) VALUES ($1, $2, $3) RETURNING id',
    [userId, type, JSON.stringify(payload)]
  );

  return NextResponse.json({ taskId: row!.id });
});
