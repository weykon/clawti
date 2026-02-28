import { NextResponse } from 'next/server';
import { queryOne } from '@/src/lib/db';
import { authRoute } from '@/src/lib/apiRoute';

export const GET = authRoute(async (_req, { userId, params }) => {
  const { id } = params;
  const task = await queryOne<{
    id: string; type: string; status: string;
    result: unknown; error: string | null;
    created_at: string; completed_at: string | null;
  }>(
    'SELECT id, type, status, result, error, created_at, completed_at FROM task_queue WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

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
