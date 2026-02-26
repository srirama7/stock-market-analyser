import { useEffect, useState, useMemo } from 'react';
import {
  getPortfolios, createPortfolio, getPortfolioSummary,
  addHolding, deleteHolding
} from '../api/client';
import { usePriceSubscription } from '../hooks/useWebSocket';
import { useMarketStore } from '../store/marketStore';
import { formatCurrency, formatPercent, getChangeColor } from '../utils/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SECTOR_COLORS } from '../utils/constants';
import { Plus, Trash2, Wallet, TrendingUp, BarChart3, Activity } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import type { Portfolio as PortfolioType, PortfolioSummary } from '../types';

const summaryCards = [
  { key: 'invested', label: 'Total Invested', icon: Wallet, glow: 'glow-blue' },
  { key: 'value', label: 'Current Value', icon: TrendingUp, glow: 'glow-blue' },
  { key: 'pnl', label: 'Total P&L', icon: BarChart3, glow: '' },
  { key: 'day', label: 'Day Change', icon: Activity, glow: '' },
] as const;

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
      <div className="space-y-4">
        <div className="skeleton h-8 w-40 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SkeletonLoader variant="card" count={4} />
        </div>
        <SkeletonLoader variant="card" count={1} className="h-64" />
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

  const getSummaryValue = (key: string) => {
    if (!summary) return { value: 0, pct: 0 };
    switch (key) {
      case 'invested': return { value: summary.total_invested, pct: 0 };
      case 'value': return { value: summary.current_value, pct: 0 };
      case 'pnl': return { value: summary.total_pnl, pct: summary.total_pnl_pct };
      case 'day': return { value: summary.day_change, pct: summary.day_change_pct };
      default: return { value: 0, pct: 0 };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold gradient-text animate-fade-in-up">Portfolio</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200 animate-fade-in-up"
        >
          <Plus className="w-4 h-4" /> Add Holding
        </button>
      </div>

      {/* Add Holding Form */}
      {showAdd && (
        <GlassCard accent="blue" className="p-4">
          <form onSubmit={handleAddHolding} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-medium">Symbol</label>
              <input
                value={addForm.symbol}
                onChange={(e) => setAddForm({ ...addForm, symbol: e.target.value })}
                placeholder="RELIANCE"
                className="glass-input px-3 py-2 text-sm text-slate-200 focus:glass-input-focus focus:outline-none w-32"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-medium">Quantity</label>
              <input
                type="number"
                value={addForm.quantity}
                onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })}
                placeholder="10"
                className="glass-input px-3 py-2 text-sm text-slate-200 focus:glass-input-focus focus:outline-none w-24"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-medium">Buy Price</label>
              <input
                type="number"
                step="0.01"
                value={addForm.price}
                onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                placeholder="2500.00"
                className="glass-input px-3 py-2 text-sm text-slate-200 focus:glass-input-focus focus:outline-none w-32"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-green-500/20 transition-all"
            >
              Add
            </button>
          </form>
        </GlassCard>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {summaryCards.map((card, i) => {
            const { value, pct } = getSummaryValue(card.key);
            const hasPct = card.key === 'pnl' || card.key === 'day';
            const Icon = card.icon;
            const glowClass = hasPct ? (value >= 0 ? 'glow-green' : 'glow-red') : card.glow;
            return (
              <GlassCard
                key={card.key}
                accent={hasPct ? (value >= 0 ? 'green' : 'red') : 'blue'}
                delay={i * 60}
                className={`p-4 ${glowClass}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400 font-medium">{card.label}</span>
                </div>
                <div className={`text-lg font-bold ${hasPct ? getChangeColor(value) : 'text-slate-100'}`}>
                  <AnimatedNumber value={value} format={(n) => formatCurrency(n)} />
                </div>
                {hasPct && (
                  <div className={`text-xs font-medium mt-0.5 ${getChangeColor(value)}`}>
                    {formatPercent(pct)}
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Holdings + Sector Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Holdings Table */}
        <GlassCard accent="blue" className="lg:col-span-2 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700/30">
            <h3 className="text-sm font-semibold text-slate-200">
              Holdings ({portfolio?.holdings?.length || 0})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-700/30">
                  <th className="text-left px-4 py-2.5">Symbol</th>
                  <th className="text-right px-4 py-2.5">Qty</th>
                  <th className="text-right px-4 py-2.5">Avg Price</th>
                  <th className="text-right px-4 py-2.5">LTP</th>
                  <th className="text-right px-4 py-2.5">P&L</th>
                  <th className="text-right px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {portfolio?.holdings?.map((h, i) => {
                  const liveP = prices[h.symbol]?.last_price || h.current_price || h.avg_buy_price;
                  const invested = h.avg_buy_price * h.quantity;
                  const current = liveP * h.quantity;
                  const pnl = current - invested;
                  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
                  return (
                    <tr
                      key={h.id}
                      className={`border-b border-slate-700/20 hover:bg-slate-700/15 transition-colors ${
                        i % 2 === 0 ? 'bg-slate-800/10' : ''
                      }`}
                    >
                      <td className="px-4 py-2.5 font-medium text-slate-200">{h.symbol}</td>
                      <td className="px-4 py-2.5 text-right text-slate-300">{h.quantity}</td>
                      <td className="px-4 py-2.5 text-right text-slate-400">{formatCurrency(h.avg_buy_price)}</td>
                      <td className="px-4 py-2.5 text-right text-slate-200 font-medium">{formatCurrency(liveP)}</td>
                      <td className={`px-4 py-2.5 text-right font-semibold ${getChangeColor(pnl)}`}>
                        {formatCurrency(pnl)}
                        <span className="text-xs ml-1 opacity-70">({formatPercent(pnlPct)})</span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => handleDelete(h.id)}
                          className="text-slate-600 hover:text-red-400 p-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {(!portfolio?.holdings || portfolio.holdings.length === 0) && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-600">
                      No holdings yet. Add your first stock above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Sector Allocation */}
        <GlassCard accent="purple" className="p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Sector Allocation</h3>
          {sectorData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={sectorData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    stroke="none"
                  >
                    {sectorData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.8)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(51, 65, 85, 0.4)',
                      borderRadius: 12,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3">
                {sectorData.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-slate-300">{s.name}</span>
                    </div>
                    <span className="text-slate-400 font-medium">{s.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-sm text-slate-600">
              Add holdings to see allocation
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
