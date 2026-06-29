import {
  LayoutDashboard,
  Radar,
  History,
  BarChart3,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { to: ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.live, label: 'Live Detection', icon: Radar },
  { to: ROUTES.history, label: 'History', icon: History },
  { to: ROUTES.analytics, label: 'Analytics', icon: BarChart3 },
  { to: ROUTES.settings, label: 'Settings', icon: SettingsIcon },
];
