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
      <header className="h-16 bg-bg-surface border-b border-border-default sticky top-0 z-40 flex items-center justify-between px-6">
        {/* Search Bar / Trigger Command Palette */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div
            onClick={() => setIsCommandOpen(true)}
            className="relative w-full cursor-pointer group"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint group-hover:text-accent-brass transition-colors" />
            <div className="w-full bg-bg-surface-2 border border-border-default rounded-[6px] pl-9 pr-12 py-2 text-[13.5px] text-text-faint group-hover:border-accent-brass/50 transition-colors flex items-center justify-between">
              <span>Search stocks, funds, navigate...</span>
              <kbd className="text-[11px] text-text-faint bg-bg-surface-3 px-1.5 py-0.5 rounded border border-border-default font-mono">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Nav Badges & Controls */}
        <div className="flex items-center gap-3">
          {/* Dynamic IST Indian Market Status Pulse */}
          <div className="hidden sm:flex items-center gap-2 mr-2 text-[12px]">
            <span
              className={`w-2 h-2 rounded-full ${
                marketStatus.isOpen ? 'bg-positive animate-pulse' : 'bg-text-faint'
              }`}
            />
            <span
              className={`font-mono text-[11.5px] ${
                marketStatus.isOpen ? 'text-text-primary' : 'text-text-faint'
              }`}
            >
              {marketStatus.label}
            </span>
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

          <div className="w-8 h-8 rounded-full bg-accent-brass-dim flex items-center justify-center ml-1">
            <span className="text-[13px] font-medium text-text-primary">HT</span>
          </div>
        </div>
      </header>

      {/* Global Command Palette Modal */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  );
}
