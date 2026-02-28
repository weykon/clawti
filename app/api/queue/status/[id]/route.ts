import { NextResponse } from 'next/server';
import { pool } from '@/src/lib/db';
import { authRoute } from '@/src/lib/apiRoute';

export const GET = authRoute(async (_req, { userId, params }) => {
  const { id } = params;
  const result = await pool.query(
    'SELECT id, type, status, result, error, created_at, completed_at FROM task_queue WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const task = result.rows[0];
  return NextResponse.json({
    id: task.id,
    type: task.type,
    status: task.status,
    result: task.result,
    error: task.error,
    createdAt: task.created_at,
    completedAt: task.completed_at,
  });
});
