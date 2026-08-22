'use client';

import { useEffect } from 'react';
import { useLedgerStore } from '@/lib/store';

export function usePriceStream() {
  const updatePrice = useLedgerStore((s) => s.updatePrice);
  const livePrices = useLedgerStore((s) => s.livePrices);

  useEffect(() => {
    // Only connect if we are in browser
    if (typeof window === 'undefined') return;

    const eventSource = new EventSource('/api/stream/prices');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'PRICE_UPDATE' && data.payload) {
          const { symbol, price, change, changePercent, timestamp } = data.payload;
          
          const currentPrice = livePrices.get(symbol)?.price || price;
          
          updatePrice({
            symbol,
            price,
            previousPrice: currentPrice,
            change,
            changePercent,
            timestamp: new Date(timestamp).getTime(),
          });
        }
      } catch (e) {
        console.error('Error parsing stream data:', e);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      eventSource.close();
      // In production, we'd want to attempt reconnect logic here
    };

    return () => {
      eventSource.close();
    };
  }, [updatePrice]);
}
