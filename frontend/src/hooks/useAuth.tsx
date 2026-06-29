/**
 * Auth-related hooks.
 *
 *  useAuth()            — returns auth state + login/logout
 *  RequireAuth          — route guard
 *  useCurrentUser()     — current user with null-check
 */
import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, selectIsAuthed, selectUser } from '@/stores/authStore';
import { ROUTES } from '@/constants/routes';
import type { User } from '@/types/domain';

export function useAuth() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const hydrated = useAuthStore((s) => s.hydrated);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);

  return {
    token,
    user,
    status,
    hydrated,
    error,
    isAuthenticated: selectIsAuthed({ ...useAuthStore.getState(), token, user, status } as never),
    login,
    logout,
  } as const;
}

export function useCurrentUser(): User | null {
  return useAuthStore(selectUser);
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const hydrated = useAuthStore((s) => s.hydrated);
  const location = useLocation();

  if (!hydrated) {
    // Brief flash while persist rehydrates from localStorage.
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="clay h-10 w-10 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to={ROUTES.login} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}