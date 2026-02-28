import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';
import { requireAuth } from '@/src/lib/requireAuth';
import {
  buildCharacterSystem,
  deductEnergy,
  getRecentHistory,
  loadCreatureForPrompt,
} from '@/src/lib/chatUtils';

const ALAN_URL = process.env.ALAN_URL || 'http://localhost:7088';
const ALAN_TIMEOUT = 30_000;

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

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!characterId) {
      return NextResponse.json({ error: 'characterId is required' }, { status: 400 });
    }

    if (message.length > 5000) {
      return NextResponse.json({ error: 'Message too long (max 5000 chars)' }, { status: 400 });
    }

    // Load character first — verify it exists before spending energy
    const creature = await loadCreatureForPrompt(characterId);
    if (!creature) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }
    const characterSystem = buildCharacterSystem(creature);

    // Atomic energy deduction — prevents race conditions
    const remaining = await deductEnergy(userId);
    if (remaining === null) {
      return NextResponse.json({ error: 'Not enough energy' }, { status: 400 });
    }

    // Persist user message before streaming
    await query(
      `INSERT INTO chat_messages (user_id, creature_id, role, content)
       VALUES ($1, $2, 'user', $3)`,
      [userId, characterId, message]
    );

    // Server-authoritative history (already includes the user message we just inserted)
    const messages = await getRecentHistory(userId, characterId);

    // Proxy to Alan with timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ALAN_TIMEOUT);

    let alanRes: Response;
    try {
      alanRes = await fetch(`${ALAN_URL}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'alan',
          max_tokens: 1024,
          messages,
          stream: true,
          ...(characterSystem ? { system: characterSystem } : {}),
          metadata: { characterId, userId },
        }),
      });
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof DOMException && err.name === 'AbortError') {
        return NextResponse.json({ error: 'AI service timed out' }, { status: 504 });
      }
      throw err;
    }
    clearTimeout(timer);

    if (!alanRes.ok) {
      const errText = await alanRes.text().catch(() => '');
      console.error(`Alan service returned ${alanRes.status}: ${errText}`);
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 502 });
    }

    if (!alanRes.body) {
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 502 });
    }

    // Tee the stream: pipe to client + collect full response for persistence
    // IMPORTANT: Reuse a single TextDecoder with { stream: true } to handle
    // multi-byte UTF-8 characters that may be split across chunk boundaries
    let fullResponse = '';
    const decoder = new TextDecoder();
    let sseBuffer = '';

    const transformStream = new TransformStream({
      transform(chunk, ctrl) {
        ctrl.enqueue(chunk);
        sseBuffer += decoder.decode(chunk, { stream: true });
        const lines = sseBuffer.split('\n');
        // Keep the last (potentially incomplete) line in the buffer
        sseBuffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.delta?.text) fullResponse += parsed.delta.text;
            else if (parsed.t) fullResponse += parsed.t;
          } catch {
            // skip non-JSON
          }
        }
      },
      flush() {
        // Process any remaining buffered data
        if (sseBuffer.startsWith('data: ')) {
          const data = sseBuffer.slice(6).trim();
          if (data && data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data);
              if (parsed.delta?.text) fullResponse += parsed.delta.text;
              else if (parsed.t) fullResponse += parsed.t;
            } catch { /* skip */ }
          }
        }
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

    return new Response(alanRes.body.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Chat stream error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
