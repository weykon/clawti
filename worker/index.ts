/**
 * Task Queue Worker
 *
 * Standalone process that listens for new tasks via pg_notify
 * and processes them by calling the Alan bot service.
 *
 * Run with: npm run worker (or: npx tsx worker/index.ts)
 */

import { Pool, Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/clawti';
const ALAN_URL = process.env.ALAN_URL || 'http://localhost:7088';

// Pool for queries
const pool = new Pool({ connectionString: DATABASE_URL });

// Dedicated client for LISTEN (can't use pool for persistent connections)
const listenClient = new Client({ connectionString: DATABASE_URL });

interface TaskRow {
  id: number;
  user_id: string;
  type: string;
  payload: any;
}

/** Map task type + payload to a CoordinatorEvent for Alan */
function toCoordinatorEvent(type: string, payload: any) {
  switch (type) {
    case 'create_creature':
      return {
        trigger: 'system_event',
        content: JSON.stringify({ action: 'create', ...payload }),
        timestamp: new Date().toISOString(),
      };
    case 'import_card':
      return {
        trigger: 'fact_sync',
        content: JSON.stringify({ action: 'import', card: payload.cardData }),
        timestamp: new Date().toISOString(),
      };
    case 'heartbeat':
      return {
        trigger: 'heartbeat',
        content: '',
        timestamp: new Date().toISOString(),
      };
    default:
      throw new Error(`Unknown task type: ${type}`);
  }
}

/** Claim and process the next pending task */
async function processTask(taskId?: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Claim a pending task (with row lock to prevent double-processing)
    let query = `
      SELECT id, user_id, type, payload
      FROM task_queue
      WHERE status = 'pending'
    `;
    const params: any[] = [];

    if (taskId) {
      query += ' AND id = $1';
      params.push(taskId);
    }

    query += ' ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED';

    const { rows } = await client.query(query, params);
    if (rows.length === 0) {
      await client.query('COMMIT');
      return;
    }

    const task: TaskRow = rows[0];
    console.log(`[worker] Processing task #${task.id} (${task.type})`);

    // Mark as processing
    await client.query(
      "UPDATE task_queue SET status = 'processing', started_at = now() WHERE id = $1",
      [task.id]
    );
    await client.query('COMMIT');

    // Call Alan (outside transaction — don't hold locks during HTTP call)
    try {
      const event = toCoordinatorEvent(task.type, task.payload);
      const res = await fetch(`${ALAN_URL}/v1/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...event, stream: false }),
      });

      if (!res.ok) {
        throw new Error(`Alan returned ${res.status}: ${await res.text()}`);
      }

      const result = await res.json();

      await pool.query(
        "UPDATE task_queue SET status = 'done', result = $1, completed_at = now() WHERE id = $2",
        [JSON.stringify(result), task.id]
      );
      console.log(`[worker] Task #${task.id} completed`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await pool.query(
        "UPDATE task_queue SET status = 'failed', error = $1, completed_at = now() WHERE id = $2",
        [errorMsg, task.id]
      );
      console.error(`[worker] Task #${task.id} failed:`, errorMsg);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[worker] Transaction error:', err);
  } finally {
    client.release();
  }
}

/** Process any pending tasks that were missed (e.g., worker was down) */
async function drainPending() {
  const { rows } = await pool.query(
    "SELECT id FROM task_queue WHERE status = 'pending' ORDER BY created_at ASC"
  );
  for (const row of rows) {
    await processTask(String(row.id));
  }
}

async function main() {
  console.log('[worker] Starting task queue worker...');
  console.log(`[worker] Database: ${DATABASE_URL.replace(/:[^:@]+@/, ':***@')}`);
  console.log(`[worker] Alan URL: ${ALAN_URL}`);

  // Set up LISTEN for new tasks
  await listenClient.connect();
  await listenClient.query('LISTEN new_task');
  console.log('[worker] Listening for new_task notifications');

  listenClient.on('notification', async (msg) => {
    if (msg.channel === 'new_task') {
      console.log(`[worker] Received notification for task #${msg.payload}`);
      await processTask(msg.payload);
    }
  });

  // Drain any pending tasks from before worker started
  await drainPending();

  console.log('[worker] Ready and waiting for tasks...');

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n[worker] Shutting down...');
    await listenClient.end();
    await pool.end();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[worker] Fatal error:', err);
  process.exit(1);
});
