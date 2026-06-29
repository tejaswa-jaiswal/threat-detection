import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-64" />
      <div className="flex items-center justify-center pt-12 text-[color:var(--color-muted-foreground)]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading…
      </div>
    </div>
  );
}

export function CardSkeleton({ className = 'h-32' }: { className?: string }) {
  return <Skeleton className={className} />;
}