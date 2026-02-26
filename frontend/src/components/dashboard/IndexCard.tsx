import type { IndexData } from '../../types';
import { formatNumber, formatPercent, getChangeColor } from '../../utils/formatters';
import { ChevronUp, ChevronDown } from 'lucide-react';
import AnimatedNumber from '../ui/AnimatedNumber';
import GlassCard from '../ui/GlassCard';

interface Props {
  index: IndexData;
  delay?: number;
}

export default function IndexCard({ index, delay = 0 }: Props) {
  const isPositive = index.change >= 0;
  const accent = isPositive ? 'green' : 'red';

  return (
    <GlassCard accent={accent} delay={delay} className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium text-slate-400 tracking-wide uppercase">
          {index.name}
        </div>
        <div className={`flex items-center gap-0.5 text-xs font-semibold ${getChangeColor(index.change)}`}>
          {isPositive ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {formatPercent(index.change_pct)}
        </div>
      </div>
      <div className="text-xl font-bold text-slate-100">
        <AnimatedNumber value={index.value} format={(n) => formatNumber(n)} />
      </div>
      <div className={`text-xs font-medium mt-1.5 ${getChangeColor(index.change)}`}>
        {isPositive ? '+' : ''}{formatNumber(index.change)}
      </div>
      {/* Mini range bar */}
      {index.high && index.low && (
        <div className="mt-2.5">
          <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
            <span>{formatNumber(index.low)}</span>
            <span>{formatNumber(index.high)}</span>
          </div>
          <div className="h-1 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${isPositive ? 'bg-green-500/60' : 'bg-red-500/60'}`}
              style={{
                width: index.high !== index.low
                  ? `${((index.value - index.low) / (index.high - index.low)) * 100}%`
                  : '50%',
              }}
            />
          </div>
        </div>
      )}
    </GlassCard>
  );
}
