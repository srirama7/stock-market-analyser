import { create } from 'zustand';

interface ChartState {
  symbol: string;
  interval: string;
  activeIndicators: string[];

  setSymbol: (symbol: string) => void;
  setInterval: (interval: string) => void;
  toggleIndicator: (indicator: string) => void;
  setIndicators: (indicators: string[]) => void;
}

export const useChartStore = create<ChartState>((set) => ({
  symbol: 'RELIANCE',
  interval: '1d',
  activeIndicators: [],

  setSymbol: (symbol) => set({ symbol }),
  setInterval: (interval) => set({ interval }),
  toggleIndicator: (indicator) =>
    set((state) => ({
      activeIndicators: state.activeIndicators.includes(indicator)
        ? state.activeIndicators.filter((i) => i !== indicator)
        : [...state.activeIndicators, indicator],
    })),
  setIndicators: (activeIndicators) => set({ activeIndicators }),
}));
