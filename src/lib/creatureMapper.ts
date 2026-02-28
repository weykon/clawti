import type { Character, BackendCreature } from '../types';

export function creatureToCharacter(c: BackendCreature): Character {
  const name = c.name || c.agentName || 'Unknown';
  return {
    id: c.agentId || c.agent_id || c.id || '',
    name,
    tagline: c.bio || '',
    description: c.worldDescription || c.bio || '',
    avatar: c.photos?.[0] || `https://picsum.photos/seed/${encodeURIComponent(name)}/400/400`,
    images: c.photos || [],
    personality: c.personality || '',
    greeting: c.greeting || c.firstMes || `Hello! I'm ${name}.`,
    gender: c.gender || '',
    age: c.age ?? undefined,
    occupation: c.occupation || '',
    race: c.race || '',
    world: c.worldDescription || '',
    rating: c.rating || 0,
    chatCount: c.chatCount || 0,
    isCustom: !!c.creatorId && c.creatorId !== '00000000-0000-0000-0000-000000000000',
  };
}
