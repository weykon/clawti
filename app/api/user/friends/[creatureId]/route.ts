import { NextResponse } from 'next/server';
import { query } from '@/src/lib/db';
import { authRoute } from '@/src/lib/apiRoute';

export const DELETE = authRoute(async (_req, { userId, params }) => {
  await query(
    'DELETE FROM user_friends WHERE user_id = $1 AND creature_id = $2',
    [userId, params.creatureId]
  );

  return NextResponse.json({ success: true });
});
