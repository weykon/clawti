/**
 * Maps a raw DB creature row to the API response shape.
 * Used in discover, creature detail, and friends endpoints.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCreatureRow(r: Record<string, any>) {
  return {
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
  };
}
