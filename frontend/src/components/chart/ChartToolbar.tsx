import { useChartStore } from '../../store/chartStore';
import { TIMEFRAMES, INDICATORS } from '../../utils/constants';

export default function ChartToolbar() {
  const { interval, setInterval, activeIndicators, toggleIndicator } = useChartStore();

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Timeframe selector */}
      <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => setInterval(tf.value)}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
              interval === tf.value
                ? 'bg-blue-500 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Indicator toggles */}
      <div className="flex flex-wrap gap-1">
        {INDICATORS.map((ind) => (
          <button
            key={ind.value}
            onClick={() => toggleIndicator(ind.value)}
            className={`px-2 py-1 text-xs rounded-md border transition-colors ${
              activeIndicators.includes(ind.value)
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
            }`}
          >
            {ind.label}
          </button>
        ))}
      </div>
    </div>
  );
}
