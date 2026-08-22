'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/formatters';

interface PriceCellProps {
  price: number;
  previousPrice?: number;
  className?: string;
}

export function PriceCell({ price, previousPrice, className }: PriceCellProps) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevRef = useRef(price);

  useEffect(() => {
    if (previousPrice !== undefined && previousPrice !== price) {
      setFlash(price > previousPrice ? 'up' : 'down');
      const timer = setTimeout(() => setFlash(null), 600);
      return () => clearTimeout(timer);
    }
    prevRef.current = price;
  }, [price, previousPrice]);

  return (
    <span
      className={cn(
        'inline-block px-1 py-0.5 rounded transition-colors',
        flash === 'up' && 'flash-up',
        flash === 'down' && 'flash-down',
        className
      )}
      style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}
    >
      {new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price)}
    </span>
  );
}
