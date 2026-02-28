import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/src/lib/db';
import { requireAuth } from '@/src/lib/requireAuth';

export async function POST(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const body = await req.json();
    const { name, card, metadata, mode } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Atomic energy deduction — prevents race conditions from concurrent creation requests
    const deducted = await queryOne<{ energy: number }>(
      'UPDATE user_profiles SET energy = energy - 100 WHERE user_id = $1 AND energy >= 100 RETURNING energy',
      [userId]
    );
    if (!deducted) {
      return NextResponse.json({ error: 'Not enough energy (need 100)' }, { status: 400 });
    }

    const row = await queryOne<{ id: string }>(
      `INSERT INTO creatures (creator_id, name, bio, personality, greeting, first_mes, gender, age, occupation, world_description, photos)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        userId,
        name,
        metadata?.bio || '',
        card?.personality || '',
        card?.firstMes || '',
        card?.firstMes || '',
        metadata?.gender || '',
        metadata?.age || null,
        metadata?.occupation || '',
        metadata?.worldDescription || card?.description || '',
        metadata?.photos || [],
      ]
    );

    return NextResponse.json({
      id: row!.id,
      agentId: row!.id,
      energyRemaining: deducted.energy,
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Create creature error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
