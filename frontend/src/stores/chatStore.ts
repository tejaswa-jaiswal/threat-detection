/**
 * Insights chat store. Holds the current conversation transcript. Not
 * persisted — a fresh tab starts fresh, which is the expected UX.
 */
import { create } from 'zustand';
import type { ChatMessage } from '@/services/chat.service';

interface ChatState {
  messages: ChatMessage[];
  pending: boolean;
  error: string | null;

  send: (text: string, send: (m: ChatMessage[]) => Promise<ChatMessage>) => Promise<void>;
  setMessages: (m: ChatMessage[]) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [
    {
      role: 'assistant',
      content:
        "Hi — I'm **Sentinel Insights**, your detection analyst. Ask me about recent activity, threat counts, or sessions.",
    },
  ],
  pending: false,
  error: null,

  async send(text, send) {
    const userMsg: ChatMessage = { role: 'user', content: text };
    set((s) => ({ messages: [...s.messages, userMsg], pending: true, error: null }));
    try {
      const next = await send([...useChatStore.getState().messages, userMsg]);
      set((s) => ({ messages: [...s.messages, next], pending: false }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send message';
      set({ pending: false, error: msg });
    }
  },

  setMessages: (messages) => set({ messages }),
  reset: () =>
    set({
      messages: [
        {
          role: 'assistant',
          content:
            "Hi — I'm **Sentinel Insights**, your detection analyst. Ask me about recent activity, threat counts, or sessions.",
        },
      ],
      pending: false,
      error: null,
    }),
}));