import axios from 'axios';

function isElectron(): boolean {
  return typeof window !== 'undefined' &&
    typeof (window as unknown as Record<string, unknown>).electronAPI !== 'undefined';
}

function getApiBase(): string {
  // Electron desktop app
  if (isElectron()) {
    return 'http://localhost:8000/api';
  }
  // Capacitor native app
  if (typeof (window as unknown as Record<string, unknown>).Capacitor !== 'undefined') {
    return 'http://localhost:8000/api';
  }
  // Browser dev mode - Vite proxy handles /api
  return '/api';
}

const API_BASE = getApiBase();

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Stocks
export const searchStocks = (q: string) =>
  api.get(`/stocks/search?q=${encodeURIComponent(q)}`).then(r => r.data);

export const getStockQuote = (symbol: string) =>
  api.get(`/stocks/${symbol}/quote`).then(r => r.data);

export const getStockInfo = (symbol: string) =>
  api.get(`/stocks/${symbol}/info`).then(r => r.data);

export const getStockHistory = (symbol: string, period = '1mo', interval = '1d') =>
  api.get(`/stocks/${symbol}/history?period=${period}&interval=${interval}`).then(r => r.data);

// Market
export const getIndices = () =>
  api.get('/market/indices').then(r => r.data);

export const getGainersLosers = (count = 5) =>
  api.get(`/market/gainers-losers?count=${count}`).then(r => r.data);

export const getMarketBreadth = () =>
  api.get('/market/breadth').then(r => r.data);

export const getSectorPerformance = () =>
  api.get('/market/sectors').then(r => r.data);

// Charts
export const getChartData = (symbol: string, interval = '1d', indicators?: string) => {
  let url = `/charts/${symbol}?interval=${interval}`;
  if (indicators) url += `&indicators=${indicators}`;
  return api.get(url).then(r => r.data);
};

// Portfolio
export const getPortfolios = () =>
  api.get('/portfolio/').then(r => r.data);

export const createPortfolio = (name: string) =>
  api.post('/portfolio/', { name }).then(r => r.data);

export const getPortfolio = (id: number) =>
  api.get(`/portfolio/${id}`).then(r => r.data);

export const getPortfolioSummary = (id: number) =>
  api.get(`/portfolio/${id}/summary`).then(r => r.data);

export const addHolding = (portfolioId: number, data: { symbol: string; quantity: number; avg_buy_price: number }) =>
  api.post(`/portfolio/${portfolioId}/holdings`, data).then(r => r.data);

export const updateHolding = (holdingId: number, data: { quantity?: number; avg_buy_price?: number }) =>
  api.put(`/portfolio/holdings/${holdingId}`, data).then(r => r.data);

export const deleteHolding = (holdingId: number) =>
  api.delete(`/portfolio/holdings/${holdingId}`).then(r => r.data);

export const addTransaction = (holdingId: number, data: { transaction_type: string; quantity: number; price: number }) =>
  api.post(`/portfolio/holdings/${holdingId}/transactions`, data).then(r => r.data);

// Patterns
export const getPatterns = (symbol: string, timeframe = '1d', minConfidence = 0.5) =>
  api.get(`/patterns/${symbol}?timeframe=${timeframe}&min_confidence=${minConfidence}`).then(r => r.data);

export const scanPatterns = (symbols: string[], timeframe = '1d') =>
  api.post(`/patterns/scan?timeframe=${timeframe}`, symbols).then(r => r.data);

// Screener
export const getScreenerPresets = () =>
  api.get('/screener/presets').then(r => r.data);

export const runScreener = (params: Record<string, string | number>) => {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  return api.get(`/screener/run?${query}`).then(r => r.data);
};

// News
export const getNews = (q?: string, limit = 30) => {
  let url = `/news/?limit=${limit}`;
  if (q) url += `&q=${encodeURIComponent(q)}`;
  return api.get(url).then(r => r.data);
};

export default api;
