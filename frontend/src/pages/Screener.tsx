import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getScreenerPresets, runScreener } from '../api/client';
import { formatCurrency, formatPercent, getChangeColor } from '../utils/formatters';
import { ScanSearch, Filter } from 'lucide-react';
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
      <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
        <ScanSearch className="w-5 h-5" /> Stock Screener
      </h1>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(presets).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => runPreset(key)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              activePreset === key
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
            }`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Custom Filters */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-200">Custom Filters</span>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Min RSI</label>
            <input
              type="number"
              value={customFilters.min_rsi}
              onChange={(e) => setCustomFilters({ ...customFilters, min_rsi: e.target.value })}
              placeholder="30"
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 w-20 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Max RSI</label>
            <input
              type="number"
              value={customFilters.max_rsi}
              onChange={(e) => setCustomFilters({ ...customFilters, max_rsi: e.target.value })}
              placeholder="70"
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 w-20 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Min PE</label>
            <input
              type="number"
              value={customFilters.min_pe}
              onChange={(e) => setCustomFilters({ ...customFilters, min_pe: e.target.value })}
              placeholder="5"
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 w-20 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Max PE</label>
            <input
              type="number"
              value={customFilters.max_pe}
              onChange={(e) => setCustomFilters({ ...customFilters, max_pe: e.target.value })}
              placeholder="20"
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 w-20 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={runCustom}
            className="px-4 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Run Screen
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">
            Results ({results.length})
          </h3>
        </div>
        {loading ? (
          <div className="text-center py-8 text-slate-400">Scanning...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-700">
                  <th className="text-left px-4 py-2">Symbol</th>
                  <th className="text-left px-4 py-2">Name</th>
                  <th className="text-right px-4 py-2">Price</th>
                  <th className="text-right px-4 py-2">Change</th>
                  <th className="text-right px-4 py-2">RSI</th>
                  <th className="text-left px-4 py-2">Filters</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr
                    key={r.symbol}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer"
                    onClick={() => navigate(`/chart?symbol=${r.symbol}`)}
                  >
                    <td className="px-4 py-2 font-medium text-slate-200">{r.symbol}</td>
                    <td className="px-4 py-2 text-slate-400 truncate max-w-[150px]">{r.name}</td>
                    <td className="px-4 py-2 text-right text-slate-200">{formatCurrency(r.last_price)}</td>
                    <td className={`px-4 py-2 text-right font-medium ${getChangeColor(r.day_change_pct)}`}>
                      {formatPercent(r.day_change_pct)}
                    </td>
                    <td className="px-4 py-2 text-right text-slate-300">{r.rsi ?? '-'}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {r.passed_filters?.map((f) => (
                          <span key={f} className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                            {f}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {results.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      Select a preset or run a custom screen to see results
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
