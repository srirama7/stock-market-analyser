import type { MarketBreadth } from '../../types';
import GlassCard from '../ui/GlassCard';

interface Props {
  breadth: MarketBreadth;
}

export default function MarketBreadthBar({ breadth }: Props) {
  const total = breadth.advances + breadth.declines + breadth.unchanged;
  if (total === 0) return null;

  const advPct = (breadth.advances / total) * 100;
  const unchPct = (breadth.unchanged / total) * 100;
  const decPct = (breadth.declines / total) * 100;

  return (
    <GlassCard accent="blue" className="p-4" delay={300}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-300">Market Breadth</span>
        <span className="text-xs text-slate-500">{total} stocks</span>
      </div>
      <div className="flex rounded-full h-3.5 overflow-hidden bg-slate-800/60 gap-0.5">
        <div
          className="bg-gradient-to-r from-green-500 to-emerald-400 rounded-l-full transition-all duration-700 relative"
          style={{ width: `${advPct}%` }}
        >
          {advPct > 15 && (
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/90">
              {advPct.toFixed(0)}%
            </span>
          )}
        </div>
        <div
          className="bg-slate-600/60 transition-all duration-700 relative"
          style={{ width: `${unchPct}%` }}
        />
        <div
          className="bg-gradient-to-r from-rose-400 to-red-500 rounded-r-full transition-all duration-700 relative"
          style={{ width: `${decPct}%` }}
        >
          {decPct > 15 && (
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/90">
              {decPct.toFixed(0)}%
            </span>
          )}
        </div>
      </div>
      <div className="flex justify-between mt-2.5 text-xs">
        <span className="flex items-center gap-1.5 text-green-400">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          {breadth.advances} Advances
        </span>
        <span className="flex items-center gap-1.5 text-slate-400">
          <span className="w-2 h-2 rounded-full bg-slate-500" />
          {breadth.unchanged} Unchanged
        </span>
        <span className="flex items-center gap-1.5 text-red-400">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          {breadth.declines} Declines
        </span>
      </div>
    </GlassCard>
  );
}
