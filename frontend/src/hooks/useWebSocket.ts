import { useEffect, useRef } from 'react';
import { priceWs, marketWs } from '../api/websocket';
import { useMarketStore } from '../store/marketStore';
import type { IndexData, StockQuote } from '../types';

export function useMarketWebSocket() {
  const { setIndices, setConnected } = useMarketStore();

  useEffect(() => {
    marketWs.connect();
    const offConnected = marketWs.on('connected', () => setConnected(true));
    const offDisconnected = marketWs.on('disconnected', () => setConnected(false));
    const offMarket = marketWs.on('market', (msg: unknown) => {
      const data = msg as { data: { indices: IndexData[] } };
      if (data?.data?.indices) {
        setIndices(data.data.indices);
      }
    });

    return () => {
      offConnected();
      offDisconnected();
      offMarket();
    };
  }, [setIndices, setConnected]);
}

export function usePriceSubscription(symbols: string[]) {
  const { updatePrice } = useMarketStore();
  const subscribedRef = useRef<string[]>([]);

  useEffect(() => {
    priceWs.connect();
    const offPrice = priceWs.on('price', (msg: unknown) => {
      const data = msg as { symbol: string; data: Partial<StockQuote> };
      if (data?.symbol && data?.data) {
        updatePrice(data.symbol, data.data);
      }
    });

    return () => {
      offPrice();
    };
  }, [updatePrice]);

  useEffect(() => {
    const toSub = symbols.filter(s => !subscribedRef.current.includes(s));
    const toUnsub = subscribedRef.current.filter(s => !symbols.includes(s));

    if (toUnsub.length > 0) {
      priceWs.unsubscribe(toUnsub);
    }
    if (toSub.length > 0) {
      priceWs.subscribe(toSub);
    }
    subscribedRef.current = [...symbols];
  }, [symbols]);
}
