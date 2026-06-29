import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { NAV_ITEMS } from './NavItems';
import { useUIStore } from '@/stores/uiStore';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/utils/cn';
import { Logo } from '@/components/common/Logo';

export function MobileSidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const location = useLocation();

  const open = isMobile && !collapsed;

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggle}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          />
          <motion.aside
            key="drawer"
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="clay fixed inset-y-0 left-0 z-50 flex w-64 flex-col rounded-r-2xl border-r md:hidden"
          >
            <div className="flex items-center justify-between px-4 py-4">
              <Logo />
              <button
                type="button"
                onClick={toggle}
                className="rounded-md p-1.5 text-[color:var(--color-muted-foreground)] hover:bg-[color:var(--color-muted)]/40 hover:text-[color:var(--color-foreground)]"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-1.5 px-3">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active =
                  location.pathname === item.to ||
                  (item.to !== '/' && location.pathname.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={toggle}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                      active
                        ? 'bg-[color:var(--color-primary)]/20 text-[color:var(--color-foreground)]'
                        : 'text-[color:var(--color-muted-foreground)] hover:bg-[color:var(--color-muted)]/40 hover:text-[color:var(--color-foreground)]',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}