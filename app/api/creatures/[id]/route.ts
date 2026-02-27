import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/src/lib/db';
import { requireAuth } from '@/src/lib/requireAuth';

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

    return NextResponse.json({
      id: row.id,
      agentId: row.id,
      name: row.name,
      bio: row.bio,
      personality: row.personality,
      greeting: row.greeting,
      firstMes: row.first_mes,
      gender: row.gender,
      age: row.age,
      occupation: row.occupation,
      worldDescription: row.world_description,
      photos: row.photos || [],
      rating: parseFloat(row.rating) || 0,
      creatorId: row.creator_id,
    });
  } catch (err) {
    console.error('Get creature error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = requireAuth(req);
    const { id } = await params;

    const row = await queryOne<{ creator_id: string }>(
      'SELECT creator_id FROM creatures WHERE id = $1',
      [id]
    );
    if (!row) {
      return NextResponse.json({ error: 'Creature not found' }, { status: 404 });
    }
    if (row.creator_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await query('DELETE FROM creatures WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Delete creature error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
