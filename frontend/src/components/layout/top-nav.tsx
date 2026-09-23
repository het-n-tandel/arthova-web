'use client';

import { useState, useEffect } from 'react';
import { Search, Sun, Moon, Bell } from 'lucide-react';
import { useLedgerStore } from '@/lib/store';
import { CommandPalette } from './command-palette';

export function TopNav() {
  const theme = useLedgerStore((s) => s.theme);
  const toggleTheme = useLedgerStore((s) => s.toggleTheme);
  const notifications = useLedgerStore((s) => s.notifications);

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [marketStatus, setMarketStatus] = useState<{ isOpen: boolean; label: string }>({
    isOpen: true,
    label: 'NSE/BSE Live',
  });

  // Global Keyboard Listener for ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate Indian Market Hours in IST (UTC+5:30)
  useEffect(() => {
    const checkMarketHours = () => {
      const now = new Date();
      // Calculate IST time
      const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
      const istTime = new Date(utcTime + 3600000 * 5.5);

      const day = istTime.getDay(); // 0 = Sunday, 6 = Saturday
      const hours = istTime.getHours();
      const minutes = istTime.getMinutes();
      const timeInMinutes = hours * 60 + minutes;

      const marketOpen = 9 * 60 + 15; // 09:15 AM IST
      const marketClose = 15 * 60 + 30; // 03:30 PM IST

      const isWeekday = day >= 1 && day <= 5;
      const isTradingHours = timeInMinutes >= marketOpen && timeInMinutes <= marketClose;

      if (isWeekday && isTradingHours) {
        setMarketStatus({ isOpen: true, label: 'NSE/BSE Live' });
      } else {
        setMarketStatus({ isOpen: false, label: 'Market Closed (Opens 9:15 AM)' });
      }
    };

    checkMarketHours();
    const interval = setInterval(checkMarketHours, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="h-16 bg-bg-surface/80 backdrop-blur-xl border-b border-border sticky top-0 z-40 flex items-center justify-between px-6 shadow-sm">
        {/* Search Bar / Trigger Command Palette */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div
            onClick={() => setIsCommandOpen(true)}
            className="relative w-full cursor-pointer group"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint group-hover:text-accent-brass transition-colors" />
            <div className="w-full bg-bg-surface-2/60 border border-border rounded-lg pl-10 pr-12 py-2 text-[13px] text-text-faint group-hover:border-accent-brass/40 group-hover:text-text-secondary transition-all flex items-center justify-between shadow-inner">
              <span>Search stocks, mutual funds, or navigate...</span>
              <kbd className="text-[10.5px] text-text-secondary bg-bg-surface-3 px-2 py-0.5 rounded border border-border font-mono shadow-sm">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Nav Badges & Controls */}
        <div className="flex items-center gap-3">
          {/* Dynamic IST Indian Market Status Pulse */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-surface-2 border border-border text-[12px]">
            <span className="relative flex h-2 w-2">
              {marketStatus.isOpen && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  marketStatus.isOpen ? 'bg-emerald-500' : 'bg-slate-500'
                }`}
              />
            </span>
            <span
              className={`font-mono text-[11px] font-medium tracking-tight ${
                marketStatus.isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-faint'
              }`}
            >
              {marketStatus.label}
            </span>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-text-faint hover:text-text-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] border border-transparent hover:border-border transition-all"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button className="p-2 rounded-lg text-text-faint hover:text-text-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] border border-transparent hover:border-border transition-all relative">
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-bg-surface" />
            )}
          </button>

          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 ring-1 ring-white/20 flex items-center justify-center ml-1 shadow-sm">
            <span className="text-[12px] font-semibold text-white tracking-wider">HT</span>
          </div>
        </div>
      </header>

      {/* Global Command Palette Modal */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  );
}
