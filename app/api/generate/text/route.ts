import { NextRequest, NextResponse } from 'next/server';
import { authRoute } from '@/src/lib/apiRoute';

/**
 * Direct LLM call for text generation — bypasses Alan's pipeline entirely.
 *
 * Why not use Alan?
 * Alan's coordinator pipeline has a per-agent mutex that serializes all requests.
 * If the upstream LLM hangs, the mutex locks for 60s, blocking ALL subsequent
 * requests (including chat). For simple generation tasks we call the LLM directly
 * using the same API key, avoiding the mutex bottleneck.
 */

const LLM_BASE_URL = process.env.LLM_BASE_URL || process.env.ALAN_S2_BASE_URL || 'https://api.kimi.com/coding/v1';
const LLM_MODEL = process.env.LLM_MODEL || process.env.ALAN_S2_MODEL || 'kimi-for-coding';
const LLM_API_KEY = process.env.LLM_API_KEY || process.env.ALAN_S2_API_KEY || '';
const LLM_TIMEOUT = 45_000;

const GENERATION_SYSTEM = '你是一个专业的角色创作助手。你的任务是根据用户的要求生成角色相关的文字内容。请直接输出请求的内容，不要添加任何前缀、后缀、解释或引号。不要进行角色扮演，只需完成创作任务。';

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

export const POST = authRoute(async (req) => {
  const { field, context } = await req.json();

  if (!field || !FIELD_PROMPTS[field]) {
    return NextResponse.json(
      { error: `Invalid field. Supported: ${Object.keys(FIELD_PROMPTS).join(', ')}` },
      { status: 400 }
    );
  }

  if (!LLM_API_KEY) {
    return NextResponse.json({ error: 'LLM API key not configured' }, { status: 500 });
  }

  const prompt = FIELD_PROMPTS[field](context || {});

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT);

  try {
    // Direct OpenAI-compatible call to Kimi (bypasses Alan's mutex-protected pipeline)
    const url = `${LLM_BASE_URL.replace(/\/$/, '')}/chat/completions`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLM_API_KEY}`,
        'User-Agent': 'KimiCLI/0.77',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: LLM_MODEL,
        max_completion_tokens: 2048,
        messages: [
          { role: 'system', content: GENERATION_SYSTEM },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'LLM service error');
      console.error(`[generate/text] LLM returned ${res.status} for field="${field}":`, errText);
      return NextResponse.json(
        { error: `Generation failed (${res.status})` },
        { status: 502 }
      );
    }

    const data = await res.json();
    // OpenAI format: choices[0].message.content
    const text = data.choices?.[0]?.message?.content || '';

    if (!text) {
      console.warn(`[generate/text] Empty LLM response for field="${field}"`);
      return NextResponse.json(
        { error: 'AI returned empty response. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ text: text.trim() });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === 'AbortError') {
      console.error('[generate/text] LLM request timed out');
      return NextResponse.json({ error: 'Generation timed out. Please try again.' }, { status: 504 });
    }
    throw err; // Let authRoute handle generic errors
  } finally {
    clearTimeout(timer);
  }
});
