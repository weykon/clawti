'use client';

import { create } from 'zustand';
import type { Character, Message } from '../types';
import { api } from '../api/client';

interface ChatState {
  messages: Record<string, Message[]>;
  selectedCharacter: Character | null;
  switchingCharId: string | null;
  inputText: string;
  isTyping: boolean;
  isStreaming: boolean;
  chatError: string | null;
  chatReady: boolean;
}

interface ChatActions {
  setSelectedCharacter: (char: Character | null) => void;
  setInputText: (text: string) => void;
  setIsTyping: (v: boolean) => void;
  setChatError: (err: string | null) => void;
  addMessage: (charId: string, msg: Message) => void;
  appendToken: (charId: string, token: string) => void;
  finalizeStreamingMessage: (charId: string) => void;
  startChat: (char: Character) => Promise<void>;
  sendMessage: (content: string, energy: number, onEnergyUpdate: (e: number) => void) => Promise<void>;
  sendMessageSSE: (content: string, energy: number, onEnergyUpdate: (e: number) => void) => Promise<void>;
  clearChat: (charId: string) => void;
  resetAll: () => void;
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  messages: {},
  selectedCharacter: null,
  switchingCharId: null,
  inputText: '',
  isTyping: false,
  isStreaming: false,
  chatError: null,
  chatReady: true,

  setSelectedCharacter: (char) => set({ selectedCharacter: char }),
  setInputText: (text) => set({ inputText: text }),
  setIsTyping: (v) => set({ isTyping: v }),
  setChatError: (err) => set({ chatError: err }),

  addMessage: (charId, msg) =>
    set(s => ({ messages: { ...s.messages, [charId]: [...(s.messages[charId] || []), msg] } })),

  appendToken: (charId, token) =>
    set(s => {
      const msgs = s.messages[charId] || [];
      const last = msgs[msgs.length - 1];
      if (last?.isStreaming) {
        return {
          messages: {
            ...s.messages,
            [charId]: [...msgs.slice(0, -1), { ...last, content: last.content + token }],
          },
        };
      }
      // Create new streaming message
      const streamingMsg: Message = {
        id: `stream-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        role: 'assistant',
        content: token,
        timestamp: Date.now(),
        isStreaming: true,
      };
      return { messages: { ...s.messages, [charId]: [...msgs, streamingMsg] } };
    }),

  finalizeStreamingMessage: (charId) =>
    set(s => {
      const msgs = s.messages[charId] || [];
      return {
        messages: {
          ...s.messages,
          [charId]: msgs.map(m => m.isStreaming ? { ...m, isStreaming: false } : m),
        },
        isStreaming: false,
      };
    }),

  startChat: async (char) => {
    set({ selectedCharacter: char, chatReady: false, switchingCharId: char.id });
    const { messages } = get();
    if (messages[char.id]) {
      set({ chatReady: true, switchingCharId: null });
      return;
    }

    try {
      const res = await api.chat.messages(char.id);

      // Discard stale result if user switched to a different character during async load
      if (get().switchingCharId !== char.id) return;

      const msgs = ((res?.messages || res || []) as Array<{
        id: string; role: string; content: string; createdAt?: string;
      }>).map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.createdAt ? new Date(m.createdAt).getTime() : Date.now(),
      }));

      if (msgs.length > 0) {
        set(s => ({ messages: { ...s.messages, [char.id]: msgs }, chatReady: true, switchingCharId: null }));
      } else {
        set(s => ({
          messages: {
            ...s.messages,
            [char.id]: [{ id: 'greeting', role: 'assistant', content: char.greeting || `Hello! I'm ${char.name}.`, timestamp: Date.now() }],
          },
          chatReady: true,
          switchingCharId: null,
        }));
      }
    } catch (err) {
      console.warn(`Failed to load chat history for ${char.name}:`, err);
      if (get().switchingCharId !== char.id) return;
      set(s => ({
        messages: {
          ...s.messages,
          [char.id]: [{ id: 'greeting', role: 'assistant', content: char.greeting || `Hello! I'm ${char.name}.`, timestamp: Date.now() }],
        },
        chatReady: true,
        switchingCharId: null,
      }));
    }
  },

  sendMessage: async (content, energy, onEnergyUpdate) => {
    const { selectedCharacter, chatReady } = get();
    if (!content.trim() || !selectedCharacter || energy <= 0 || !chatReady) return;

    const charId = selectedCharacter.id;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, timestamp: Date.now() };
    get().addMessage(charId, userMsg);
    set({ inputText: '', isTyping: true });

    try {
      const result = await api.chat.send(charId, content);
      const aiMsg: Message = {
        id: result.reply?.id || (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.reply?.content || '...',
        timestamp: result.reply?.createdAt ? new Date(result.reply.createdAt).getTime() : Date.now(),
      };
      get().addMessage(charId, aiMsg);
      if (result.energyRemaining != null) onEnergyUpdate(result.energyRemaining);
    } catch (error) {
      set({ chatError: error instanceof Error ? error.message : 'Failed to send message' });
      setTimeout(() => set({ chatError: null }), 5000);
    } finally {
      set({ isTyping: false });
    }
  },

  sendMessageSSE: async (content, energy, onEnergyUpdate) => {
    const { selectedCharacter, appendToken, finalizeStreamingMessage, chatReady } = get();
    if (!content.trim() || !selectedCharacter || energy <= 0 || !chatReady) return;

    const charId = selectedCharacter.id;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, timestamp: Date.now() };
    get().addMessage(charId, userMsg);
    set({ inputText: '', isTyping: true, isStreaming: true });

    try {
      // Server handles history from DB — no client-side history needed
      const token = api.getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers,
        body: JSON.stringify({ characterId: charId, message: content }),
      });

      if (!res.ok || !res.body) {
        // Fallback to REST
        set({ isStreaming: false });
        try {
          const result = await api.chat.send(charId, content);
          const aiMsg: Message = {
            id: result.reply?.id || (Date.now() + 1).toString(),
            role: 'assistant',
            content: result.reply?.content || '...',
            timestamp: result.reply?.createdAt ? new Date(result.reply.createdAt).getTime() : Date.now(),
          };
          get().addMessage(charId, aiMsg);
          if (result.energyRemaining != null) onEnergyUpdate(result.energyRemaining);
        } catch (error) {
          set({ chatError: error instanceof Error ? error.message : 'Failed to send message' });
          setTimeout(() => set({ chatError: null }), 5000);
        } finally {
          set({ isTyping: false });
        }
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            // Anthropic format: content_block_delta has delta.text
            if (parsed.delta?.text) appendToken(charId, parsed.delta.text);
            // Simple format fallback: { t: "token" }
            else if (parsed.t) appendToken(charId, parsed.t);
            if (parsed.energyRemaining != null) onEnergyUpdate(parsed.energyRemaining);
          } catch {
            // Non-JSON data line, skip
          }
        }
      }

      finalizeStreamingMessage(charId);
    } catch (error) {
      set({ chatError: error instanceof Error ? error.message : 'Stream failed', isStreaming: false });
      setTimeout(() => set({ chatError: null }), 5000);
    } finally {
      set({ isTyping: false, isStreaming: false });
    }
  },

  clearChat: (charId) =>
    set(s => {
      const { [charId]: _, ...rest } = s.messages;
      return { messages: rest };
    }),

  resetAll: () => set({
    messages: {},
    selectedCharacter: null,
    switchingCharId: null,
    inputText: '',
    isTyping: false,
    isStreaming: false,
    chatError: null,
    chatReady: true,
  }),
}));
