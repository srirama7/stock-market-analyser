import { useEffect, useState, useMemo } from 'react';
import {
  getPortfolios, createPortfolio, getPortfolioSummary,
  addHolding, deleteHolding
} from '../api/client';
import { usePriceSubscription } from '../hooks/useWebSocket';
import { useMarketStore } from '../store/marketStore';
import {
  formatCurrency, formatPercent, getChangeColor,
} from '../utils/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SECTOR_COLORS } from '../utils/constants';
import { Plus, Trash2 } from 'lucide-react';
import type { Portfolio as PortfolioType, PortfolioSummary } from '../types';

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioType | null>(null);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ symbol: '', quantity: '', price: '' });

  const holdingSymbols = useMemo(
    () => portfolio?.holdings?.map(h => h.symbol) || [],
    [portfolio]
  );
  usePriceSubscription(holdingSymbols);
  const prices = useMarketStore((s) => s.prices);

  useEffect(() => {
    loadPortfolio();
  }, []);

  async function loadPortfolio() {
    setLoading(true);
    try {
      let portfolios = await getPortfolios();
      if (portfolios.length === 0) {
        await createPortfolio('My Portfolio');
        portfolios = await getPortfolios();
      }
      setPortfolio(portfolios[0]);
      if (portfolios[0]) {
        const sum = await getPortfolioSummary(portfolios[0].id);
        setSummary(sum);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAddHolding(e: React.FormEvent) {
    e.preventDefault();
    if (!portfolio || !addForm.symbol || !addForm.quantity || !addForm.price) return;
    try {
      await addHolding(portfolio.id, {
        symbol: addForm.symbol.toUpperCase(),
        quantity: parseInt(addForm.quantity),
        avg_buy_price: parseFloat(addForm.price),
      });
      setAddForm({ symbol: '', quantity: '', price: '' });
      setShowAdd(false);
      await loadPortfolio();
    } catch (err) {
      console.error('Failed to add holding:', err);
    }
  }

  async function handleDelete(holdingId: number) {
    try {
      await deleteHolding(holdingId);
      await loadPortfolio();
    } catch (err) {
      console.error('Failed to delete holding:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-slate-400">Loading portfolio...</span>
      </div>
    );
  }

  const sectorData = summary?.sector_allocation
    ? Object.entries(summary.sector_allocation).map(([sector, pct]) => ({
        name: sector,
        value: pct,
        color: SECTOR_COLORS[sector] || '#64748b',
      }))
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-100">Portfolio</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" /> Add Holding
        </button>
      </div>

      {/* Add Holding Form */}
      {showAdd && (
        <form onSubmit={handleAddHolding} className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Symbol</label>
            <input
              value={addForm.symbol}
              onChange={(e) => setAddForm({ ...addForm, symbol: e.target.value })}
              placeholder="RELIANCE"
              className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 w-32"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Quantity</label>
            <input
              type="number"
              value={addForm.quantity}
              onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })}
              placeholder="10"
              className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 w-24"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Buy Price</label>
            <input
              type="number"
              step="0.01"
              value={addForm.price}
              onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
              placeholder="2500.00"
              className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 w-32"
            />
          </div>
          <button type="submit" className="px-4 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700">
            Add
          </button>
        </form>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-xs text-slate-400">Total Invested</div>
            <div className="text-lg font-bold text-slate-100">{formatCurrency(summary.total_invested)}</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-xs text-slate-400">Current Value</div>
            <div className="text-lg font-bold text-slate-100">{formatCurrency(summary.current_value)}</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-xs text-slate-400">Total P&L</div>
            <div className={`text-lg font-bold ${getChangeColor(summary.total_pnl)}`}>
              {formatCurrency(summary.total_pnl)} ({formatPercent(summary.total_pnl_pct)})
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-xs text-slate-400">Day Change</div>
            <div className={`text-lg font-bold ${getChangeColor(summary.day_change)}`}>
              {formatCurrency(summary.day_change)} ({formatPercent(summary.day_change_pct)})
            </div>
          </div>
        </div>
      )}

      {/* Holdings + Sector Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Holdings Table */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700">
          <div className="px-4 py-3 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-slate-200">
              Holdings ({portfolio?.holdings?.length || 0})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-700">
                  <th className="text-left px-4 py-2">Symbol</th>
                  <th className="text-right px-4 py-2">Qty</th>
                  <th className="text-right px-4 py-2">Avg Price</th>
                  <th className="text-right px-4 py-2">LTP</th>
                  <th className="text-right px-4 py-2">P&L</th>
                  <th className="text-right px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {portfolio?.holdings?.map((h) => {
                  const liveP = prices[h.symbol]?.last_price || h.current_price || h.avg_buy_price;
                  const invested = h.avg_buy_price * h.quantity;
                  const current = liveP * h.quantity;
                  const pnl = current - invested;
                  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
                  return (
                    <tr key={h.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="px-4 py-2 font-medium text-slate-200">{h.symbol}</td>
                      <td className="px-4 py-2 text-right text-slate-300">{h.quantity}</td>
                      <td className="px-4 py-2 text-right text-slate-300">{formatCurrency(h.avg_buy_price)}</td>
                      <td className="px-4 py-2 text-right text-slate-200">{formatCurrency(liveP)}</td>
                      <td className={`px-4 py-2 text-right font-medium ${getChangeColor(pnl)}`}>
                        {formatCurrency(pnl)}
                        <span className="text-xs ml-1">({formatPercent(pnlPct)})</span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => handleDelete(h.id)}
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {(!portfolio?.holdings || portfolio.holdings.length === 0) && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      No holdings yet. Add your first stock above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sector Allocation */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Sector Allocation</h3>
          {sectorData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={sectorData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    stroke="none"
                  >
                    {sectorData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {sectorData.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-slate-300">{s.name}</span>
                    </div>
                    <span className="text-slate-400">{s.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-sm text-slate-500">
              Add holdings to see allocation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
