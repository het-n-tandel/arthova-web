'use client';

import React from 'react';
import { QuantitativeSignal } from '@/lib/strategies/types';
import { cn } from '@/lib/formatters';
import { Activity, TrendingUp, TrendingDown, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface Props {
  signal: QuantitativeSignal;
  showDetails?: boolean;
  className?: string;
}

export function AlgoSignalBadge({ signal, showDetails = false, className }: Props) {
  const isBuy = signal.signal === 'buy' || signal.signal === 'strong_buy';
  const isSell = signal.signal === 'sell' || signal.signal === 'strong_sell';

  const badgeColor = isBuy
    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
    : isSell
    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';

  const Icon = isBuy ? ArrowUpRight : isSell ? ArrowDownRight : Activity;

  return (
    <div className={cn('inline-flex flex-col gap-1', className)}>
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11.5px] font-medium shadow-sm transition-all',
          badgeColor
        )}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="font-semibold">{signal.label}</span>
        <span className="font-mono text-[10px] opacity-75">
          ({signal.confidencePercent}%)
        </span>
      </div>

      {showDetails && (
        <div className="flex items-center gap-2 text-[10.5px] text-text-faint font-mono mt-0.5">
          <span>RSI: {signal.indicators.rsi14}</span>
          <span>•</span>
          <span>Z: {signal.indicators.zScore20 > 0 ? `+${signal.indicators.zScore20}` : signal.indicators.zScore20}σ</span>
        </div>
      )}
    </div>
  );
}
