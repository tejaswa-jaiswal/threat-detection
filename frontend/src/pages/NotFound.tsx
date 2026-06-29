import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="clay max-w-md space-y-5 rounded-2xl p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--color-muted)]/40 text-[color:var(--color-muted-foreground)]">
          <Compass className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Page not found</h1>
          <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">
            The page you were looking for doesn't exist.
          </p>
        </div>
        <Button asChild className="mx-auto">
          <Link to={ROUTES.dashboard}>Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}