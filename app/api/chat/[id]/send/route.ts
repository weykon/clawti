import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/src/lib/db';
import { requireAuth } from '@/src/lib/requireAuth';
import {
  buildCharacterSystem,
  deductEnergy,
  getRecentHistory,
  loadCreatureForPrompt,
} from '@/src/lib/chatUtils';

const ALAN_URL = process.env.ALAN_URL || 'http://localhost:7088';
const ALAN_TIMEOUT = 30_000;

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

    // Atomic energy deduction
    const remaining = await deductEnergy(userId);
    if (remaining === null) {
      return NextResponse.json({ error: 'Not enough energy' }, { status: 400 });
    }

    // Persist user message
    const userMsg = await queryOne<{ id: string; created_at: string }>(
      `INSERT INTO chat_messages (user_id, creature_id, role, content)
       VALUES ($1, $2, 'user', $3)
       RETURNING id, created_at`,
      [userId, creatureId, content]
    );

    // Load character + build system prompt (shared utility)
    const creature = await loadCreatureForPrompt(creatureId);
    const characterSystem = creature ? buildCharacterSystem(creature) : '';

    // Server-authoritative history (includes the user message we just inserted)
    const alanMessages = await getRecentHistory(userId, creatureId);

    // Call Alan with timeout
    let replyContent = "I'm here to chat! (AI service is currently unavailable)";
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ALAN_TIMEOUT);

    try {
      const alanRes = await fetch(`${ALAN_URL}/v1/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'alan',
          max_tokens: 1024,
          messages: alanMessages,
          stream: false,
          ...(characterSystem ? { system: characterSystem } : {}),
          metadata: { characterId: creatureId, userId },
        }),
      });

      if (alanRes.ok) {
        const alanData = await alanRes.json();
        const textBlock = alanData.content?.find?.((b: any) => b.type === 'text');
        replyContent = textBlock?.text || alanData.reply || alanData.message || replyContent;
      }
    } catch {
      // Alan unavailable or timed out — use fallback reply
    } finally {
      clearTimeout(timer);
    }

    // Persist assistant reply
    const assistantMsg = await queryOne<{ id: string; created_at: string }>(
      `INSERT INTO chat_messages (user_id, creature_id, role, content)
       VALUES ($1, $2, 'assistant', $3)
       RETURNING id, created_at`,
      [userId, creatureId, replyContent]
    );

    return NextResponse.json({
      reply: {
        id: assistantMsg!.id,
        content: replyContent,
        createdAt: assistantMsg!.created_at,
      },
      energyRemaining: remaining,
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Chat send error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
