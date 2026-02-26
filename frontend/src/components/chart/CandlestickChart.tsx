import { useEffect, useRef } from 'react';
import {
  createChart, type IChartApi, ColorType,
  CandlestickSeries, HistogramSeries, LineSeries,
} from 'lightweight-charts';
import type { Candle } from '../../types';

interface Props {
  candles: Candle[];
  indicators?: Record<string, unknown>;
  height?: number;
}

type TimeVal = import('lightweight-charts').Time;

export default function CandlestickChart({ candles, indicators, height = 500 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#060a14' },
        textColor: '#64748b',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.4)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.4)' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: '#475569', width: 1, style: 2 },
        horzLine: { color: '#475569', width: 1, style: 2 },
      },
      rightPriceScale: { borderColor: 'rgba(51, 65, 85, 0.4)' },
      timeScale: { borderColor: 'rgba(51, 65, 85, 0.4)', timeVisible: true },
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    candleSeries.setData(
      candles.map(c => ({
        time: c.time as unknown as TimeVal,
        open: c.open, high: c.high, low: c.low, close: c.close,
      }))
    );

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeries.setData(
      candles.map(c => ({
        time: c.time as unknown as TimeVal,
        value: c.volume,
        color: c.close >= c.open ? '#22c55e30' : '#ef444430',
      }))
    );

    if (indicators) {
      const lineColors: Record<string, string> = {
        sma20: '#f59e0b', sma50: '#3b82f6', sma200: '#8b5cf6',
        ema20: '#f97316', ema50: '#06b6d4', vwap: '#ec4899',
      };

      for (const [key, data] of Object.entries(indicators)) {
        if (Array.isArray(data)) {
          const filtered = (data as Array<{ time: number; value: number | null; color?: string }>)
            .filter(d => d.value !== null);

          if (key === 'rsi') {
            const s = chart.addSeries(LineSeries, { color: '#a855f7', lineWidth: 1, priceScaleId: 'rsi', title: 'RSI' });
            chart.priceScale('rsi').applyOptions({ scaleMargins: { top: 0.7, bottom: 0.05 } });
            s.setData(filtered.map(d => ({ time: d.time as unknown as TimeVal, value: d.value! })));
          } else if (key === 'supertrend') {
            const s = chart.addSeries(LineSeries, { lineWidth: 2, title: 'Supertrend' });
            s.setData(filtered.map(d => ({ time: d.time as unknown as TimeVal, value: d.value!, color: d.color || '#3b82f6' })));
          } else {
            const s = chart.addSeries(LineSeries, { color: lineColors[key] || '#3b82f6', lineWidth: 1, title: key.toUpperCase() });
            s.setData(filtered.map(d => ({ time: d.time as unknown as TimeVal, value: d.value! })));
          }
        } else if (typeof data === 'object' && data !== null) {
          const obj = data as Record<string, Array<{ time: number; value: number | null }>>;

          if (key === 'bollinger') {
            ['upper', 'middle', 'lower'].forEach((band, i) => {
              if (obj[band]) {
                const s = chart.addSeries(LineSeries, {
                  color: ['#60a5fa', '#f59e0b', '#60a5fa'][i],
                  lineWidth: 1, lineStyle: i !== 1 ? 2 : 0,
                  title: i === 1 ? 'BB Mid' : '',
                });
                s.setData(obj[band].filter(d => d.value !== null).map(d => ({ time: d.time as unknown as TimeVal, value: d.value! })));
              }
            });
          } else if (key === 'macd') {
            if (obj.macd) {
              const s = chart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 1, priceScaleId: 'macd', title: 'MACD' });
              chart.priceScale('macd').applyOptions({ scaleMargins: { top: 0.7, bottom: 0.02 } });
              s.setData(obj.macd.filter(d => d.value !== null).map(d => ({ time: d.time as unknown as TimeVal, value: d.value! })));
            }
            if (obj.signal) {
              const s = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1, priceScaleId: 'macd', title: 'Signal' });
              s.setData(obj.signal.filter(d => d.value !== null).map(d => ({ time: d.time as unknown as TimeVal, value: d.value! })));
            }
            if (obj.histogram) {
              const s = chart.addSeries(HistogramSeries, { priceScaleId: 'macd' });
              s.setData(obj.histogram.filter(d => d.value !== null).map(d => ({
                time: d.time as unknown as TimeVal, value: d.value!,
                color: d.value! >= 0 ? '#22c55e60' : '#ef444460',
              })));
            }
          }
        }
      }
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); chart.remove(); chartRef.current = null; };
  }, [candles, indicators, height]);

  return <div ref={containerRef} className="rounded-xl overflow-hidden ring-1 ring-slate-700/30" />;
}
