import { NextResponse } from 'next/server';
import { query, queryOne } from '@/src/lib/db';
import { authRoute } from '@/src/lib/apiRoute';

export const POST = authRoute(async (_req, { userId }) => {
  // Try to insert today's check-in; ON CONFLICT means already checked in today
  const inserted = await query<{ checked_in_at: string }>(
    `INSERT INTO daily_checkins (user_id, checked_in_at, energy_gained)
     VALUES ($1, CURRENT_DATE, 50)
     ON CONFLICT (user_id, checked_in_at) DO NOTHING
     RETURNING checked_in_at`,
    [userId]
  );

  let energyGained = 0;
  if (inserted.length > 0) {
    // First check-in today — award energy
    await query(
      'UPDATE user_profiles SET energy = energy + 50 WHERE user_id = $1',
      [userId]
    );
    energyGained = 50;
  }

  const profile = await queryOne<{ energy: number }>(
    'SELECT energy FROM user_profiles WHERE user_id = $1',
    [userId]
  );

  return NextResponse.json({
    energy: profile?.energy ?? 1000,
    energyGained,
  });
});
