'use client';

import { create } from 'zustand';

export interface PriceTick {
  symbol: string;
  price: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

interface LedgerStore {
  // UI State
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Favorites
  favorites: Set<string>;
  toggleFavorite: (symbol: string) => void;
  isFavorite: (symbol: string) => boolean;

  // Live Prices
  livePrices: Map<string, PriceTick>;
  updatePrice: (tick: PriceTick) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;

  // Active page for mobile nav
  activePage: string;
  setActivePage: (page: string) => void;
}

export interface Notification {
  id: string;
  type: 'warning' | 'info' | 'positive' | 'brass';
  title: string;
  message: string;
  timestamp: number;
}

export const useLedgerStore = create<LedgerStore>((set, get) => ({
  // UI State
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  // Theme
  theme: 'dark',
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark';
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('light', next === 'light');
        document.documentElement.setAttribute('data-theme', next);
      }
      return { theme: next };
    }),

  // Favorites
  favorites: new Set(['RELIANCE', 'TCS', 'HDFCBANK', 'INFY']),
  toggleFavorite: (symbol) =>
    set((s) => {
      const next = new Set(s.favorites);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      return { favorites: next };
    }),
  isFavorite: (symbol) => get().favorites.has(symbol),

  // Live Prices
  livePrices: new Map(),
  updatePrice: (tick) =>
    set((s) => {
      const next = new Map(s.livePrices);
      next.set(tick.symbol, tick);
      return { livePrices: next };
    }),

  // Notifications
  notifications: [],
  addNotification: (notification) =>
    set((s) => ({
      notifications: [
        {
          ...notification,
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
        },
        ...s.notifications,
      ].slice(0, 20),
    })),
  dismissNotification: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),

  // Active page
  activePage: '/',
  setActivePage: (page) => set({ activePage: page }),
}));
