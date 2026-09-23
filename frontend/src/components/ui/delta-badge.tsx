'use client';

import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/formatters';

interface DeltaBadgeProps {
  value: number;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export function DeltaBadge({ value = 0, size = 'sm', showIcon = true, className }: DeltaBadgeProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  const Icon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : Minus;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium tracking-tight border',
        size === 'sm' ? 'px-2 py-0.5 text-[11.5px]' : 'px-2.5 py-1 text-[13px]',
        isPositive && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_-2px_rgba(16,185,129,0.3)]',
        isNegative && 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_-2px_rgba(244,63,94,0.3)]',
        isNeutral && 'bg-bg-surface-2 text-text-faint border-border',
        className
      )}
      style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      {isPositive ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
}
