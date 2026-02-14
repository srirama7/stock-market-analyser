import { useEffect, useRef } from 'react';
import { createChart, type IChartApi, type ISeriesApi, ColorType } from 'lightweight-charts';
import type { Candle } from '../../types';

interface Props {
  candles: Candle[];
  indicators?: Record<string, unknown>;
  height?: number;
}

export default function CandlestickChart({ candles, indicators, height = 500 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    // Cleanup previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#0f172a' },
        textColor: '#94a3b8',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: '#475569', width: 1, style: 2 },
        horzLine: { color: '#475569', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: '#334155',
      },
      timeScale: {
        borderColor: '#334155',
        timeVisible: true,
      },
    });

    chartRef.current = chart;

    // Candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    const chartData = candles.map(c => ({
      time: c.time as unknown as import('lightweight-charts').Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candleSeries.setData(chartData);

    // Volume series
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    volumeSeries.setData(
      candles.map(c => ({
        time: c.time as unknown as import('lightweight-charts').Time,
        value: c.volume,
        color: c.close >= c.open ? '#22c55e40' : '#ef444440',
      }))
    );

    // Add indicators
    if (indicators) {
      const lineColors: Record<string, string> = {
        sma20: '#f59e0b',
        sma50: '#3b82f6',
        sma200: '#8b5cf6',
        ema20: '#f97316',
        ema50: '#06b6d4',
        vwap: '#ec4899',
      };

      for (const [key, data] of Object.entries(indicators)) {
        if (Array.isArray(data)) {
          // Simple line indicator (SMA, EMA, VWAP, RSI)
          if (key === 'rsi') {
            // RSI goes on separate pane
            const rsiSeries = chart.addLineSeries({
              color: '#a855f7',
              lineWidth: 1,
              priceScaleId: 'rsi',
              title: 'RSI',
            });
            chart.priceScale('rsi').applyOptions({
              scaleMargins: { top: 0.7, bottom: 0.05 },
            });
            rsiSeries.setData(
              (data as Array<{time: number; value: number | null}>)
                .filter(d => d.value !== null)
                .map(d => ({
                  time: d.time as unknown as import('lightweight-charts').Time,
                  value: d.value!,
                }))
            );
          } else if (key === 'supertrend') {
            const stSeries = chart.addLineSeries({
              lineWidth: 2,
              title: 'Supertrend',
            });
            stSeries.setData(
              (data as Array<{time: number; value: number | null; color?: string}>)
                .filter(d => d.value !== null)
                .map(d => ({
                  time: d.time as unknown as import('lightweight-charts').Time,
                  value: d.value!,
                  color: d.color || '#3b82f6',
                }))
            );
          } else {
            const lineSeries = chart.addLineSeries({
              color: lineColors[key] || '#3b82f6',
              lineWidth: 1,
              title: key.toUpperCase(),
            });
            lineSeries.setData(
              (data as Array<{time: number; value: number | null}>)
                .filter(d => d.value !== null)
                .map(d => ({
                  time: d.time as unknown as import('lightweight-charts').Time,
                  value: d.value!,
                }))
            );
          }
        } else if (typeof data === 'object' && data !== null) {
          const obj = data as Record<string, unknown>;
          // Multi-line indicators (MACD, Bollinger)
          if (key === 'bollinger') {
            const bbData = obj as Record<string, Array<{time: number; value: number | null}>>;
            ['upper', 'middle', 'lower'].forEach((band, i) => {
              if (bbData[band]) {
                const series = chart.addLineSeries({
                  color: ['#60a5fa', '#f59e0b', '#60a5fa'][i],
                  lineWidth: 1,
                  lineStyle: i !== 1 ? 2 : 0,
                  title: i === 1 ? 'BB Mid' : '',
                });
                series.setData(
                  bbData[band]
                    .filter(d => d.value !== null)
                    .map(d => ({
                      time: d.time as unknown as import('lightweight-charts').Time,
                      value: d.value!,
                    }))
                );
              }
            });
          } else if (key === 'macd') {
            const macdData = obj as Record<string, Array<{time: number; value: number | null}>>;
            if (macdData.macd) {
              const macdSeries = chart.addLineSeries({
                color: '#3b82f6',
                lineWidth: 1,
                priceScaleId: 'macd',
                title: 'MACD',
              });
              chart.priceScale('macd').applyOptions({
                scaleMargins: { top: 0.7, bottom: 0.02 },
              });
              macdSeries.setData(
                macdData.macd
                  .filter(d => d.value !== null)
                  .map(d => ({
                    time: d.time as unknown as import('lightweight-charts').Time,
                    value: d.value!,
                  }))
              );
            }
            if (macdData.signal) {
              const sigSeries = chart.addLineSeries({
                color: '#f59e0b',
                lineWidth: 1,
                priceScaleId: 'macd',
                title: 'Signal',
              });
              sigSeries.setData(
                macdData.signal
                  .filter(d => d.value !== null)
                  .map(d => ({
                    time: d.time as unknown as import('lightweight-charts').Time,
                    value: d.value!,
                  }))
              );
            }
            if (macdData.histogram) {
              const histSeries = chart.addHistogramSeries({
                priceScaleId: 'macd',
              });
              histSeries.setData(
                macdData.histogram
                  .filter(d => d.value !== null)
                  .map(d => ({
                    time: d.time as unknown as import('lightweight-charts').Time,
                    value: d.value!,
                    color: d.value! >= 0 ? '#22c55e80' : '#ef444480',
                  }))
              );
            }
          }
        }
      }
    }

    chart.timeScale().fitContent();

    // Resize handler
    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [candles, indicators, height]);

  return <div ref={containerRef} className="rounded-lg overflow-hidden" />;
}
