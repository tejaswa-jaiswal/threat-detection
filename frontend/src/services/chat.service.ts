/**
 * Insights chat service.
 *
 * Note: backend labels this an "Insights" assistant — a deterministic
 * heuristic that reads from the detections table. The response shape mirrors
 * a real LLM's so a future swap is a single-line change.
 */
import { api } from './api';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  video_id?: string | null;
}

export interface ChatResponse {
  role: 'assistant';
  content: string;
  model_version: string;
}

export const chatService = {
  send(req: ChatRequest): Promise<ChatResponse> {
    return api.post<ChatResponse>('/chat', { json: req });
  },
};