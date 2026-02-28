import { query, queryOne } from './db';

/** Creature fields needed for system prompt construction */
export interface CreaturePromptData {
  name: string;
  personality: string;
  bio: string;
  occupation: string;
  world_description: string;
}

/**
 * Build a character-specific system prompt for the LLM.
 * Single source of truth — used by both streaming and REST chat endpoints.
 */
export function buildCharacterSystem(creature: CreaturePromptData): string {
  const parts = [`你是${creature.name}。`];
  if (creature.personality) parts.push(`性格特点：${creature.personality}。`);
  if (creature.bio) parts.push(`关于你：${creature.bio}`);
  if (creature.occupation) parts.push(`职业：${creature.occupation}。`);
  if (creature.world_description) parts.push(`世界背景：${creature.world_description}`);
  parts.push('请始终以这个角色身份回应，保持角色的语气和性格特点。用中文回复。');
  return parts.join('\n');
}

/**
 * Atomically deduct 1 energy. Returns remaining energy, or null if insufficient.
 * Uses UPDATE ... WHERE energy > 0 RETURNING to prevent race conditions.
 */
export async function deductEnergy(userId: string): Promise<number | null> {
  const result = await queryOne<{ energy: number }>(
    'UPDATE user_profiles SET energy = energy - 1 WHERE user_id = $1 AND energy > 0 RETURNING energy',
    [userId]
  );
  return result?.energy ?? null;
}

/**
 * Fetch recent chat history from DB for a user+creature pair.
 * Server-authoritative — prevents cross-character contamination.
 */
export async function getRecentHistory(
  userId: string,
  creatureId: string,
  limit = 20
): Promise<Array<{ role: string; content: string }>> {
  const rows = await query<{ role: string; content: string }>(
    `SELECT role, content FROM chat_messages
     WHERE user_id = $1 AND creature_id = $2
     ORDER BY created_at DESC LIMIT $3`,
    [userId, creatureId, limit]
  );
  return rows.reverse();
}

/**
 * Load creature data needed for system prompt. Returns null if not found.
 */
export async function loadCreatureForPrompt(
  creatureId: string
): Promise<CreaturePromptData | null> {
  return queryOne<CreaturePromptData>(
    'SELECT name, personality, bio, occupation, world_description FROM creatures WHERE id = $1',
    [creatureId]
  );
}
