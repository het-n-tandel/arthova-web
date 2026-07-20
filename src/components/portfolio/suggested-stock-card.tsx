'use client';

import { motion } from 'framer-motion';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/formatters';

interface SuggestedStockCardProps {
  symbol: string;
  name: string;
  reasoning: string;
  confidence: number;
  targetPrice: number;
  currentPrice: number;
  className?: string;
}

export function SuggestedStockCard({
  symbol,
  name,
  reasoning,
  confidence,
  targetPrice,
  currentPrice,
  className,
}: SuggestedStockCardProps) {
  const upside = ((targetPrice - currentPrice) / currentPrice) * 100;

  return (
    <motion.div
      whileHover={{ y: -2, borderColor: 'var(--border-strong)' }}
      transition={{ duration: 0.18, ease: 'easeOut' as const }}
      className={cn(
        'bg-bg-surface rounded-[12px] p-5 transition-colors',
        confidence >= 80
          ? 'border-2 border-accent-brass-dim'
          : 'border border-border-default'
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-accent-brass" />
        <span className="text-eyebrow text-accent-brass">AI PICK</span>
        <span className="ml-auto text-[11px] text-text-faint" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
          {confidence}% confidence
        </span>
      </div>

      <h4 className="text-[16px] font-medium text-text-primary">{symbol}</h4>
      <p className="text-[12.5px] text-text-secondary mb-3">{name}</p>
      <p className="text-[12px] text-text-faint leading-relaxed mb-4 line-clamp-2">{reasoning}</p>

      <div className="flex items-center gap-4">
        <div>
          <span className="text-[10px] text-text-faint uppercase tracking-wider">Target</span>
          <p className="text-[14px] text-positive font-medium" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
            ₹{targetPrice.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-positive-bg px-2 py-1 rounded-full">
          <ArrowUpRight className="w-3 h-3 text-positive" />
          <span className="text-[12px] text-positive" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
            +{upside.toFixed(1)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}
