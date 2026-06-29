import { Shield } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[color:var(--color-primary)] to-[color:var(--color-accent)] shadow-[0_4px_16px_-4px_color-mix(in_oklch,var(--color-primary)_60%,transparent)]">
        <Shield className="h-[18px] w-[18px] text-white" strokeWidth={2.4} />
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[color:var(--color-success)] ring-2 ring-[color:var(--color-background)]" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold tracking-tight text-[color:var(--color-foreground)]">
          Sentinel
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
          Threat Detection
        </span>
      </div>
    </div>
  );
}