import type { IndexData } from '../../types';
import { formatNumber, formatPercent, getChangeColor } from '../../utils/formatters';

interface Props {
  index: IndexData;
}

export default function IndexCard({ index }: Props) {
  const colorClass = getChangeColor(index.change);

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-colors">
      <div className="text-sm text-slate-400 mb-1">{index.name}</div>
      <div className="text-xl font-bold text-slate-100">
        {formatNumber(index.value)}
      </div>
      <div className={`text-sm font-medium mt-1 ${colorClass}`}>
        {index.change >= 0 ? '+' : ''}{formatNumber(index.change)} ({formatPercent(index.change_pct)})
      </div>
    </div>
  );
}
