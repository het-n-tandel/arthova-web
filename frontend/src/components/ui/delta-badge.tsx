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
        'inline-flex items-center gap-0.5 rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-[12.5px]' : 'px-3 py-1 text-[14px]',
        isPositive && 'bg-positive-bg text-positive',
        isNegative && 'bg-negative-bg text-negative',
        isNeutral && 'bg-bg-surface-2 text-text-faint',
        className
      )}
      style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />}
      {isPositive ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
}
