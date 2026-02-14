import { useNavigate } from 'react-router-dom';
import type { GainerLoser } from '../../types';
import { formatCurrency, formatPercent, getChangeColor } from '../../utils/formatters';

interface Props {
  title: string;
  data: GainerLoser[];
}

export default function GainersLosersTable({ title, data }: Props) {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700">
      <div className="px-4 py-3 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      </div>
      <div className="divide-y divide-slate-700/50">
        {data.map((stock) => {
          const change = stock.day_change_pct ?? stock.change_pct ?? 0;
          return (
            <button
              key={stock.symbol}
              onClick={() => navigate(`/chart?symbol=${stock.symbol}`)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-700/50 transition-colors"
            >
              <div className="text-left">
                <div className="text-sm font-medium text-slate-200">{stock.symbol}</div>
                <div className="text-xs text-slate-400 truncate max-w-[120px]">{stock.name}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-200">
                  {formatCurrency(stock.last_price)}
                </div>
                <div className={`text-xs font-medium ${getChangeColor(change)}`}>
                  {formatPercent(change)}
                </div>
              </div>
            </button>
          );
        })}
        {data.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-slate-500">Loading...</div>
        )}
      </div>
    </div>
  );
}
