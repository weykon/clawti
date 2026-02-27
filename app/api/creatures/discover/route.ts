import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const gender = url.searchParams.get('gender');
    const occupation = url.searchParams.get('occupation');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);

    const conditions = ['is_public = true'];
    const params: any[] = [];

    if (gender) {
      params.push(gender);
      conditions.push(`gender = $${params.length}`);
    }
    if (occupation) {
      params.push(occupation);
      conditions.push(`occupation = $${params.length}`);
    }

    params.push(limit);
    const sql = `SELECT * FROM creatures WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT $${params.length}`;

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
    }));

    return NextResponse.json({ creatures });
  } catch (err) {
    console.error('Discover error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
