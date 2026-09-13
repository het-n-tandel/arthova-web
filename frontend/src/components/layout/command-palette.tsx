'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  Briefcase,
  TrendingUp,
  Coins,
  Landmark,
  Building2,
  FileText,
  Sparkles,
  Settings,
  Sun,
  Moon,
  Zap,
  ArrowRight,
  Command,
  X
} from 'lucide-react';
import { useLedgerStore } from '@/lib/store';
import { cn } from '@/lib/formatters';

interface CommandItem {
  id: string;
  label: string;
  category: 'Navigation' | 'Actions' | 'Assets';
  icon: any;
  shortcut?: string;
  action: () => void;
  keywords?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: Props) {
  const router = useRouter();
  const theme = useLedgerStore((s) => s.theme);
  const toggleTheme = useLedgerStore((s) => s.toggleTheme);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Define commands
  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      category: 'Navigation',
      icon: LayoutDashboard,
      action: () => { router.push('/dashboard'); onClose(); },
      keywords: 'home main overview',
    },
    {
      id: 'nav-portfolio',
      label: 'Go to Portfolio Holdings',
      category: 'Navigation',
      icon: Briefcase,
      action: () => { router.push('/dashboard/portfolio'); onClose(); },
      keywords: 'holdings assets breakdown',
    },
    {
      id: 'nav-ai-advisor',
      label: 'Go to AI Wealth Advisor',
      category: 'Navigation',
      icon: Sparkles,
      action: () => { router.push('/dashboard/ai-advisor'); onClose(); },
      keywords: 'rebalance recommend glide path fire projection',
    },
    {
      id: 'nav-stocks',
      label: 'Go to Stocks',
      category: 'Navigation',
      icon: TrendingUp,
      action: () => { router.push('/dashboard/stocks'); onClose(); },
      keywords: 'equity shares nse bse',
    },
    {
      id: 'nav-gold',
      label: 'Go to Gold & Silver',
      category: 'Navigation',
      icon: Coins,
      action: () => { router.push('/dashboard/gold-silver'); onClose(); },
      keywords: 'precious metals bullion sgb bees',
    },
    {
      id: 'nav-fds',
      label: 'Go to Fixed Deposits',
      category: 'Navigation',
      icon: Landmark,
      action: () => { router.push('/dashboard/fixed-deposits'); onClose(); },
      keywords: 'fd interest maturity bank',
    },
    {
      id: 'nav-property',
      label: 'Go to Real Estate / Property',
      category: 'Navigation',
      icon: Building2,
      action: () => { router.push('/dashboard/property'); onClose(); },
      keywords: 'real estate house plot land',
    },
    {
      id: 'nav-tax',
      label: 'Go to Tax Reports (STCG / LTCG)',
      category: 'Navigation',
      icon: FileText,
      action: () => { router.push('/dashboard/tax-reports'); onClose(); },
      keywords: 'tax capital gains harvest itr schedule 112a',
    },
    {
      id: 'nav-settings',
      label: 'Go to Settings & Linked Brokers',
      category: 'Navigation',
      icon: Settings,
      action: () => { router.push('/dashboard/settings'); onClose(); },
      keywords: 'zerodha groww demat cas profile',
    },

    // Actions
    {
      id: 'act-rebalance',
      label: 'Run Smart Monthly Rebalancer',
      category: 'Actions',
      icon: Zap,
      action: () => { router.push('/dashboard/ai-advisor'); onClose(); },
      keywords: 'deploy surplus fix drift allocation',
    },
    {
      id: 'act-tax-harvest',
      label: 'Check Tax-Loss Harvesting Opportunities',
      category: 'Actions',
      icon: FileText,
      action: () => { router.push('/dashboard/tax-reports'); onClose(); },
      keywords: 'harvest loss save tax offset capital gain',
    },
    {
      id: 'act-theme',
      label: `Toggle Theme (Current: ${theme})`,
      category: 'Actions',
      icon: theme === 'dark' ? Sun : Moon,
      action: () => { toggleTheme(); },
      keywords: 'dark light mode appearance',
    },

    // Quick Asset Lookup
    {
      id: 'asset-reliance',
      label: 'Reliance Industries (RELIANCE)',
      category: 'Assets',
      icon: TrendingUp,
      action: () => { router.push('/dashboard/stocks'); onClose(); },
      keywords: 'oil retail jio conglomerate',
    },
    {
      id: 'asset-tcs',
      label: 'Tata Consultancy Services (TCS)',
      category: 'Assets',
      icon: TrendingUp,
      action: () => { router.push('/dashboard/stocks'); onClose(); },
      keywords: 'tata it tech software',
    },
    {
      id: 'asset-hdfc',
      label: 'HDFC Bank Ltd (HDFCBANK)',
      category: 'Assets',
      icon: TrendingUp,
      action: () => { router.push('/dashboard/stocks'); onClose(); },
      keywords: 'banking finance credit',
    },
    {
      id: 'asset-goldbees',
      label: 'Nippon India Gold BeES (GOLDBEES)',
      category: 'Assets',
      icon: Coins,
      action: () => { router.push('/dashboard/gold-silver'); onClose(); },
      keywords: 'gold etf hedge bullion',
    },
  ], [router, theme, toggleTheme, onClose]);

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase();
    return commands.filter(c =>
      c.label.toLowerCase().includes(lower) ||
      c.category.toLowerCase().includes(lower) ||
      (c.keywords && c.keywords.toLowerCase().includes(lower))
    );
  }, [commands, query]);

  // Keyboard Navigation inside palette
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="w-full max-w-xl bg-bg-surface border border-border-strong rounded-[14px] shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input Bar */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border-default bg-bg-surface-2">
            <Search className="w-5 h-5 text-accent-brass shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search stocks, navigate pages, run actions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-[14.5px] text-text-primary placeholder:text-text-faint outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-text-faint hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="text-[11px] font-mono text-text-faint bg-bg-surface px-2 py-0.5 rounded border border-border-default">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
            {filteredCommands.length === 0 ? (
              <div className="py-10 text-center text-text-faint text-[13px]">
                No matching results found for &ldquo;{query}&rdquo;
              </div>
            ) : (
              filteredCommands.map((cmd, idx) => {
                const Icon = cmd.icon;
                const isSelected = idx === selectedIndex;

                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      'w-full flex items-center justify-between px-3.5 py-2.5 rounded-[8px] text-left transition-colors',
                      isSelected
                        ? 'bg-accent-brass/10 text-text-primary border border-accent-brass/30'
                        : 'text-text-secondary hover:bg-bg-surface-2'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        'w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0',
                        isSelected ? 'bg-accent-brass text-bg-base' : 'bg-bg-surface-2 text-text-faint'
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[13.5px] font-medium truncate">{cmd.label}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-bg-surface-2 text-text-faint">
                        {cmd.category}
                      </span>
                      {isSelected && <ArrowRight className="w-3.5 h-3.5 text-accent-brass" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Navigation Hints */}
          <div className="px-4 py-2.5 border-t border-border-default bg-bg-surface-2 flex items-center justify-between text-[11.5px] text-text-faint">
            <div className="flex items-center gap-3">
              <span><kbd className="font-mono bg-bg-surface px-1.5 py-0.5 rounded border border-border-default">↑↓</kbd> to navigate</span>
              <span><kbd className="font-mono bg-bg-surface px-1.5 py-0.5 rounded border border-border-default">↵</kbd> to select</span>
            </div>
            <span className="flex items-center gap-1 font-mono">
              <Command className="w-3 h-3" />K Global Palette
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
