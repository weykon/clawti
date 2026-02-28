import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const gender = url.searchParams.get('gender');
    const occupation = url.searchParams.get('occupation');
    const parsedLimit = parseInt(url.searchParams.get('limit') || '50', 10);
    const limit = Math.max(1, Math.min(Number.isNaN(parsedLimit) ? 50 : parsedLimit, 100));

    const conditions = ['c.is_public = true'];
    const params: any[] = [];

    if (gender) {
      params.push(gender);
      conditions.push(`c.gender = $${params.length}`);
    }
    if (occupation) {
      params.push(occupation);
      conditions.push(`c.occupation = $${params.length}`);
    }

    params.push(limit);
    const sql = `SELECT c.*,
      (SELECT COUNT(DISTINCT cm.user_id) FROM chat_messages cm WHERE cm.creature_id = c.id) as chat_count
      FROM creatures c WHERE ${conditions.join(' AND ')} ORDER BY c.created_at DESC LIMIT $${params.length}`;

    const rows = await query(sql, params);

    const creatures = rows.map(r => ({
      id: r.id,
      agentId: r.id,
      name: r.name,
      bio: r.bio,
      personality: r.personality,
      greeting: r.greeting,
      firstMes: r.first_mes,
      gender: r.gender,
      age: r.age,
      occupation: r.occupation,
      worldDescription: r.world_description,
      photos: r.photos || [],
      rating: parseFloat(r.rating) || 0,
      creatorId: r.creator_id,
      chatCount: parseInt(r.chat_count) || 0,
    }));

    return NextResponse.json({ creatures });
  } catch (err) {
    console.error('Discover error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
