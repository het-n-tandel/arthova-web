'use client';

import { Search, Sun, Moon, Bell } from 'lucide-react';
import { useLedgerStore } from '@/lib/store';

export function TopNav() {
  const theme = useLedgerStore((s) => s.theme);
  const toggleTheme = useLedgerStore((s) => s.toggleTheme);
  const notifications = useLedgerStore((s) => s.notifications);

  return (
    <header className="h-16 bg-bg-surface border-b border-border-default sticky top-0 z-40 flex items-center justify-between px-6">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
          <input
            type="text"
            placeholder="Search stocks, funds, reports..."
            className="w-full bg-bg-surface-2 border border-border-default rounded-[6px] pl-9 pr-12 py-2 text-[14px] text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-brass transition-colors"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-text-faint bg-bg-surface-3 px-1.5 py-0.5 rounded border border-border-default" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>⌘K</kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 mr-4 text-[12px]">
          <span className="w-2 h-2 rounded-full bg-positive animate-pulse" />
          <span className="text-text-secondary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>NSE Open</span>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-[6px] text-text-faint hover:text-text-primary hover:bg-bg-surface-2 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>

        <button className="p-2 rounded-[6px] text-text-faint hover:text-text-primary hover:bg-bg-surface-2 transition-colors relative">
          <Bell className="w-[18px] h-[18px]" />
          {notifications.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-negative" />
          )}
        </button>

        <div className="w-8 h-8 rounded-full bg-accent-brass-dim flex items-center justify-center ml-2">
          <span className="text-[13px] font-medium text-text-primary">HT</span>
        </div>
      </div>
    </header>
  );
}
