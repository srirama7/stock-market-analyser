import type { PatternDetection } from '../../types';
import { DIRECTION_COLORS } from '../../utils/constants';
import { ArrowUp, ArrowDown, Minus, Sparkles } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

interface Props {
  patterns: PatternDetection[];
}

export default function PatternOverlay({ patterns }: Props) {
  const getIcon = (direction: string) => {
    if (direction === 'BULLISH') return <ArrowUp className="w-3 h-3" />;
    if (direction === 'BEARISH') return <ArrowDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const recent = patterns.slice(0, 10);

  return (
    <GlassCard accent="purple" className="overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/30 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-slate-200">Detected Patterns</h3>
        {patterns.length > 0 && (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20">
            {patterns.length}
          </span>
        )}
      </div>

      {recent.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <Sparkles className="w-8 h-8 text-slate-700 mx-auto mb-2" />
          <div className="text-sm text-slate-500">No patterns detected</div>
          <div className="text-xs text-slate-600 mt-1">Try a different timeframe</div>
        </div>
      ) : (
        <div className="p-3 space-y-2 max-h-[420px] overflow-y-auto">
          {recent.map((p, i) => {
            const color = DIRECTION_COLORS[p.direction] || '#94a3b8';
            const confidence = Math.round(p.confidence * 100);
            return (
              <div
                key={`${p.pattern_name}-${p.time}-${i}`}
                className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/20 animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="p-1 rounded-lg"
                    style={{ backgroundColor: color + '20', color }}
                  >
                    {getIcon(p.direction)}
                  </div>
                  <span className="text-sm font-medium text-slate-200 flex-1">{p.pattern_name}</span>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ backgroundColor: color + '20', color }}
                  >
                    {p.direction}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mb-2">{p.description}</div>
                {/* Confidence bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-700/40 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${confidence}%`,
                        background: `linear-gradient(90deg, ${color}80, ${color})`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">{confidence}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
