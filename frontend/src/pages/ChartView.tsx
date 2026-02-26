import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChartStore } from '../store/chartStore';
import { getChartData, getStockQuote, getPatterns } from '../api/client';
import { usePriceSubscription } from '../hooks/useWebSocket';
import { useMarketStore } from '../store/marketStore';
import CandlestickChart from '../components/chart/CandlestickChart';
import ChartToolbar from '../components/chart/ChartToolbar';
import PatternOverlay from '../components/chart/PatternOverlay';
import GlassCard from '../components/ui/GlassCard';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import { formatCurrency, formatPercent, formatNumber, formatLargeNumber, getChangeColor } from '../utils/formatters';
import type { Candle, PatternDetection, StockQuote } from '../types';

export default function ChartView() {
  const [searchParams] = useSearchParams();
  const { symbol, setSymbol, interval, activeIndicators } = useChartStore();
  const [candles, setCandles] = useState<Candle[]>([]);
  const [indicators, setIndicators] = useState<Record<string, unknown>>({});
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [patterns, setPatterns] = useState<PatternDetection[]>([]);
  const [loading, setLoading] = useState(true);

  const symbolsToSubscribe = useMemo(() => [symbol], [symbol]);
  usePriceSubscription(symbolsToSubscribe);
  const livePrice = useMarketStore((s) => s.prices[symbol]);

  useEffect(() => {
    const urlSymbol = searchParams.get('symbol');
    if (urlSymbol) setSymbol(urlSymbol.toUpperCase());
  }, [searchParams, setSymbol]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const indicatorStr = activeIndicators.length > 0 ? activeIndicators.join(',') : undefined;
        const [chartResult, quoteResult, patternsResult] = await Promise.allSettled([
          getChartData(symbol, interval, indicatorStr),
          getStockQuote(symbol),
          getPatterns(symbol, interval === '1d' ? '1d' : interval),
        ]);

        if (chartResult.status === 'fulfilled' && chartResult.value) {
          setCandles(chartResult.value.candles || []);
          setIndicators(chartResult.value.indicators || {});
        }
        if (quoteResult.status === 'fulfilled') setQuote(quoteResult.value);
        if (patternsResult.status === 'fulfilled') setPatterns(patternsResult.value);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [symbol, interval, activeIndicators]);

  const displayPrice = livePrice?.last_price || quote?.last_price || 0;
  const displayChange = livePrice?.day_change ?? quote?.day_change ?? 0;
  const displayChangePct = livePrice?.day_change_pct ?? quote?.day_change_pct ?? 0;
  const isPositive = displayChange >= 0;

  return (
    <div className="space-y-3">
      {/* Stock Header */}
      <GlassCard accent={isPositive ? 'green' : 'red'} className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-100">{symbol}</h1>
            <span className="text-sm text-slate-400">{quote?.name || symbol}</span>
          </div>
          <div className="text-right">
            <div className="text-3xl sm:text-4xl font-black text-slate-100">
              <AnimatedNumber value={displayPrice} format={(n) => formatCurrency(n)} />
            </div>
            <div className={`text-sm font-semibold mt-0.5 ${getChangeColor(displayChange)}`}>
              {isPositive ? '+' : ''}{formatNumber(displayChange)} ({formatPercent(displayChangePct)})
            </div>
          </div>
        </div>

        {/* Quote Details as pill badges */}
        {quote && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {[
              { label: 'Open', value: formatCurrency(quote.open) },
              { label: 'High', value: formatCurrency(quote.high) },
              { label: 'Low', value: formatCurrency(quote.low) },
              { label: 'Vol', value: formatLargeNumber(quote.volume) },
              ...(quote.week_52_high ? [{ label: '52W H', value: formatCurrency(quote.week_52_high) }] : []),
              ...(quote.week_52_low ? [{ label: '52W L', value: formatCurrency(quote.week_52_low) }] : []),
            ].map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/30 text-xs"
              >
                <span className="text-slate-500">{item.label}</span>
                <span className="text-slate-300 font-medium">{item.value}</span>
              </span>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Toolbar */}
      <ChartToolbar />

      {/* Chart */}
      {loading ? (
        <SkeletonLoader variant="chart" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <div className="glass-card p-1 overflow-hidden">
              <CandlestickChart candles={candles} indicators={indicators} height={500} />
            </div>
          </div>
          <div>
            <PatternOverlay patterns={patterns} />
          </div>
        </div>
      )}
    </div>
  );
}
