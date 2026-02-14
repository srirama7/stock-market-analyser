export interface StockQuote {
  symbol: string;
  name: string;
  exchange: string;
  last_price: number;
  prev_close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  day_change: number;
  day_change_pct: number;
  market_cap?: number;
  pe_ratio?: number;
  week_52_high?: number;
  week_52_low?: number;
  timestamp?: string;
}

export interface StockSearch {
  symbol: string;
  name: string;
  exchange: string;
}

export interface IndexData {
  name: string;
  value: number;
  change: number;
  change_pct: number;
  open?: number;
  high?: number;
  low?: number;
  prev_close?: number;
}

export interface MarketBreadth {
  advances: number;
  declines: number;
  unchanged: number;
}

export interface GainerLoser {
  symbol: string;
  name: string;
  last_price: number;
  change: number;
  change_pct: number;
  day_change?: number;
  day_change_pct?: number;
  volume?: number;
}

export interface SectorPerformance {
  sector: string;
  change_pct: number;
  top_stock?: string;
  top_stock_change?: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartData {
  symbol: string;
  interval: string;
  period: string;
  candles: Candle[];
  indicators?: Record<string, unknown>;
}

export interface IndicatorData {
  time: number;
  value: number | null;
  color?: string;
}

export interface Holding {
  id: number;
  portfolio_id: number;
  symbol: string;
  quantity: number;
  avg_buy_price: number;
  current_price?: number;
  pnl?: number;
  pnl_pct?: number;
  day_change?: number;
  day_change_pct?: number;
  market_value?: number;
  sector?: string;
}

export interface Portfolio {
  id: number;
  name: string;
  holdings: Holding[];
  created_at: string;
}

export interface PortfolioSummary {
  total_invested: number;
  current_value: number;
  total_pnl: number;
  total_pnl_pct: number;
  day_change: number;
  day_change_pct: number;
  holdings_count: number;
  sector_allocation: Record<string, number>;
}

export interface PatternDetection {
  symbol: string;
  pattern_type: string;
  pattern_name: string;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  description?: string;
  price_at_detection?: number;
  detected_at?: string;
  timeframe: string;
  time?: number;
  trend_context?: string;
}

export interface NewsArticle {
  title: string;
  url: string;
  description: string;
  source: string;
  published_at?: string;
  image_url?: string;
}

export interface ScreenerResult {
  symbol: string;
  name: string;
  last_price: number;
  day_change: number;
  day_change_pct: number;
  volume: number;
  rsi?: number;
  volume_ratio?: number;
  passed_filters: string[];
}

export type WSMessage =
  | { type: 'price'; symbol: string; data: Partial<StockQuote> }
  | { type: 'market'; data: { indices: IndexData[] } }
  | { type: 'pattern'; data: PatternDetection }
  | { type: 'subscribed'; symbols: string[] }
  | { type: 'unsubscribed'; symbols: string[] }
  | { type: 'error'; message: string };
