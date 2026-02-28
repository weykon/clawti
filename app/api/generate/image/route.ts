import { NextResponse } from 'next/server';
import { queryOne } from '@/src/lib/db';
import { authRoute } from '@/src/lib/apiRoute';

export const POST = authRoute(async (req, { userId }) => {
  const { characterData, types } = await req.json();

  if (!characterData || typeof characterData !== 'object' || !characterData.name || typeof characterData.name !== 'string') {
    return NextResponse.json({ error: 'Character data with name is required' }, { status: 400 });
  }

  const validTypes = ['daily', 'closeup', 'scene'];
  const imageTypes = (Array.isArray(types) ? types : ['daily'])
    .filter((t: unknown): t is string => typeof t === 'string' && validTypes.includes(t));

  if (imageTypes.length === 0) {
    return NextResponse.json(
      { error: `Invalid image types. Must be one of: ${validTypes.join(', ')}` },
      { status: 400 }
    );
  }

  const row = await queryOne<{ id: string }>(
    'INSERT INTO task_queue (user_id, type, payload) VALUES ($1, $2, $3) RETURNING id',
    [userId, 'generate_image', JSON.stringify({ characterData: { name: String(characterData.name).slice(0, 100) }, imageTypes })]
  );

  return NextResponse.json({ taskId: row!.id });
});
