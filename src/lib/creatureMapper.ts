import type { Character, BackendCreature } from '../types';

export function creatureToCharacter(c: BackendCreature): Character {
  return {
    id: c.agentId || c.agent_id || c.id || '',
    name: c.name || c.agentName || 'Unknown',
    tagline: c.bio || '',
    description: c.worldDescription || c.bio || '',
    avatar: c.photos?.[0] || `https://picsum.photos/seed/${c.name || 'x'}/400/400`,
    images: c.photos || [],
    personality: c.personality || '',
    greeting: c.greeting || c.firstMes || '',
    gender: c.gender,
    age: c.age,
    occupation: c.occupation,
    rating: c.rating || 0,
    chatCount: c.chatCount || 0,
    isCustom: c.creatorId !== '00000000-0000-0000-0000-000000000000',
  };
}
