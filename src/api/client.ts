'use client';

import type {
  AuthResponse,
  UserProfile,
  EnergyResponse,
  FriendsListResponse,
  DiscoverResponse,
  ChatMessageResponse,
  SendMessageResponse,
  CreateCreaturePayload,
  CreateCreatureResponse,
  FeedListResponse,
  FeedItem,
  FeedActionResponse,
} from './types';
import type { BackendCreature } from '../types';

const API_BASE = '/api';
const DEFAULT_TIMEOUT = 30_000; // 30 seconds

class ApiClient {
  private token: string | null = typeof window !== 'undefined' ? localStorage.getItem('vc_token') : null;
  private activeControllers = new Set<AbortController>();

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('vc_token', token);
      else localStorage.removeItem('vc_token');
    }
  }

  getToken() { return this.token; }

  /** Cancel all in-flight requests */
  cancelAll() {
    this.activeControllers.forEach(c => c.abort());
    this.activeControllers.clear();
  }

  private async request<T>(method: string, path: string, body?: unknown, timeout = DEFAULT_TIMEOUT): Promise<T> {
    const controller = new AbortController();
    this.activeControllers.add(controller);
    const timer = setTimeout(() => controller.abort(), timeout);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return res.json();
    } finally {
      clearTimeout(timer);
      this.activeControllers.delete(controller);
    }
  }

  /** Returns fetch Response for SSE streaming — caller reads res.body */
  async streamRequest(path: string, body: unknown): Promise<Response> {
    const controller = new AbortController();
    this.activeControllers.add(controller);
    // SSE streams can be long-lived, use 2 min timeout for initial connection
    const timer = setTimeout(() => controller.abort(), 120_000);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);
      // Don't delete controller yet — caller may still be reading the stream
      return res;
    } catch (err) {
      clearTimeout(timer);
      this.activeControllers.delete(controller);
      throw err;
    }
  }

  auth = {
    register: (username: string, email: string, password: string) =>
      this.request<AuthResponse>('POST', '/auth/register', { username, email, password }),
    login: (email: string, password: string) =>
      this.request<AuthResponse>('POST', '/auth/login', { email, password }),
    me: () => this.request<UserProfile>('GET', '/auth/me'),
  };

  user = {
    profile: () => this.request<UserProfile>('GET', '/user/profile'),
    updateProfile: (data: Partial<UserProfile>) => this.request<UserProfile>('PUT', '/user/profile', data),
    energy: () => this.request<EnergyResponse>('GET', '/user/energy'),
    dailyCheckin: () => this.request<EnergyResponse>('POST', '/user/energy/daily-checkin'),
  };

  friends = {
    list: () => this.request<FriendsListResponse>('GET', '/user/friends'),
    add: (creatureId: string) => this.request<{ success: boolean }>('POST', '/user/friends', { creature_id: creatureId }),
    remove: (creatureId: string) => this.request<{ success: boolean }>('DELETE', `/user/friends/${creatureId}`),
  };

  creatures = {
    discover: (filters?: { gender?: string; occupation?: string; limit?: number }) => {
      const params = new URLSearchParams();
      if (filters?.gender) params.set('gender', filters.gender);
      if (filters?.occupation) params.set('occupation', filters.occupation);
      if (filters?.limit) params.set('limit', String(filters.limit));
      const qs = params.toString();
      return this.request<DiscoverResponse | BackendCreature[]>('GET', `/creatures/discover${qs ? '?' + qs : ''}`);
    },
    get: (id: string) => this.request<BackendCreature>('GET', `/creatures/${id}`),
    create: (data: CreateCreaturePayload) => this.request<CreateCreatureResponse>('POST', '/creatures', data),
    delete: (id: string) => this.request<{ success: boolean }>('DELETE', `/creatures/${id}`),
  };

  chat = {
    messages: (creatureId: string, limit = 50) =>
      this.request<ChatMessageResponse>('GET', `/chat/${creatureId}/messages?limit=${limit}`),
    send: (creatureId: string, content: string) =>
      this.request<SendMessageResponse>('POST', `/chat/${creatureId}/send`, { content }),
    stream: (creatureId: string, content: string) =>
      this.streamRequest(`/chat/${creatureId}/stream`, { content }),
    clear: (creatureId: string) => this.request<{ success: boolean }>('DELETE', `/chat/${creatureId}`),
  };

  feed = {
    list: (tab = 'recommended', limit = 20, offset = 0) =>
      this.request<FeedListResponse>('GET', `/feed?tab=${tab}&limit=${limit}&offset=${offset}`),
    get: (id: string) => this.request<FeedItem>('GET', `/feed/${id}`),
    like: (id: string) => this.request<FeedActionResponse>('POST', `/feed/${id}/like`),
    comment: (id: string, content: string) =>
      this.request<FeedActionResponse>('POST', `/feed/${id}/comment`, { content }),
  };
}

export const api = new ApiClient();
