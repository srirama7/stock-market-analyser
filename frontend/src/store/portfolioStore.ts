import { create } from 'zustand';
import type { Portfolio, PortfolioSummary } from '../types';

interface PortfolioState {
  portfolios: Portfolio[];
  activePortfolio: Portfolio | null;
  summary: PortfolioSummary | null;

  setPortfolios: (portfolios: Portfolio[]) => void;
  setActivePortfolio: (portfolio: Portfolio | null) => void;
  setSummary: (summary: PortfolioSummary) => void;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  portfolios: [],
  activePortfolio: null,
  summary: null,

  setPortfolios: (portfolios) => set({ portfolios }),
  setActivePortfolio: (activePortfolio) => set({ activePortfolio }),
  setSummary: (summary) => set({ summary }),
}));
