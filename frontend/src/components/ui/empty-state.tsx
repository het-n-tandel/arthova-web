'use client';

import { motion } from 'framer-motion';
import { Plus, LucideIcon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/formatters';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  accentColor?: string;
  tip?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  accentColor = 'var(--accent-brass)',
  tip,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'bg-bg-surface border border-border-default rounded-[14px] p-8 sm:p-12 text-center max-w-xl mx-auto space-y-5 shadow-sm',
        className
      )}
    >
      {/* Glowing Icon Container */}
      <div className="relative inline-block">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto transition-transform hover:scale-105"
          style={{
            backgroundColor: `${accentColor}15`,
            border: `1px solid ${accentColor}30`,
          }}
        >
          <Icon className="w-8 h-8" style={{ color: accentColor }} strokeWidth={1.75} />
        </div>
        <span
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center bg-bg-surface border border-border-default shadow-sm"
        >
          <Sparkles className="w-3 h-3" style={{ color: accentColor }} />
        </span>
      </div>

      {/* Text Content */}
      <div className="space-y-2">
        <h3 className="text-[17px] font-medium text-text-primary">{title}</h3>
        <p className="text-[13px] text-text-secondary leading-relaxed max-w-md mx-auto">
          {description}
        </p>
      </div>

      {/* Educational Micro-Tip */}
      {tip && (
        <div className="inline-block bg-bg-surface-2 border border-border-default rounded-[8px] px-3.5 py-2 text-[12px] text-text-faint max-w-md">
          💡 <span className="text-text-secondary font-medium">Smart Allocation Rationale:</span> {tip}
        </div>
      )}

      {/* Action Buttons */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-[13px] font-semibold bg-accent-brass hover:bg-accent-brass-dim text-bg-base transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {actionLabel}
            </button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-[13px] font-medium bg-bg-surface-2 hover:bg-bg-surface-3 border border-border-default text-text-secondary hover:text-text-primary transition-colors"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
