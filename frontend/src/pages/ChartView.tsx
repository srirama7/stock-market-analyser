import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChartStore } from '../store/chartStore';
import { getChartData, getStockQuote, getPatterns } from '../api/client';
import { usePriceSubscription } from '../hooks/useWebSocket';
import { useMarketStore } from '../store/marketStore';
import CandlestickChart from '../components/chart/CandlestickChart';
import ChartToolbar from '../components/chart/ChartToolbar';
import PatternOverlay from '../components/chart/PatternOverlay';
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

  return (
    <div className="space-y-3">
      {/* Stock Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-100">{symbol}</h1>
          <span className="text-sm text-slate-400">{quote?.name || symbol}</span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-100">
            {formatCurrency(displayPrice)}
          </div>
          <div className={`text-sm font-medium ${getChangeColor(displayChange)}`}>
            {displayChange >= 0 ? '+' : ''}{formatNumber(displayChange)} ({formatPercent(displayChangePct)})
          </div>
        </div>
      </div>

      {/* Quote Details */}
      {quote && (
        <div className="flex gap-4 text-xs text-slate-400 flex-wrap">
          <span>Open: {formatCurrency(quote.open)}</span>
          <span>High: {formatCurrency(quote.high)}</span>
          <span>Low: {formatCurrency(quote.low)}</span>
          <span>Vol: {formatLargeNumber(quote.volume)}</span>
          {quote.week_52_high && <span>52W H: {formatCurrency(quote.week_52_high)}</span>}
          {quote.week_52_low && <span>52W L: {formatCurrency(quote.week_52_low)}</span>}
        </div>
      )}

      {/* Toolbar */}
      <ChartToolbar />

      {/* Chart */}
      {loading ? (
        <div className="flex items-center justify-center h-96 bg-slate-800 rounded-xl">
          <span className="text-slate-400">Loading chart...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <CandlestickChart candles={candles} indicators={indicators} height={500} />
          </div>
          <div>
            <PatternOverlay patterns={patterns} />
          </div>
        </div>
      )}
    </div>
  );
}
