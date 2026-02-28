import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';
import { authRoute } from '@/src/lib/apiRoute';
import { mapCreatureRow } from '@/src/lib/mapCreatureRow';

export const GET = authRoute(async (_req, { userId }) => {
  const rows = await query(
    `SELECT c.* FROM user_friends uf
     JOIN creatures c ON c.id = uf.creature_id
     WHERE uf.user_id = $1
     ORDER BY uf.created_at DESC`,
    [userId]
  );

  const friends = rows.map(r => ({ creature: mapCreatureRow(r) }));
  return NextResponse.json({ friends });
});

export const POST = authRoute(async (req, { userId }) => {
  const body = await req.json();
  const creatureId = body.creature_id;

  if (!creatureId) {
    return NextResponse.json({ error: 'creature_id is required' }, { status: 400 });
  }

  await query(
    `INSERT INTO user_friends (user_id, creature_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, creature_id) DO NOTHING`,
    [userId, creatureId]
  );

  return NextResponse.json({ success: true });
});
