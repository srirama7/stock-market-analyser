import { useChartStore } from '../../store/chartStore';
import { TIMEFRAMES, INDICATORS } from '../../utils/constants';

export default function ChartToolbar() {
  const { interval, setInterval, activeIndicators, toggleIndicator } = useChartStore();

  return (
    <div className="flex flex-wrap gap-3 items-center animate-fade-in-up" style={{ animationDelay: '100ms' }}>
      {/* Timeframe selector */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-medium">Timeframe</div>
        <div className="flex glass-card-subtle p-1 gap-0.5">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setInterval(tf.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                interval === tf.value
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Indicator toggles */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-medium">Indicators</div>
        <div className="flex flex-wrap gap-1.5">
          {INDICATORS.map((ind) => (
            <button
              key={ind.value}
              onClick={() => toggleIndicator(ind.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 border ${
                activeIndicators.includes(ind.value)
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/40 shadow-sm shadow-blue-500/10'
                  : 'bg-slate-800/30 text-slate-500 border-slate-700/40 hover:border-slate-600/60 hover:text-slate-300'
              }`}
            >
              {ind.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
