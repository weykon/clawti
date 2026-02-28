import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/src/lib/db';
import { requireAuth } from '@/src/lib/requireAuth';

export async function POST(req: NextRequest) {
  let userId: string;
  try {
    ({ userId } = requireAuth(req));
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { characterData, types } = await req.json();

    if (!characterData?.name) {
      return NextResponse.json({ error: 'Character data with name is required' }, { status: 400 });
    }

    const validTypes = ['daily', 'closeup', 'scene'];
    const imageTypes = (types || ['daily']).filter((t: string) => validTypes.includes(t));

    if (imageTypes.length === 0) {
      return NextResponse.json(
        { error: `Invalid image types. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Queue the image generation task (actual Flux API worker deferred to separate sprint)
    const result = await pool.query(
      'INSERT INTO task_queue (user_id, type, payload) VALUES ($1, $2, $3) RETURNING id',
      [userId, 'generate_image', JSON.stringify({ characterData, imageTypes })]
    );

    return NextResponse.json({ taskId: result.rows[0].id });
  } catch (err) {
    console.error('Image generation enqueue error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
