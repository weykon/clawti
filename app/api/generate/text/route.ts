import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/src/lib/requireAuth';

const ALAN_URL = process.env.ALAN_URL || 'http://localhost:7088';

const FIELD_PROMPTS: Record<string, (ctx: Record<string, unknown>) => string> = {
  bio: (ctx) =>
    `为角色"${ctx.name || '未命名'}"写一段简短的自我介绍（50-100字）。` +
    (ctx.gender ? `性别：${ctx.gender}。` : '') +
    (ctx.age ? `年龄：${ctx.age}岁。` : '') +
    (ctx.personality ? `性格：${ctx.personality}。` : '') +
    '请直接输出介绍内容，不要加引号或前缀。',

  occupation: (ctx) =>
    `为角色"${ctx.name || '未命名'}"想一个独特且有趣的职业（2-6个字）。` +
    (ctx.personality ? `性格特点：${ctx.personality}。` : '') +
    (ctx.age ? `年龄：${ctx.age}岁。` : '') +
    '请只输出职业名称，不要解释。',

  world: (ctx) =>
    `为角色"${ctx.name || '未命名'}"描述一个世界观或背景设定（30-80字）。` +
    (ctx.occupation ? `职业：${ctx.occupation}。` : '') +
    (ctx.personality ? `性格：${ctx.personality}。` : '') +
    '请直接输出世界观内容。',

  interests: (ctx) =>
    `为角色"${ctx.name || '未命名'}"列出3-5个兴趣爱好。` +
    (ctx.personality ? `性格：${ctx.personality}。` : '') +
    (ctx.occupation ? `职业：${ctx.occupation}。` : '') +
    '请用英文单词列出，用逗号分隔（例如：Music,Reading,Travel）。不要加其他内容。',

  appearanceDescription: (ctx) =>
    `为角色"${ctx.name || '未命名'}"写一段外貌描述（30-80字）。` +
    (ctx.gender ? `性别：${ctx.gender}。` : '') +
    (ctx.age ? `年龄：${ctx.age}岁。` : '') +
    (ctx.appearanceStyle ? `风格：${ctx.appearanceStyle}。` : '') +
    '请直接输出描述内容。',
};

export async function POST(req: NextRequest) {
  try {
    requireAuth(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { field, context } = await req.json();

    if (!field || !FIELD_PROMPTS[field]) {
      return NextResponse.json(
        { error: `Invalid field. Supported: ${Object.keys(FIELD_PROMPTS).join(', ')}` },
        { status: 400 }
      );
    }

    const prompt = FIELD_PROMPTS[field](context || {});

    const alanRes = await fetch(`${ALAN_URL}/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'alan',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
      }),
    });

    if (!alanRes.ok) {
      const errText = await alanRes.text().catch(() => 'Generation service error');
      return NextResponse.json(
        { error: `Generation failed: ${errText}` },
        { status: 502 }
      );
    }

    const data = await alanRes.json();
    // Anthropic format: { content: [{ type: 'text', text: '...' }] }
    const textBlock = data.content?.find?.((b: any) => b.type === 'text');
    const text = textBlock?.text || data.reply || data.message || '';

    return NextResponse.json({ text: text.trim() });
  } catch (err) {
    console.error('Text generation error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
