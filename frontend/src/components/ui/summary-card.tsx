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
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl p-5 cursor-default transition-all duration-200',
        'glass-card hover:border-accent-brass/30 hover:shadow-glow',
        onClick && 'cursor-pointer',
        className
      )}
    >

      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-mono uppercase tracking-wider text-text-faint font-medium">
          {label}
        </span>
        {icon && (
          <div className="w-7 h-7 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-border flex items-center justify-center text-text-secondary">
            {icon}
          </div>
        )}
      </div>

      <div 
        className="text-[26px] font-semibold text-text-primary tracking-tight leading-none mb-2" 
        style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </div>

      <div className="flex items-center gap-2 mt-2.5">
        {delta !== undefined && <DeltaBadge value={delta} />}
        {sublabel && (
          <span className="text-[11.5px] text-text-faint font-medium truncate">
            {sublabel}
          </span>
        )}
      </div>
    </motion.div>
  );
}
