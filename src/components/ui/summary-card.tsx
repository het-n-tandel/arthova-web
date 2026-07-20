'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { DeltaBadge } from './delta-badge';
import { cn } from '@/lib/formatters';

interface SummaryCardProps {
  label: string;
  value: string;
  delta?: number;
  sublabel?: string;
  icon?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function SummaryCard({ label, value, delta, sublabel, icon, className, onClick }: SummaryCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2, borderColor: 'var(--border-strong)' }}
      transition={{ duration: 0.18, ease: 'easeOut' as const }}
      onClick={onClick}
      className={cn(
        'bg-bg-surface border border-border-default rounded-[12px] p-6 cursor-default',
        'transition-colors duration-150',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-eyebrow">{label}</span>
        {icon && <span className="text-text-faint">{icon}</span>}
      </div>
      <div className="text-[28px] font-medium text-text-primary leading-tight mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div className="flex items-center gap-2 mt-2">
        {delta !== undefined && <DeltaBadge value={delta} />}
        {sublabel && <span className="text-[12px] text-text-faint">{sublabel}</span>}
      </div>
    </motion.div>
  );
}
