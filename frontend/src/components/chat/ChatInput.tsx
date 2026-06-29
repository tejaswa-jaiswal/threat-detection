import { useState, type FormEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  onSend: (text: string) => Promise<void> | void;
  pending: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, pending, disabled }: Props) {
  const [text, setText] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || pending) return;
    const t = text.trim();
    setText('');
    await onSend(t);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex items-center gap-2 border-t border-[color:var(--color-border)]/60 p-3"
    >
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ask about detections, sessions, or top threats…"
        disabled={disabled || pending}
        className="h-10 flex-1"
        aria-label="Chat message"
      />
      <Button
        type="submit"
        size="icon"
        disabled={!text.trim() || pending || disabled}
        aria-label="Send message"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
    </form>
  );
}