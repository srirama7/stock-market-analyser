import { useNavigate } from 'react-router-dom';
import type { GainerLoser } from '../../types';
import { formatCurrency, formatPercent, getChangeColor } from '../../utils/formatters';
import GlassCard from '../ui/GlassCard';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  title: string;
  data: GainerLoser[];
  type?: 'gainer' | 'loser';
}

export default function GainersLosersTable({ title, data, type = 'gainer' }: Props) {
  const navigate = useNavigate();
  const accent = type === 'gainer' ? 'green' : 'red';
  const Icon = type === 'gainer' ? TrendingUp : TrendingDown;

  return (
    <GlassCard accent={accent} className="overflow-hidden" delay={type === 'gainer' ? 400 : 460}>
      <div className="px-4 py-3 border-b border-slate-700/30 flex items-center gap-2">
        <Icon className={`w-4 h-4 ${type === 'gainer' ? 'text-green-400' : 'text-red-400'}`} />
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      </div>
      <div className="divide-y divide-slate-700/20">
        {data.map((stock, i) => {
          const change = stock.day_change_pct ?? stock.change_pct ?? 0;
          return (
            <button
              key={stock.symbol}
              onClick={() => navigate(`/chart?symbol=${stock.symbol}`)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-700/20 transition-all duration-200 group animate-fade-in-up"
              style={{ animationDelay: `${500 + i * 50}ms` }}
            >
              <div className="text-left flex items-center gap-2.5">
                <div className={`w-1.5 h-1.5 rounded-full ${type === 'gainer' ? 'bg-green-400' : 'bg-red-400'}`} />
                <div>
                  <div className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                    {stock.symbol}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate max-w-[120px]">{stock.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-300">{formatCurrency(stock.last_price)}</div>
                <div className={`text-xs font-semibold ${getChangeColor(change)}`}>
                  {formatPercent(change)}
                </div>
              </div>
            </button>
          );
        })}
        {data.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-slate-600">
            No data available
          </div>
        )}
      </div>
    </GlassCard>
  );
}
