import type { PatternDetection } from '../../types';
import { DIRECTION_COLORS } from '../../utils/constants';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface Props {
  patterns: PatternDetection[];
}

export default function PatternOverlay({ patterns }: Props) {
  if (patterns.length === 0) return null;

  const getIcon = (direction: string) => {
    if (direction === 'BULLISH') return <ArrowUp className="w-3 h-3" />;
    if (direction === 'BEARISH') return <ArrowDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  // Show only recent high-confidence patterns
  const recent = patterns.slice(0, 10);

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-slate-200 mb-3">Detected Patterns</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {recent.map((p, i) => (
          <div
            key={`${p.pattern_name}-${p.time}-${i}`}
            className="flex items-start gap-2 p-2 bg-slate-900 rounded-lg"
          >
            <div
              className="mt-0.5 p-1 rounded"
              style={{ backgroundColor: DIRECTION_COLORS[p.direction] + '30', color: DIRECTION_COLORS[p.direction] }}
            >
              {getIcon(p.direction)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-200">{p.pattern_name}</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: DIRECTION_COLORS[p.direction] + '30', color: DIRECTION_COLORS[p.direction] }}
                >
                  {p.direction}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{p.description}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Confidence: {Math.round(p.confidence * 100)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
