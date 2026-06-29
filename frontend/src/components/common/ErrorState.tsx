import { AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Props {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title = 'Something failed', message, onRetry, className }: Props) {
  return (
    <div
      className={cn(
        'clay-inset flex flex-col items-center justify-center rounded-2xl px-6 py-12 text-center',
        className,
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--color-destructive)]/15 text-[color:var(--color-destructive)]">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-[color:var(--color-muted-foreground)]">
        {message}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-[color:var(--color-primary)] px-4 py-2 text-sm font-medium text-[color:var(--color-primary-foreground)] transition-colors hover:bg-[color:var(--color-primary)]/90"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}