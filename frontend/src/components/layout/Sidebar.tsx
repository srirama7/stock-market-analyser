import { NavLink } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { navItems } from '../../utils/navConfig';

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-16 lg:w-56 bg-slate-900/50 backdrop-blur-md border-r border-slate-700/50 flex-col shrink-0">
      {/* Brand */}
      <div className="h-14 flex items-center px-3 lg:px-4 border-b border-slate-700/50">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <span className="ml-2.5 font-bold text-sm hidden lg:block gradient-text">
          StockAnalyzer AI
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `group flex items-center px-3 lg:px-4 py-2.5 mx-1.5 lg:mx-2 my-0.5 rounded-xl transition-all duration-200 relative ${
                isActive
                  ? 'bg-blue-500/15 text-blue-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 hover:translate-x-0.5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full" />
                )}
                <Icon className="w-5 h-5 shrink-0" />
                <span className="ml-3 text-sm font-medium hidden lg:block">{label}</span>
                {/* Tooltip on collapsed */}
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-slate-200 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none lg:hidden whitespace-nowrap z-50">
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
