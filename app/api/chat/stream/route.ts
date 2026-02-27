import { NextRequest, NextResponse } from 'next/server';

const ALAN_URL = process.env.ALAN_URL || 'http://localhost:7088';

export async function POST(req: NextRequest) {
  // TODO: Add auth check once NextAuth is wired up
  // const session = await auth();
  // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { characterId, message, conversationHistory } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Build CoordinatorEvent for Alan
    const coordinatorEvent = {
      trigger: 'user_message',
      content: message,
      timestamp: new Date().toISOString(),
      metadata: {
        characterId,
        // userId: session.user.id,
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

    // TODO: Deduct energy from user_profiles once DB is wired
    // await query('UPDATE user_profiles SET energy = energy - 1 WHERE user_id = $1 AND energy > 0', [session.user.id]);

    // Pipe the SSE stream directly back to the client
    return new Response(alanRes.body, {
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
