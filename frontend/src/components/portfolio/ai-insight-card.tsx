'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, Brain, BarChart3, Shield } from 'lucide-react';
import { type AIInsight } from '@/lib/mock-data';
import { cn } from '@/lib/formatters';

interface AIInsightCardProps {
  insight: AIInsight;
  className?: string;
}

const typeConfig = {
  fraud: { icon: AlertTriangle, color: 'var(--warning)', bgClass: 'bg-warning-bg', label: 'FRAUD DETECTION' },
  strategy: { icon: TrendingUp, color: 'var(--accent-brass)', bgClass: 'bg-bg-surface-2', label: 'STRATEGY' },
  sentiment: { icon: Brain, color: 'var(--positive)', bgClass: 'bg-positive-bg', label: 'SENTIMENT' },
  forecast: { icon: BarChart3, color: 'var(--info-indigo)', bgClass: 'bg-info-indigo-bg', label: 'FORECAST' },
  score: { icon: Shield, color: 'var(--accent-brass)', bgClass: 'bg-bg-surface-2', label: 'HEALTH SCORE' },
};

export function AIInsightCard({ insight, className }: AIInsightCardProps) {
  const config = typeConfig[insight.type];
  const Icon = config.icon;

  return (
    <motion.div
      whileHover={{ y: -2, borderColor: 'var(--border-strong)' }}
      transition={{ duration: 0.18, ease: 'easeOut' as const }}
      className={cn(
        'bg-bg-surface border border-border-default rounded-[12px] p-5 transition-colors',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn('w-9 h-9 rounded-[6px] flex items-center justify-center shrink-0', config.bgClass)}
        >
          <Icon className="w-[18px] h-[18px]" style={{ color: config.color }} strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-eyebrow" style={{ color: config.color }}>
              {config.label}
            </span>
            <span className="text-[11px] text-text-faint" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
              {insight.confidence}% conf.
            </span>
          </div>
          <h4 className="text-[14px] font-medium text-text-primary mb-1">{insight.title}</h4>
          <p className="text-[12.5px] text-text-secondary leading-relaxed line-clamp-2">
            {insight.description}
          </p>
          {insight.relatedSymbol && (
            <span className="inline-block mt-2 text-[11px] text-accent-brass bg-bg-surface-2 px-2 py-0.5 rounded" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
              {insight.relatedSymbol}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
