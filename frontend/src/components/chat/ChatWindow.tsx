import { Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatMessageList } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useChatStore } from '@/stores/chatStore';
import { chatService, type ChatMessage } from '@/services/chat.service';

export function ChatWindow() {
  const messages = useChatStore((s) => s.messages);
  const pending = useChatStore((s) => s.pending);
  const error = useChatStore((s) => s.error);
  const send = useChatStore((s) => s.send);
  const reset = useChatStore((s) => s.reset);

  async function handleSend(text: string) {
    await send(text, async (history: ChatMessage[]) => {
      const last = history[history.length - 1];
      // Backend wants user/assistant/system only (skip the initial assistant greeting
      // since it's a welcome card, not a real prior turn).
      const trimmed = history.slice(-6);
      const res = await chatService.send({
        messages: trimmed,
        video_id: null,
      });
      void last;
      return { role: 'assistant', content: res.content };
    });
  }

  return (
    <>
      <CardHeader className="border-b border-[color:var(--color-border)]/60">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[color:var(--color-primary)] to-[color:var(--color-accent)] text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            Insights Assistant
            <span className="ml-2 text-[10px] font-normal uppercase tracking-wider text-[color:var(--color-muted-foreground)]">
              heuristic · v1
            </span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={reset} aria-label="Reset conversation">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <div className="flex min-h-0 flex-1 flex-col">
        <ChatMessageList messages={messages} />
        {error ? (
          <div className="border-t border-[color:var(--color-destructive)]/30 bg-[color:var(--color-destructive)]/10 px-4 py-2 text-xs text-[color:var(--color-destructive)]">
            {error}
          </div>
        ) : null}
        <ChatInput onSend={handleSend} pending={pending} />
      </div>
      <CardContent className="hidden" />
    </>
  );
}