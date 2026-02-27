import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/src/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // TODO: Add auth check
  try {
    const { id } = await params;
    const result = await pool.query(
      'SELECT id, type, status, result, error, created_at, completed_at FROM task_queue WHERE id = $1',
      [id]
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
  } catch (err) {
    console.error('Task status error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
