import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/src/lib/db';
import { authRoute } from '@/src/lib/apiRoute';

/** Truncate a string field to max length, defaulting to empty string */
function str(val: unknown, maxLen: number): string {
  return typeof val === 'string' ? val.slice(0, maxLen) : '';
}

export const POST = authRoute(async (req, { userId }) => {
  const body = await req.json();
  const { name, card, metadata, mode } = body;

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  if (name.length > 100) {
    return NextResponse.json({ error: 'Name too long (max 100 chars)' }, { status: 400 });
  }

  // Validate photos array
  const photos = Array.isArray(metadata?.photos)
    ? metadata.photos.filter((p: unknown): p is string => typeof p === 'string').slice(0, 10)
    : [];

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
      name.slice(0, 100),
      str(metadata?.bio, 2000),
      str(card?.personality, 2000),
      str(card?.firstMes, 2000),
      str(card?.firstMes, 2000),
      str(metadata?.gender, 20),
      typeof metadata?.age === 'number' ? Math.max(0, Math.min(9999, metadata.age)) : null,
      str(metadata?.occupation, 200),
      str(metadata?.worldDescription || card?.description, 5000),
      photos,
    ]
  );

  return NextResponse.json({
    id: row!.id,
    agentId: row!.id,
    energyRemaining: deducted.energy,
  });
});
