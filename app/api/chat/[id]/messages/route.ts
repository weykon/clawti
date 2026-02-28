import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';
import { authRoute } from '@/src/lib/apiRoute';

export const GET = authRoute(async (req, { userId, params }) => {
  const url = new URL(req.url);
  const parsedLimit = parseInt(url.searchParams.get('limit') || '50', 10);
  const limit = Math.min(Number.isNaN(parsedLimit) ? 50 : parsedLimit, 200);

  const rows = await query(
    `SELECT id, role, content, created_at
     FROM chat_messages
     WHERE user_id = $1 AND creature_id = $2
     ORDER BY created_at ASC
     LIMIT $3`,
    [userId, params.id, limit]
  );

  const messages = rows.map(r => ({
    id: r.id,
    role: r.role,
    content: r.content,
    createdAt: r.created_at?.toISOString?.() || r.created_at,
  }));

  return NextResponse.json({ messages });
});
