export type View = 'discover' | 'chat' | 'create' | 'profile';

export interface Character {
  id: string;
  name: string;
  tagline: string;
  tagline_en?: string;
  description: string;
  description_en?: string;
  avatar: string;
  images?: string[];
  personality: string;
  personality_en?: string;
  greeting: string;
  greeting_en?: string;
  isCustom?: boolean;
  gender?: string;
  gender_en?: string;
  race?: string;
  race_en?: string;
  occupation?: string;
  occupation_en?: string;
  age?: number;
  world?: string;
  world_en?: string;
  rating?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface BackendCreature {
  agentId?: string;
  agent_id?: string;
  id?: string;
  name?: string;
  agentName?: string;
  bio?: string;
  worldDescription?: string;
  photos?: string[];
  personality?: string;
  greeting?: string;
  firstMes?: string;
  gender?: string;
  age?: number;
  occupation?: string;
  rating?: number;
  creatorId?: string;
}

export interface CreateFormState {
  name: string;
  gender: string;
  age: number;
  personalityTemplate: string;
  appearanceStyle: string;
  bio: string;
  tags: string[];
  occupation: string;
  world: string;
  personality: string;
  interests: string[];
  values: string[];
  emotion: {
    intensityDial: number;
    resilience: number;
    expressiveness: number;
    restraint: number;
  };
  growth: { enabled: boolean };
  proactive: { enabled: boolean };
  rpMode: 'off' | 'sfw' | 'nsfw';
  appearanceDescription: string;
  images: string[];
}

export interface ImportPreview {
  name?: string;
  description?: string;
  personality?: string;
  firstMes?: string;
  mesExample?: string;
  scenario?: string;
  creatorNotes?: string;
  tags?: string[];
  error?: string;
}
