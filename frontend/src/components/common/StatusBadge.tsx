import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

export type StatusVariant = 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline';

interface Props {
  variant: StatusVariant;
  label: string;
  pulse?: boolean;
  className?: string;
}

export function StatusBadge({ variant, label, pulse, className }: Props) {
  const pulseColor =
    variant === 'success'
      ? 'bg-[color:var(--color-success)]'
      : variant === 'destructive'
        ? 'bg-[color:var(--color-destructive)]'
        : variant === 'warning'
          ? 'bg-[color:var(--color-warning)]'
          : 'bg-[color:var(--color-primary)]';
  return (
    <Badge variant={variant} className={cn('gap-1.5', className)}>
      <span className="relative flex h-1.5 w-1.5">
        {pulse ? (
          <>
            <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', pulseColor)} />
            <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', pulseColor)} />
          </>
        ) : (
          <span className={cn('inline-flex h-1.5 w-1.5 rounded-full', pulseColor)} />
        )}
      </span>
      {label}
    </Badge>
  );
}