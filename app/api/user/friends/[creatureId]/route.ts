import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';
import { requireAuth } from '@/src/lib/requireAuth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ creatureId: string }> }
) {
  try {
    const { userId } = requireAuth(req);
    const { creatureId } = await params;

    await query(
      'DELETE FROM user_friends WHERE user_id = $1 AND creature_id = $2',
      [userId, creatureId]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Friends DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
