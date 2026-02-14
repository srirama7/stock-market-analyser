export const TIMEFRAMES = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1H', value: '1h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '1wk' },
  { label: '1M', value: '1mo' },
];

export const INDICATORS = [
  { label: 'SMA 20', value: 'sma20' },
  { label: 'SMA 50', value: 'sma50' },
  { label: 'EMA 20', value: 'ema20' },
  { label: 'EMA 50', value: 'ema50' },
  { label: 'RSI', value: 'rsi' },
  { label: 'MACD', value: 'macd' },
  { label: 'Bollinger', value: 'bollinger' },
  { label: 'Supertrend', value: 'supertrend' },
  { label: 'VWAP', value: 'vwap' },
];

export const DIRECTION_COLORS = {
  BULLISH: '#22c55e',
  BEARISH: '#ef4444',
  NEUTRAL: '#f59e0b',
};

export const SECTOR_COLORS: Record<string, string> = {
  IT: '#3b82f6',
  Banking: '#22c55e',
  Auto: '#f59e0b',
  Pharma: '#8b5cf6',
  FMCG: '#ec4899',
  Metal: '#6b7280',
  'Oil & Gas': '#f97316',
  Infrastructure: '#14b8a6',
  Power: '#eab308',
  'Financial Services': '#06b6d4',
  Consumer: '#a855f7',
  Telecom: '#64748b',
};
