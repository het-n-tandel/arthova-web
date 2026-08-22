'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function usePriceStream() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const eventSource = new EventSource('/api/stream/prices');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'PRICE_UPDATE') {
          queryClient.setQueryData(['price', data.payload.symbol], data.payload.price);
        }
      } catch (err) {
        console.error('SSE Parse Error', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient]);
}
