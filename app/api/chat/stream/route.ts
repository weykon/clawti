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
    const { characterId, message, conversationHistory } = body;

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

    // Build CoordinatorEvent for Alan
    const coordinatorEvent = {
      trigger: 'user_message',
      content: message,
      timestamp: new Date().toISOString(),
      metadata: {
        characterId,
        userId,
        conversationHistory,
      },
    };

    // Proxy to Alan bot service with streaming
    const alanRes = await fetch(`${ALAN_URL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        ...coordinatorEvent,
        stream: true,
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
            if (parsed.t) fullResponse += parsed.t;
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
