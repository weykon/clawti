import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/src/lib/db';
import { authRoute } from '@/src/lib/apiRoute';
import { mapCreatureRow } from '@/src/lib/mapCreatureRow';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const row = await queryOne('SELECT * FROM creatures WHERE id = $1', [id]);
    if (!row) {
      return NextResponse.json({ error: 'Creature not found' }, { status: 404 });
    }

    return NextResponse.json(mapCreatureRow(row));
  } catch (err) {
    console.error('Get creature error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const DELETE = authRoute(async (_req, { userId, params }) => {
  const row = await queryOne<{ creator_id: string }>(
    'SELECT creator_id FROM creatures WHERE id = $1',
    [params.id]
  );
  if (!row) {
    return NextResponse.json({ error: 'Creature not found' }, { status: 404 });
  }
  if (row.creator_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await query('DELETE FROM creatures WHERE id = $1', [params.id]);
  return NextResponse.json({ success: true });
});
