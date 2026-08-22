'use client';

import { Star } from 'lucide-react';
import { useLedgerStore } from '@/lib/store';
import { DeltaBadge } from '@/components/ui/delta-badge';
import { formatINR, cn } from '@/lib/formatters';
import { type StockHolding } from '@/lib/mock-data';

interface FavouriteStockRowProps {
  stock: StockHolding;
  className?: string;
}

export function FavouriteStockRow({ stock, className }: FavouriteStockRowProps) {
  const livePrices = useLedgerStore((s) => s.livePrices);
  const live = livePrices.get(stock.symbol);
  const price = live?.price ?? stock.cmp;
  const changePercent = live?.changePercent ?? stock.dayChangePercent;

  return (
    <div className={cn('flex items-center gap-3 px-3 py-2.5 rounded-[6px] hover:bg-bg-surface-2 transition-colors', className)}>
      <Star className="w-3.5 h-3.5 fill-accent-brass text-accent-brass shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-text-primary truncate">{stock.symbol}</p>
        <p className="text-[11px] text-text-faint truncate">{stock.name}</p>
      </div>
      <div className="text-right">
        <p className="text-[13px] text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
          {formatINR(price)}
        </p>
        <DeltaBadge value={changePercent} size="sm" />
      </div>
    </div>
  );
}
