import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/constants/routes';
import { Logo } from '@/components/common/Logo';

/**
 * AuthLayout — center-stage login layout with brand panel and form panel.
 * If already authenticated, redirect to dashboard.
 */
export function AuthLayout() {
  const status = useAuthStore((s) => s.status);
  const hydrated = useAuthStore((s) => s.hydrated);

  if (hydrated && status === 'authenticated') {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated background grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(1200px circle at 20% 10%, color-mix(in oklch, var(--color-primary) 18%, transparent), transparent 40%), radial-gradient(900px circle at 80% 90%, color-mix(in oklch, var(--color-accent) 18%, transparent), transparent 50%)',
        }}
      />
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
        {/* Left brand panel */}
        <div className="relative hidden flex-col justify-between p-12 lg:flex">
          <Logo />
          <div className="space-y-6">
            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight">
              AI-powered surveillance for{' '}
              <span className="bg-gradient-to-br from-[color:var(--color-primary)] to-[color:var(--color-accent)] bg-clip-text text-transparent">
                modern threats
              </span>
            </h1>
            <p className="max-w-md text-pretty text-[color:var(--color-muted-foreground)]">
              Real-time weapon and threat detection over your camera feeds. Streams annotated
              video back to your dashboard in milliseconds.
            </p>
            <ul className="space-y-2 text-sm text-[color:var(--color-muted-foreground)]">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-success)]" />
                Live inference over WebSocket
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-success)]" />
                Historical analytics and trends
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-success)]" />
                Heuristic detection assistant
              </li>
            </ul>
          </div>
          <div className="text-xs text-[color:var(--color-muted-foreground)]">
            v1.0 · Built for security operators
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex items-center justify-center p-6 lg:p-12">
          <div className="clay w-full max-w-md rounded-2xl p-8">
            <div className="mb-6 flex items-center justify-center lg:hidden">
              <Logo />
            </div>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}