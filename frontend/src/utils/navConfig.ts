import {
  LayoutDashboard, LineChart, Briefcase, ScanSearch, Newspaper,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

export const navItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/chart', icon: LineChart, label: 'Charts' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/screener', icon: ScanSearch, label: 'Screener' },
  { to: '/news', icon: Newspaper, label: 'News' },
];
