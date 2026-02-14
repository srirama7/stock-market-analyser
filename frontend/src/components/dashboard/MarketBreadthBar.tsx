import type { MarketBreadth } from '../../types';

interface Props {
  breadth: MarketBreadth;
}

export default function MarketBreadthBar({ breadth }: Props) {
  const total = breadth.advances + breadth.declines + breadth.unchanged;
  if (total === 0) return null;

  const advPct = (breadth.advances / total) * 100;
  const decPct = (breadth.declines / total) * 100;

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div className="text-sm text-slate-400 mb-3">Market Breadth</div>
      <div className="flex rounded-full h-3 overflow-hidden bg-slate-700">
        <div
          className="bg-green-500 transition-all"
          style={{ width: `${advPct}%` }}
        />
        <div
          className="bg-slate-500 transition-all"
          style={{ width: `${100 - advPct - decPct}%` }}
        />
        <div
          className="bg-red-500 transition-all"
          style={{ width: `${decPct}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs">
        <span className="text-green-400">
          {breadth.advances} Advances
        </span>
        <span className="text-slate-400">
          {breadth.unchanged} Unchanged
        </span>
        <span className="text-red-400">
          {breadth.declines} Declines
        </span>
      </div>
    </div>
  );
}
