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

    // Load character personality for per-character system prompt
    let characterSystem = '';
    const creature = await queryOne<{
      name: string; personality: string; bio: string;
      occupation: string; world_description: string;
    }>(
      'SELECT name, personality, bio, occupation, world_description FROM creatures WHERE id = $1',
      [creatureId]
    );
    if (creature) {
      const parts = [`你是${creature.name}。`];
      if (creature.personality) parts.push(`性格特点：${creature.personality}。`);
      if (creature.bio) parts.push(`关于你：${creature.bio}`);
      if (creature.occupation) parts.push(`职业：${creature.occupation}。`);
      if (creature.world_description) parts.push(`世界背景：${creature.world_description}`);
      parts.push('请始终以这个角色身份回应，保持角色的语气和性格特点。用中文回复。');
      characterSystem = parts.join('\n');
    }

    // Build messages from DB history (server-authoritative, prevents cross-character contamination)
    // The current user message was already persisted above, so it's included in the query results
    const historyRows = await query<{ role: string; content: string }>(
      `SELECT role, content FROM chat_messages
       WHERE user_id = $1 AND creature_id = $2
       ORDER BY created_at DESC LIMIT 20`,
      [userId, creatureId]
    );
    const alanMessages: Array<{ role: string; content: string }> = historyRows.reverse();

    // Call Alan Bot Service for AI reply (Anthropic API format)
    let replyContent = "I'm here to chat! (AI service is currently unavailable)";
    try {
      const alanRes = await fetch(`${ALAN_URL}/v1/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        // Anthropic format: { content: [{ type: 'text', text: '...' }] }
        const textBlock = alanData.content?.find?.((b: any) => b.type === 'text');
        replyContent = textBlock?.text || alanData.reply || alanData.message || replyContent;
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
