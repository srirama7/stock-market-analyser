import { create } from 'zustand';
import type { IndexData, MarketBreadth, GainerLoser, SectorPerformance, StockQuote } from '../types';

interface MarketState {
  indices: IndexData[];
  breadth: MarketBreadth | null;
  gainers: GainerLoser[];
  losers: GainerLoser[];
  sectors: SectorPerformance[];
  prices: Record<string, Partial<StockQuote>>;
  isConnected: boolean;

  setIndices: (indices: IndexData[]) => void;
  setBreadth: (breadth: MarketBreadth) => void;
  setGainersLosers: (data: { gainers: GainerLoser[]; losers: GainerLoser[] }) => void;
  setSectors: (sectors: SectorPerformance[]) => void;
  updatePrice: (symbol: string, data: Partial<StockQuote>) => void;
  setConnected: (connected: boolean) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  indices: [],
  breadth: null,
  gainers: [],
  losers: [],
  sectors: [],
  prices: {},
  isConnected: false,

  setIndices: (indices) => set({ indices }),
  setBreadth: (breadth) => set({ breadth }),
  setGainersLosers: ({ gainers, losers }) => set({ gainers, losers }),
  setSectors: (sectors) => set({ sectors }),
  updatePrice: (symbol, data) =>
    set((state) => ({
      prices: { ...state.prices, [symbol]: { ...state.prices[symbol], ...data } },
    })),
  setConnected: (isConnected) => set({ isConnected }),
}));
