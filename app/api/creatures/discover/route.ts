import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';
import { mapCreatureRow } from '@/src/lib/mapCreatureRow';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const gender = url.searchParams.get('gender');
    const occupation = url.searchParams.get('occupation');
    const parsedLimit = parseInt(url.searchParams.get('limit') || '50', 10);
    const limit = Math.max(1, Math.min(Number.isNaN(parsedLimit) ? 50 : parsedLimit, 100));

    const conditions = ['c.is_public = true'];
    const params: any[] = [];

    if (gender) {
      params.push(gender);
      conditions.push(`c.gender = $${params.length}`);
    }
    if (occupation) {
      params.push(occupation);
      conditions.push(`c.occupation = $${params.length}`);
    }

    params.push(limit);
    const sql = `SELECT c.*,
      (SELECT COUNT(DISTINCT cm.user_id) FROM chat_messages cm WHERE cm.creature_id = c.id) as chat_count
      FROM creatures c WHERE ${conditions.join(' AND ')} ORDER BY c.created_at DESC LIMIT $${params.length}`;

    const rows = await query(sql, params);

    return NextResponse.json({ creatures: rows.map(mapCreatureRow) });
  } catch (err) {
    console.error('Discover error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
