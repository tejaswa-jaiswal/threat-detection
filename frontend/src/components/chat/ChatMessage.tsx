import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Bot, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChatTyping } from './ChatTyping';
import { cn } from '@/utils/cn';
import type { ChatMessage } from '@/services/chat.service';

interface Props {
  message: ChatMessage;
  isLast?: boolean;
  pending?: boolean;
}

export function ChatMessageItem({ message, pending }: Props) {
  const isUser = message.role === 'user';
  return (
    <div
      className={cn(
        'flex items-start gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      <Avatar className="h-7 w-7 shrink-0">
        {isUser ? (
          <AvatarFallback className="bg-[color:var(--color-secondary)]">
            <User className="h-3.5 w-3.5" />
          </AvatarFallback>
        ) : (
          <AvatarFallback className="bg-gradient-to-br from-[color:var(--color-primary)] to-[color:var(--color-accent)] text-white">
            <Bot className="h-3.5 w-3.5" />
          </AvatarFallback>
        )}
      </Avatar>

      <div
        className={cn(
          'clay max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
          isUser
            ? 'bg-gradient-to-br from-[color:var(--color-primary)]/30 to-[color:var(--color-accent)]/20'
            : 'bg-[color:var(--color-card)]',
          !isUser && 'markdown-body',
        )}
      >
        {pending ? (
          <ChatTyping />
        ) : isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export function ChatMessageList({ messages }: { messages: ChatMessage[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
      {messages.map((m, i) => (
        <ChatMessageItem
          key={i}
          message={m}
          isLast={i === messages.length - 1}
        />
      ))}
    </div>
  );
}

// Convenience hook for the "send" wiring.
export function useChatScroll() {
  const ref = useRef<HTMLDivElement>(null);
  return ref;
}