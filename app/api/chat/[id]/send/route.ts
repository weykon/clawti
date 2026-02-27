import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/src/lib/db';
import { requireAuth } from '@/src/lib/requireAuth';

const ALAN_URL = process.env.ALAN_URL || 'http://localhost:7088';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = requireAuth(req);
    const { id: creatureId } = await params;
    const body = await req.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Check and deduct energy
    const profile = await queryOne<{ energy: number }>(
      'SELECT energy FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    if ((profile?.energy ?? 0) <= 0) {
      return NextResponse.json({ error: 'Not enough energy' }, { status: 400 });
    }
    await query('UPDATE user_profiles SET energy = energy - 1 WHERE user_id = $1', [userId]);

    // Persist user message
    const userMsg = await queryOne<{ id: string; created_at: string }>(
      `INSERT INTO chat_messages (user_id, creature_id, role, content)
       VALUES ($1, $2, 'user', $3)
       RETURNING id, created_at`,
      [userId, creatureId, content]
    );

    // Call Alan Bot Service for AI reply (non-streaming)
    let replyContent = "I'm here to chat! (AI service is currently unavailable)";
    try {
      const alanRes = await fetch(`${ALAN_URL}/v1/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger: 'user_message',
          content,
          timestamp: new Date().toISOString(),
          metadata: { characterId: creatureId, userId },
          stream: false,
        }),
      });

      if (alanRes.ok) {
        const alanData = await alanRes.json();
        replyContent = alanData.content || alanData.reply || alanData.message || replyContent;
      }
    } catch {
      // Alan unavailable — use fallback reply
    }

    // Persist assistant reply
    const assistantMsg = await queryOne<{ id: string; created_at: string }>(
      `INSERT INTO chat_messages (user_id, creature_id, role, content)
       VALUES ($1, $2, 'assistant', $3)
       RETURNING id, created_at`,
      [userId, creatureId, replyContent]
    );

    const updatedProfile = await queryOne<{ energy: number }>(
      'SELECT energy FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    return NextResponse.json({
      reply: {
        id: assistantMsg!.id,
        content: replyContent,
        createdAt: assistantMsg!.created_at,
      },
      energyRemaining: updatedProfile?.energy ?? 0,
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Chat send error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
