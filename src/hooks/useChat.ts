'use client';

import { useChatStore } from '../store/useChatStore';
import { useUIStore } from '../store/useUIStore';

/**
 * useChat — unified chat hook.
 *
 * Tries SSE streaming first (POST /chat/:id/stream).
 * Falls back to REST (POST /chat/:id/send) if streaming is unavailable.
 *
 * SSE Stream Protocol:
 *   event: token     → data: {"t": "Hello"}
 *   event: message_end → data: {"energyRemaining": 995}
 *   data: [DONE]     → stream complete
 */
export function useChat() {
  const energy = useUIStore(s => s.energy);
  const setEnergy = useUIStore(s => s.setEnergy);

  const {
    messages,
    selectedCharacter,
    inputText,
    isTyping,
    isStreaming,
    chatError,
    setInputText,
    sendMessageSSE,
    sendMessage,
    startChat,
    clearChat,
  } = useChatStore();

  const send = async () => {
    if (!inputText.trim()) return;
    // Try SSE first, falls back to REST inside sendMessageSSE
    await sendMessageSSE(inputText, energy, setEnergy);
  };

  const sendREST = async (content: string) => {
    await sendMessage(content, energy, setEnergy);
  };

  return {
    messages,
    selectedCharacter,
    inputText,
    isTyping,
    isStreaming,
    chatError,
    energy,
    setInputText,
    send,
    sendREST,
    startChat,
    clearChat,
  };
}
