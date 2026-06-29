import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Mail, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/constants/routes';

interface FromState {
  from?: { pathname?: string };
}

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const login = useAuthStore((s) => s.login);
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const navigate = useNavigate();
  const location = useLocation();
  const submitting = status === 'authenticating';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome back');
      const from = (location.state as FromState | null)?.from?.pathname ?? ROUTES.dashboard;
      navigate(from, { replace: true });
    } catch {
      // error already surfaced via store.error
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          Use your operator credentials to access the dashboard.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-muted-foreground)]" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="operator@example.com"
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-muted-foreground)]" />
          <Input
            id="password"
            type={showPwd ? 'text' : 'password'}
            autoComplete="current-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[color:var(--color-muted-foreground)] transition-colors hover:bg-[color:var(--color-muted)]/40 hover:text-[color:var(--color-foreground)]"
            aria-label={showPwd ? 'Hide password' : 'Show password'}
          >
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="clay-inset rounded-xl border border-[color:var(--color-destructive)]/30 bg-[color:var(--color-destructive)]/10 px-3 py-2 text-sm text-[color:var(--color-destructive)]"
        >
          {error}
        </div>
      ) : null}

      <Button type="submit" className="w-full" size="lg" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            Sign in
          </>
        )}
      </Button>

      <p className="text-center text-xs text-[color:var(--color-muted-foreground)]">
        Protected system. Authorized access only.
      </p>
    </form>
  );
}