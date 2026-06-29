import { LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { initials } from '@/utils/format';

export function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="clay-inset flex items-center gap-3 rounded-xl px-2.5 py-1.5 text-sm transition-colors hover:bg-[color:var(--color-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)]"
        aria-label="Account menu"
      >
        <Avatar className="h-7 w-7">
          <AvatarFallback>{initials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="hidden flex-col items-start leading-tight md:flex">
          <span className="text-xs font-semibold text-[color:var(--color-foreground)]">
            {user.name}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted-foreground)]">
            {user.role}
          </span>
        </div>
        <ChevronDown className="hidden h-3.5 w-3.5 text-[color:var(--color-muted-foreground)] md:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate(ROUTES.settings)}>
          <UserIcon className="h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            logout('manual');
            navigate(ROUTES.login, { replace: true });
          }}
          className="text-[color:var(--color-destructive)] focus:text-[color:var(--color-destructive)]"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}