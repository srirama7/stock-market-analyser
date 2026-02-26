import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getScreenerPresets, runScreener } from '../api/client';
import { formatCurrency, formatPercent, getChangeColor } from '../utils/formatters';
import { ScanSearch, Filter, Zap } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import type { ScreenerResult } from '../types';

interface Preset {
  name: string;
  description: string;
  filters: Record<string, unknown>;
}

export default function Screener() {
  const [presets, setPresets] = useState<Record<string, Preset>>({});
  const [results, setResults] = useState<ScreenerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [customFilters, setCustomFilters] = useState({
    min_rsi: '',
    max_rsi: '',
    min_pe: '',
    max_pe: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    getScreenerPresets().then(setPresets).catch(console.error);
  }, []);

  async function runPreset(key: string) {
    setLoading(true);
    setActivePreset(key);
    try {
      const data = await runScreener({ preset: key });
      setResults(data);
    } finally {
      setLoading(false);
    }
  }

  async function runCustom() {
    setLoading(true);
    setActivePreset(null);
    try {
      const params: Record<string, string | number> = {};
      if (customFilters.min_rsi) params.min_rsi = parseFloat(customFilters.min_rsi);
      if (customFilters.max_rsi) params.max_rsi = parseFloat(customFilters.max_rsi);
      if (customFilters.min_pe) params.min_pe = parseFloat(customFilters.min_pe);
      if (customFilters.max_pe) params.max_pe = parseFloat(customFilters.max_pe);
      const data = await runScreener(params);
      setResults(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold gradient-text animate-fade-in-up flex items-center gap-2">
        <ScanSearch className="w-6 h-6 text-blue-400" /> Stock Screener
      </h1>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2 animate-fade-in-up" style={{ animationDelay: '60ms' }}>
        {Object.entries(presets).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => runPreset(key)}
            className={`px-4 py-2 text-sm font-medium rounded-full border transition-all duration-200 ${
              activePreset === key
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent shadow-lg shadow-blue-500/20'
                : 'glass-card-subtle text-slate-300 hover:text-white hover:border-slate-500/60'
            }`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Custom Filters */}
      <GlassCard accent="blue" className="p-4" delay={120}>
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-200">Custom Filters</span>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          {[
            { key: 'min_rsi', label: 'Min RSI', placeholder: '30' },
            { key: 'max_rsi', label: 'Max RSI', placeholder: '70' },
            { key: 'min_pe', label: 'Min PE', placeholder: '5' },
            { key: 'max_pe', label: 'Max PE', placeholder: '20' },
          ].map((field) => (
            <div key={field.key}>
              <label className="text-xs text-slate-400 block mb-1.5 font-medium">{field.label}</label>
              <input
                type="number"
                value={customFilters[field.key as keyof typeof customFilters]}
                onChange={(e) => setCustomFilters({ ...customFilters, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                className="glass-input px-3 py-2 text-sm text-slate-200 w-20 focus:glass-input-focus focus:outline-none"
              />
            </div>
          ))}
          <button
            onClick={runCustom}
            className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all"
          >
            <Zap className="w-3.5 h-3.5" /> Run Screen
          </button>
        </div>
      </GlassCard>

      {/* Results */}
      <GlassCard accent="purple" className="overflow-hidden" delay={180}>
        <div className="px-4 py-3 border-b border-slate-700/30 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">
            Results ({results.length})
          </h3>
        </div>
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
            <div className="text-sm text-slate-500 mt-2">Scanning stocks...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-700/30">
                  <th className="text-left px-4 py-2.5">Symbol</th>
                  <th className="text-left px-4 py-2.5">Name</th>
                  <th className="text-right px-4 py-2.5">Price</th>
                  <th className="text-right px-4 py-2.5">Change</th>
                  <th className="text-center px-4 py-2.5 whitespace-nowrap">RSI</th>
                  <th className="text-center px-4 py-2.5 whitespace-nowrap">Filters</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr
                    key={r.symbol}
                    className={`border-b border-slate-700/20 hover:bg-slate-700/15 cursor-pointer transition-colors animate-fade-in-up ${
                      i % 2 === 0 ? 'bg-slate-800/10' : ''
                    }`}
                    style={{ animationDelay: `${i * 30}ms` }}
                    onClick={() => navigate(`/chart?symbol=${r.symbol}`)}
                  >
                    <td className="px-4 py-2.5 font-medium text-slate-200">{r.symbol}</td>
                    <td className="px-4 py-2.5 text-slate-400 truncate max-w-[150px]">{r.name}</td>
                    <td className="px-4 py-2.5 text-right text-slate-200">{formatCurrency(r.last_price)}</td>
                    <td className={`px-4 py-2.5 text-right font-semibold ${getChangeColor(r.day_change_pct)}`}>
                      {formatPercent(r.day_change_pct)}
                    </td>
                    <td className="px-4 py-2.5 text-center text-slate-300">{r.rsi ?? '-'}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {r.passed_filters?.map((f) => (
                          <span
                            key={f}
                            className="text-[10px] bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {results.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <ScanSearch className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                      <div className="text-sm text-slate-500">Select a preset or run a custom screen</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
