/**
 * Root providers — wraps the app with Query, Toaster, Tooltip, and Theme
 * contexts. Kept minimal so layout components remain easy to reason about.
 */
import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        {children}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          theme="dark"
          toastOptions={{
            classNames: {
              toast: 'clay !bg-[color:var(--color-card)] !text-[color:var(--color-foreground)] !border-[color:var(--color-border)]',
              title: '!text-[color:var(--color-foreground)]',
              description: '!text-[color:var(--color-muted-foreground)]',
            },
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}