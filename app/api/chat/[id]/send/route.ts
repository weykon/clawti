import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/src/lib/db';
import { authRoute } from '@/src/lib/apiRoute';
import {
  buildCharacterSystem,
  deductEnergy,
  getRecentHistory,
  loadCreatureForPrompt,
} from '@/src/lib/chatUtils';

const ALAN_URL = process.env.ALAN_URL || 'http://localhost:7088';
const ALAN_TIMEOUT = 30_000;

export const POST = authRoute(async (req, { userId, params }) => {
  const creatureId = params.id;
  const body = await req.json();
  const { content } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  if (content.length > 5000) {
    return NextResponse.json({ error: 'Message too long (max 5000 chars)' }, { status: 400 });
  }

  // Load character first — verify it exists before spending energy
  const creature = await loadCreatureForPrompt(creatureId);
  if (!creature) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 });
  }
  const characterSystem = buildCharacterSystem(creature);

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

  // Server-authoritative history (includes the user message we just inserted)
  const alanMessages = await getRecentHistory(userId, creatureId);

  // Call Alan with timeout
  let replyContent = '...';
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
});
