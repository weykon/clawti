-- Users & Auth (NextAuth managed)
-- NextAuth creates: users, accounts, sessions, verification_tokens

-- Energy & Subscription
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id       TEXT PRIMARY KEY,
  energy        INT DEFAULT 100,
  is_premium    BOOLEAN DEFAULT false,
  stripe_customer_id TEXT,
  plan          TEXT DEFAULT 'free',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Task Queue
CREATE TABLE IF NOT EXISTS task_queue (
  id            SERIAL PRIMARY KEY,
  user_id       TEXT NOT NULL,
  type          TEXT NOT NULL,
  status        TEXT DEFAULT 'pending',
  payload       JSONB NOT NULL,
  result        JSONB,
  created_at    TIMESTAMPTZ DEFAULT now(),
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  error         TEXT
);

CREATE INDEX IF NOT EXISTS idx_task_queue_status ON task_queue(status) WHERE status = 'pending';

-- Notify trigger for task queue
CREATE OR REPLACE FUNCTION notify_new_task() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('new_task', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS task_queue_notify ON task_queue;
CREATE TRIGGER task_queue_notify
  AFTER INSERT ON task_queue
  FOR EACH ROW EXECUTE FUNCTION notify_new_task();
