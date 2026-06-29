/**
 * Auth store.
 *
 * Persists token + user to localStorage. Hydrates on first read and prunes
 * expired tokens so the user lands on /login instead of seeing a 401 page.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authService } from '@/services/auth.service';
import { setTokenProvider, setUnauthorizedHandler } from '@/services/api';
import { isExpired } from '@/utils/jwt';
import { ApiError } from '@/utils/errors';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import type { User } from '@/types/domain';

export type AuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'unauthenticated';

interface PersistedShape {
  token: string | null;
  user: User | null;
}

interface AuthState {
  token: string | null;
  user: User | null;
  status: AuthStatus;
  error: string | null;

  /** True once we've read from localStorage and resolved the initial state. */
  hydrated: boolean;

  /** Internal — set by the login() action. */
  login: (email: string, password: string) => Promise<void>;
  logout: (reason?: 'manual' | 'expired' | 'unauthorized') => void;
  hydrate: () => void;
  /** Called by the API wrapper on 401. */
  _onUnauthorized: () => void;
}

const initialPersisted: PersistedShape = { token: null, user: null };

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: initialPersisted.token,
      user: initialPersisted.user,
      status: 'idle',
      error: null,
      hydrated: false,

      async login(email, password) {
        set({ status: 'authenticating', error: null });
        try {
          const result = await authService.login({ email, password });
          if (isExpired(result.access_token)) {
            // Server handed us a token that's already past exp.
            set({ status: 'unauthenticated', error: 'Token already expired' });
            return;
          }
          set({
            token: result.access_token,
            user: result.user,
            status: 'authenticated',
            error: null,
          });
        } catch (err) {
          const msg =
            err instanceof ApiError
              ? err.body?.detail ?? err.message
              : 'Unable to sign in';
          set({ status: 'unauthenticated', error: msg, token: null, user: null });
          throw err;
        }
      },

      logout(reason = 'manual') {
        set({
          token: null,
          user: null,
          status: 'unauthenticated',
          error: reason === 'expired' ? 'Session expired' : null,
        });
      },

      hydrate() {
        const { token, user } = get();
        if (token && isExpired(token)) {
          // Stale persisted token — clear and force login.
          set({ token: null, user: null, status: 'unauthenticated' });
        } else if (token && user) {
          set({ status: 'authenticated' });
        } else {
          set({ status: 'unauthenticated' });
        }
        set({ hydrated: true });
      },

      _onUnauthorized() {
        const { status } = get();
        if (status === 'authenticated') {
          get().logout('unauthorized');
        }
      },
    }),
    {
      name: STORAGE_KEYS.auth,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ token: s.token, user: s.user }),
      onRehydrateStorage: () => (state) => {
        // After persist has loaded from disk, run our own hydration logic.
        state?.hydrate();
      },
    },
  ),
);

// Wire the store into the api wrapper so fetch() attaches the bearer token
// and so 401s trigger automatic logout. This is idempotent and safe to run
// once at module load.
setTokenProvider(() => useAuthStore.getState().token);
setUnauthorizedHandler(() => useAuthStore.getState()._onUnauthorized());

/** Convenience selectors. */
export const selectIsAuthed = (s: AuthState): boolean => s.status === 'authenticated';
export const selectUser = (s: AuthState): User | null => s.user;
export const selectToken = (s: AuthState): string | null => s.token;