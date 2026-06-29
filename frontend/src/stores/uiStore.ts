/**
 * UI store — sidebar collapse, theme, etc.
 *
 * Persisted to localStorage. Theme is wired into globals.css via a `data-theme`
 * attribute on <html>; the html element starts with `.dark` so dark is the
 * default and we don't need a class toggle here in v1.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/constants/storage-keys';

type Theme = 'dark' | 'light';

interface UIState {
  sidebarCollapsed: boolean;
  theme: Theme;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: Theme) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'dark',
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: STORAGE_KEYS.ui,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);