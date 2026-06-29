import { Menu } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { UserMenu } from './UserMenu';
import { useUIStore } from '@/stores/uiStore';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export function Navbar() {
  const toggle = useUIStore((s) => s.toggleSidebar);
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <header className="clay sticky top-0 z-20 flex h-16 items-center justify-between rounded-none border-b px-4 md:px-6">
      <div className="flex items-center gap-3">
        {isMobile ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Toggle sidebar"
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        ) : null}
        <div className="md:hidden">
          <Logo />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <UserMenu />
      </div>
    </header>
  );
}