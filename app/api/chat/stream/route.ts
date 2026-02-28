import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/src/lib/db';
import { requireAuth } from '@/src/lib/requireAuth';

const ALAN_URL = process.env.ALAN_URL || 'http://localhost:7088';

export async function POST(req: NextRequest) {
  let userId: string;
  try {
    ({ userId } = requireAuth(req));
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { characterId, message } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
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

    // Persist user message before streaming
    await query(
      `INSERT INTO chat_messages (user_id, creature_id, role, content)
       VALUES ($1, $2, 'user', $3)`,
      [userId, characterId, message]
    );

    // Load character personality for per-character system prompt
    let characterSystem = '';
    if (characterId) {
      const creature = await queryOne<{
        name: string; personality: string; bio: string;
        greeting: string; occupation: string; world_description: string;
      }>(
        'SELECT name, personality, bio, greeting, occupation, world_description FROM creatures WHERE id = $1',
        [characterId]
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
    }

    // Build messages from DB history (server-authoritative, prevents cross-character contamination)
    // The current user message was already persisted above, so it's included in the query results
    const historyRows = await query<{ role: string; content: string }>(
      `SELECT role, content FROM chat_messages
       WHERE user_id = $1 AND creature_id = $2
       ORDER BY created_at DESC LIMIT 20`,
      [userId, characterId]
    );
    const messages: Array<{ role: string; content: string }> = historyRows.reverse();

    // Proxy to Alan bot service with streaming
    const alanRes = await fetch(`${ALAN_URL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        model: 'alan',
        max_tokens: 1024,
        messages,
        stream: true,
        ...(characterSystem ? { system: characterSystem } : {}),
        metadata: { characterId, userId },
      }),
    });

    if (!alanRes.ok) {
      const errText = await alanRes.text().catch(() => 'Alan service error');
      return NextResponse.json(
        { error: `Alan service returned ${alanRes.status}: ${errText}` },
        { status: 502 }
      );
    }

    if (!alanRes.body) {
      return NextResponse.json({ error: 'No stream body from Alan' }, { status: 502 });
    }

    // Tee the stream: pipe to client + collect full response for persistence
    // Alan uses Anthropic SSE format: event: content_block_delta, data: { delta: { text } }
    let fullResponse = '';
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(chunk);
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            // Anthropic format: content_block_delta has delta.text
            if (parsed.delta?.text) fullResponse += parsed.delta.text;
            // Also handle simple { t: "token" } format as fallback
            else if (parsed.t) fullResponse += parsed.t;
          } catch {
            // skip non-JSON
          }
        }
      },
      flush() {
        // Persist the complete assistant reply after stream ends
        if (fullResponse) {
          query(
            `INSERT INTO chat_messages (user_id, creature_id, role, content)
             VALUES ($1, $2, 'assistant', $3)`,
            [userId, characterId, fullResponse]
          ).catch(err => console.error('Failed to persist stream reply:', err));
        }
      },
    });

    // Pipe the SSE stream through our transform and back to the client
    return new Response(alanRes.body.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Chat stream error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
