import type { SectorPerformance } from '../../types';
import { formatPercent } from '../../utils/formatters';
import GlassCard from '../ui/GlassCard';

interface Props {
  sectors: SectorPerformance[];
}

export default function SectorHeatmap({ sectors }: Props) {
  const getHeatGradient = (change: number) => {
    if (change > 2) return 'from-green-600 to-emerald-700';
    if (change > 1) return 'from-green-700 to-green-800';
    if (change > 0.5) return 'from-green-800 to-green-900';
    if (change > 0) return 'from-green-900/80 to-green-950/60';
    if (change > -0.5) return 'from-red-900/60 to-red-950/80';
    if (change > -1) return 'from-red-800 to-red-900';
    if (change > -2) return 'from-red-700 to-red-800';
    return 'from-red-600 to-rose-700';
  };

  return (
    <GlassCard accent="purple" className="overflow-hidden" delay={520}>
      <div className="px-4 py-3 border-b border-slate-700/30">
        <h3 className="text-sm font-semibold text-slate-200">Sector Performance</h3>
      </div>
      <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2">
        {sectors.map((sector, i) => (
          <div
            key={sector.sector}
            className={`bg-gradient-to-br ${getHeatGradient(sector.change_pct)} rounded-xl p-3 text-center
              transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-default
              animate-fade-in-up`}
            style={{ animationDelay: `${550 + i * 40}ms` }}
          >
            <div className="text-[11px] font-medium text-white/80 truncate">{sector.sector}</div>
            <div className="text-sm font-bold text-white mt-1">
              {formatPercent(sector.change_pct)}
            </div>
            {sector.top_stock && (
              <div className="text-[9px] text-white/50 mt-0.5 truncate">{sector.top_stock}</div>
            )}
          </div>
        ))}
        {sectors.length === 0 && (
          <div className="col-span-full text-center py-8 text-sm text-slate-600">
            No sector data
          </div>
        )}
      </div>
    </GlassCard>
  );
}
