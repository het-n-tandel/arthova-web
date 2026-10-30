'use client';

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Info } from 'lucide-react';
import { cn } from '@/lib/formatters';

export interface DisclosureCardProps {
  title: string;
  subtitle?: string;
  badge?: string | ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  variant?: 'default' | 'subtle' | 'accent' | 'warning' | 'info';
  className?: string;
}

export function DisclosureCard({
  title,
  subtitle,
  badge,
  icon,
  children,
  defaultOpen = false,
  variant = 'default',
  className = '',
}: DisclosureCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const variantStyles = {
    default: 'bg-bg-surface border-border-default hover:border-border-strong',
    subtle: 'bg-bg-surface-2/60 border-border-subtle hover:border-border-default',
    accent: 'bg-accent-brass/5 border-accent-brass/20 hover:border-accent-brass/35',
    warning: 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/35',
    info: 'bg-sky-500/5 border-sky-500/20 hover:border-sky-500/35',
  };

  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-200 overflow-hidden',
        variantStyles[variant],
        className
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors cursor-pointer group select-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {icon ? (
            <div className="text-text-secondary group-hover:text-text-primary transition-colors shrink-0">
              {icon}
            </div>
          ) : (
            <Info className="w-4 h-4 text-text-faint group-hover:text-text-secondary transition-colors shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13px] font-medium text-text-primary group-hover:text-emerald-400 dark:group-hover:text-emerald-300 transition-colors">
                {title}
              </span>
              {badge && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-black/10 dark:bg-white/10 text-text-secondary border border-border">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[11.5px] text-text-faint truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-text-faint group-hover:text-text-secondary transition-colors hidden sm:inline">
            {isOpen ? 'Collapse' : 'Details'}
          </span>
          <div
            className={cn(
              'w-6 h-6 rounded-md flex items-center justify-center transition-transform duration-200 bg-black/[0.04] dark:bg-white/[0.05] group-hover:bg-black/[0.08] dark:group-hover:bg-white/[0.1]',
              isOpen && 'rotate-180 text-emerald-400'
            )}
          >
            <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-border-subtle text-[12.5px] text-text-secondary leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
