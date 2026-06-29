import * as React from 'react';
import { cn } from '@/utils/cn';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'clay-inset relative overflow-hidden rounded-lg bg-[color:var(--color-muted)]/40',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.6s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/5 after:to-transparent',
        className,
      )}
      {...props}
    />
  );
}