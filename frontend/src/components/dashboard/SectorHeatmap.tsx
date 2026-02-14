import type { SectorPerformance } from '../../types';
import { formatPercent } from '../../utils/formatters';

interface Props {
  sectors: SectorPerformance[];
}

export default function SectorHeatmap({ sectors }: Props) {
  const getHeatColor = (change: number) => {
    if (change > 2) return 'bg-green-600';
    if (change > 1) return 'bg-green-700';
    if (change > 0.5) return 'bg-green-800';
    if (change > 0) return 'bg-green-900';
    if (change > -0.5) return 'bg-red-900';
    if (change > -1) return 'bg-red-800';
    if (change > -2) return 'bg-red-700';
    return 'bg-red-600';
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700">
      <div className="px-4 py-3 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-slate-200">Sector Performance</h3>
      </div>
      <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {sectors.map((sector) => (
          <div
            key={sector.sector}
            className={`${getHeatColor(sector.change_pct)} rounded-lg p-3 text-center transition-colors`}
          >
            <div className="text-xs font-medium text-white/90 truncate">{sector.sector}</div>
            <div className="text-sm font-bold text-white mt-1">
              {formatPercent(sector.change_pct)}
            </div>
            {sector.top_stock && (
              <div className="text-[10px] text-white/60 mt-0.5">{sector.top_stock}</div>
            )}
          </div>
        ))}
        {sectors.length === 0 && (
          <div className="col-span-full text-center py-6 text-sm text-slate-500">Loading sectors...</div>
        )}
      </div>
    </div>
  );
}
