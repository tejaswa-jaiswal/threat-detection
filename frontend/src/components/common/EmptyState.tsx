import { type LucideIcon, Inbox } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        'clay-inset flex flex-col items-center justify-center rounded-2xl px-6 py-12 text-center',
        className,
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--color-muted)]/40 text-[color:var(--color-muted-foreground)]">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-[color:var(--color-foreground)]">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-[color:var(--color-muted-foreground)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}