import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { NAV_ITEMS } from './NavItems';
import { useUIStore } from '@/stores/uiStore';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);
  const location = useLocation();
  const reduced = useReducedMotion();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 240 }}
      transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 240, damping: 28 }}
      className="clay sticky top-0 z-30 hidden h-screen shrink-0 flex-col items-stretch rounded-none border-r md:flex"
    >
      <nav className="flex-1 space-y-1.5 px-3 py-6">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            location.pathname === item.to ||
            (item.to !== '/' && location.pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-gradient-to-r from-[color:var(--color-primary)]/20 to-[color:var(--color-accent)]/10 text-[color:var(--color-foreground)] shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--color-primary)_30%,transparent)]'
                  : 'text-[color:var(--color-muted-foreground)] hover:bg-[color:var(--color-muted)]/40 hover:text-[color:var(--color-foreground)]',
              )}
            >
              {active ? (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-[color:var(--color-primary)]"
                  transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 30 }}
                />
              ) : null}
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={toggle}
        className="clay-inset mx-3 mb-4 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs text-[color:var(--color-muted-foreground)] transition-colors hover:text-[color:var(--color-foreground)]"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <>
            <ChevronLeft className="h-4 w-4" />
            <span>Collapse</span>
          </>
        )}
      </button>
    </motion.aside>
  );
}