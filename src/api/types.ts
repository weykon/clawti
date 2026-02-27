import type { BackendCreature } from '../types';

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    membershipTier?: string;
    energy?: number;
    friendsCount?: number;
    creationsCount?: number;
  };
  token: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  energy?: number;
  membershipTier?: string;
  friendsCount?: number;
  creationsCount?: number;
}

export interface EnergyResponse {
  energy: number;
  newBalance?: number;
  new_balance?: number;
  energyGained?: number;
  energy_gained?: number;
}

export interface FriendsListResponse {
  friends: Array<{ creature: BackendCreature } | BackendCreature>;
}

export interface DiscoverResponse {
  creatures?: BackendCreature[];
}

export interface ChatMessageResponse {
  messages?: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt?: string;
  }>;
}

export interface SendMessageResponse {
  reply?: {
    id: string;
    content: string;
    createdAt?: string;
  };
  energyRemaining?: number;
}

export interface CreateCreaturePayload {
  name: string;
  card: {
    personality: string;
    description: string;
    firstMes: string;
    mesExample: string;
    scenario: string;
    creatorNotes: string;
  };
  metadata: {
    gender: string;
    age: number;
    bio: string;
    tags: string[];
    occupation: string;
    worldDescription: string;
    photos: string[];
    appearanceStyle: string;
  };
  mode: 'classic' | 'enhanced';
}

export interface CreateCreatureResponse {
  agentId?: string;
  agent_id?: string;
  id?: string;
  energyRemaining?: number;
  energy?: number;
}

export interface FeedItem {
  id: string;
  type?: string;
  title?: string;
  content?: string;
  author?: { id: string; username: string; avatar?: string };
  creatureId?: string;
  likes?: number;
  comments?: number;
  createdAt?: string;
}

export interface FeedListResponse {
  items: FeedItem[];
  total?: number;
  hasMore?: boolean;
}

export interface FeedActionResponse {
  success: boolean;
  likes?: number;
  commentId?: string;
}
