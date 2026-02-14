import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, LineChart, Briefcase, ScanSearch,
  Newspaper, TrendingUp
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/chart', icon: LineChart, label: 'Charts' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/screener', icon: ScanSearch, label: 'Screener' },
  { to: '/news', icon: Newspaper, label: 'News' },
];

export default function Sidebar() {
  return (
    <aside className="w-16 lg:w-56 bg-slate-900 border-r border-slate-700 flex flex-col shrink-0">
      <div className="h-14 flex items-center px-3 lg:px-4 border-b border-slate-700">
        <TrendingUp className="w-6 h-6 text-blue-400 shrink-0" />
        <span className="ml-2 font-bold text-sm hidden lg:block text-blue-400">
          StockAnalyzer AI
        </span>
      </div>
      <nav className="flex-1 py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center px-3 lg:px-4 py-2.5 mx-1 lg:mx-2 my-0.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="ml-3 text-sm hidden lg:block">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
