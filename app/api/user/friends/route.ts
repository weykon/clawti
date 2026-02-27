import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';
import { requireAuth } from '@/src/lib/requireAuth';

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);

    const rows = await query(
      `SELECT c.* FROM user_friends uf
       JOIN creatures c ON c.id = uf.creature_id
       WHERE uf.user_id = $1
       ORDER BY uf.created_at DESC`,
      [userId]
    );

    const friends = rows.map(r => ({
      creature: {
        id: r.id,
        agentId: r.id,
        name: r.name,
        bio: r.bio,
        personality: r.personality,
        greeting: r.greeting,
        firstMes: r.first_mes,
        gender: r.gender,
        age: r.age,
        occupation: r.occupation,
        worldDescription: r.world_description,
        photos: r.photos || [],
        rating: parseFloat(r.rating) || 0,
        creatorId: r.creator_id,
      },
    }));

    return NextResponse.json({ friends });
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Friends GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
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
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Friends POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
