'use client';

import { useEffect, useRef } from 'react';
import { useLedgerStore } from '@/lib/store';
import { stockHoldings } from '@/lib/mock-data';

/**
 * Simulates real-time price ticks via setInterval.
 * Updates Zustand store, which triggers flash animations in PriceCell components.
 */
export function usePriceStream(interval = 3000) {
  const updatePrice = useLedgerStore((s) => s.updatePrice);
  const pricesRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    // Initialize prices from mock data
    stockHoldings.forEach((stock) => {
      pricesRef.current.set(stock.symbol, stock.cmp);
    });

    const timer = setInterval(() => {
      // Pick 2-4 random stocks to update each tick
      const numUpdates = 2 + Math.floor(Math.random() * 3);
      const shuffled = [...stockHoldings].sort(() => Math.random() - 0.5);
      const toUpdate = shuffled.slice(0, numUpdates);

      toUpdate.forEach((stock) => {
        const currentPrice = pricesRef.current.get(stock.symbol) || stock.cmp;
        // Random fluctuation ±0.1% to ±0.5%
        const changePercent = (Math.random() - 0.48) * 0.01;
        const newPrice = Math.round((currentPrice * (1 + changePercent)) * 100) / 100;
        const change = Math.round((newPrice - currentPrice) * 100) / 100;

        pricesRef.current.set(stock.symbol, newPrice);

        updatePrice({
          symbol: stock.symbol,
          price: newPrice,
          previousPrice: currentPrice,
          change,
          changePercent: Math.round(changePercent * 10000) / 100,
          timestamp: Date.now(),
        });
      });
    }, interval);

    return () => clearInterval(timer);
  }, [interval, updatePrice]);
}
