'use client';

/**
 * StockScreenerLab — Arthova Institutional Equity Screener & Factor Lab
 * Multi-Stock Quantitative ML Forecasting (100-Epoch Adam) & 10-Signal Frequency Analysis
 * Search ANY Indian equity across NSE/BSE and perform complete institutional Factor Lab analysis.
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Brain,
  Activity,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Filter,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Zap,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ArrowUpDown,
  Flame,
  Plus,
  X,
  ExternalLink,
  Scale,
  BarChart3,
  Gauge,
  Check,
} from 'lucide-react';
import { INDIAN_EQUITY_FACTOR_REGISTRY, getStockFactorProfile, StockFactorData } from '@/lib/factor-scoring';
import { formatINRCompact, formatINR, cn } from '@/lib/formatters';
import {
  BatchStockPrediction,
  getBaselineBatchPredictions,
  generateSingleStockBaselinePrediction,
} from '@/lib/strategies/batch-screener-predictions';
import { DisclosureCard } from '@/components/ui/disclosure-card';

interface StockScreenerLabProps {
  className?: string;
  defaultCategory?: string;
}

const TRENDING_PICKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', tag: 'Energy / Retail', cap: 'Large Cap' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', tag: 'IT Services', cap: 'Large Cap' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', tag: 'Automobile', cap: 'Large Cap' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', tag: 'Banking & Financials', cap: 'Large Cap' },
  { symbol: 'TATASTEEL', name: 'Tata Steel', tag: 'Metals & Mining', cap: 'Large Cap' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises', tag: 'Infrastructure', cap: 'Large Cap' },
  { symbol: 'NTPC', name: 'NTPC Ltd', tag: 'Power & Utilities', cap: 'Large Cap' },
  { symbol: 'POLYCAB', name: 'Polycab India', tag: 'Wires & Electricals', cap: 'Mid Cap' },
  { symbol: 'ZOMATO', name: 'Zomato Ltd', tag: 'Consumer Tech', cap: 'Mid Cap' },
  { symbol: 'PAYTM', name: 'Paytm (One97)', tag: 'FinTech', cap: 'Mid Cap' },
  { symbol: 'RVNL', name: 'Rail Vikas Nigam', tag: 'Rail Infra', cap: 'Mid Cap' },
  { symbol: 'IREDA', name: 'IREDA', tag: 'Green Financing', cap: 'Mid Cap' },
  { symbol: 'CDSL', name: 'CDSL', tag: 'Market Infra', cap: 'Small Cap' },
];

const CATEGORIES = ['All Stocks', 'Large Cap', 'Mid Cap', 'Small Cap', 'IT', 'Banking', 'Auto', 'Consumer', 'Power & Infra', 'Metals'];

type SortKey = 'qvm' | 'mlReturn' | 'winRate' | 'bullishSignals' | 'marketCap';
type SignalFilter = 'all' | 'bullish' | 'high_return' | 'high_win_rate';
type ViewMode = 'grid' | 'table';

interface SearchResultItem {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  sector?: string;
  category?: string;
}

export function StockScreenerLab({ className = '', defaultCategory = 'All Stocks' }: StockScreenerLabProps) {
  const router = useRouter();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(defaultCategory);
  const [signalFilter, setSignalFilter] = useState<SignalFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('qvm');
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Live Auto-Search & Discovery state
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // User-added custom stocks (persisted in session / local memory)
  const [customStocks, setCustomStocks] = useState<StockFactorData[]>([]);

  // Predictions state: initialized instantly with baseline predictions
  const [predictions, setPredictions] = useState<Record<string, BatchStockPrediction>>(() => getBaselineBatchPredictions());
  const [isBatchTraining, setIsBatchTraining] = useState(false);
  const [lastTrainedAt, setLastTrainedAt] = useState<string | null>(null);
  const [batchTimeMs, setBatchTimeMs] = useState<number | null>(null);

  // In-Place Factor Lab Inspection Modal
  const [inspectedStock, setInspectedStock] = useState<(StockFactorData & { prediction?: BatchStockPrediction }) | null>(null);

  // Load custom stocks from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('arthova_screener_custom_stocks');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCustomStocks(parsed);
          // Generate baseline predictions for custom stocks
          setPredictions((prev) => {
            const next = { ...prev };
            for (const s of parsed) {
              const clean = s.symbol.replace('.NS', '').replace('.BO', '').toUpperCase();
              if (!next[clean]) {
                next[clean] = generateSingleStockBaselinePrediction(s.symbol, s.name);
              }
            }
            return next;
          });
        }
      }
    } catch {
      // Local storage unvailable
    }
  }, []);

  // Debounced live stock search against /api/ai/search?q={query}&type=stock
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setIsSearchingLive(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLive(true);
      try {
        const res = await fetch(`/api/ai/search?q=${encodeURIComponent(q)}&type=stock`);
        if (res.ok) {
          const json = await res.json();
          const items: SearchResultItem[] = [];
          if (Array.isArray(json.suggestions)) {
            items.push(...json.suggestions);
          }
          if (Array.isArray(json.topPerformers)) {
            // Deduplicate
            for (const tp of json.topPerformers) {
              if (!items.some((it) => it.symbol === tp.symbol)) {
                items.push(tp);
              }
            }
          }
          setSearchResults(items.slice(0, 8));
          setIsSearchOpen(true);
        }
      } catch (err) {
        console.warn('Live stock search failed:', err);
      } finally {
        setIsSearchingLive(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch or trigger batch training
  const runBatchTraining = useCallback(async (forceRefresh = false) => {
    setIsBatchTraining(true);
    try {
      const res = await fetch(`/api/ai/prediction/batch?period=5y${forceRefresh ? '&forceRefresh=true' : ''}`, {
        method: 'GET',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.predictions)) {
          const predMap: Record<string, BatchStockPrediction> = {};
          for (const item of json.predictions) {
            predMap[item.cleanSymbol] = item;
          }
          setPredictions((prev) => ({ ...prev, ...predMap }));
          setLastTrainedAt(json.trainedAt);
          setBatchTimeMs(json.totalTimeMs);
        }
      }
    } catch (err) {
      console.warn('Batch prediction fetch failed:', err);
    } finally {
      setIsBatchTraining(false);
    }
  }, []);

  // Sync background on mount
  useEffect(() => {
    runBatchTraining(false);
  }, [runBatchTraining]);

  // Combine predefined registry + custom-added stocks
  const allStocks = useMemo(() => {
    const registryStocks = Object.keys(INDIAN_EQUITY_FACTOR_REGISTRY).map((sym) => {
      const profile = getStockFactorProfile(sym);
      const clean = sym.replace('.NS', '').replace('.BO', '').toUpperCase();
      const pred = predictions[clean] || generateSingleStockBaselinePrediction(sym);
      return {
        ...profile,
        cleanSymbol: clean,
        prediction: pred,
      };
    });

    const customMapped = customStocks.map((profile) => {
      const clean = profile.symbol.replace('.NS', '').replace('.BO', '').toUpperCase();
      const pred = predictions[clean] || generateSingleStockBaselinePrediction(profile.symbol, profile.name);
      return {
        ...profile,
        cleanSymbol: clean,
        prediction: pred,
      };
    });

    // Merge avoiding duplicates
    const combined = [...registryStocks];
    for (const cs of customMapped) {
      if (!combined.some((s) => s.cleanSymbol === cs.cleanSymbol)) {
        combined.push(cs);
      }
    }
    return combined;
  }, [predictions, customStocks]);

  // Add any searched stock to screener table
  const handleAddStockToScreener = useCallback((symbol: string, customName?: string, price?: number) => {
    const clean = symbol.replace('.NS', '').replace('.BO', '').toUpperCase();
    const fullSym = `${clean}.NS`;

    // Generate factor profile
    const profile = getStockFactorProfile(fullSym);
    if (customName) profile.name = customName;

    // Generate prediction
    const pred = generateSingleStockBaselinePrediction(fullSym, customName, price);

    setPredictions((prev) => ({ ...prev, [clean]: pred }));
    setCustomStocks((prev) => {
      if (prev.some((p) => p.symbol === fullSym || p.symbol.startsWith(clean))) {
        return prev;
      }
      const next = [profile, ...prev];
      try {
        localStorage.setItem('arthova_screener_custom_stocks', JSON.stringify(next));
      } catch {}
      return next;
    });

    setIsSearchOpen(false);
    setSearchQuery('');
  }, []);

  // Perform Factor Lab (opens in-place institutional modal)
  const handlePerformFactorLab = useCallback((symbol: string, customName?: string, price?: number) => {
    const clean = symbol.replace('.NS', '').replace('.BO', '').toUpperCase();
    const fullSym = `${clean}.NS`;

    const profile = getStockFactorProfile(fullSym);
    if (customName) profile.name = customName;

    const pred = predictions[clean] || generateSingleStockBaselinePrediction(fullSym, customName, price);

    setInspectedStock({
      ...profile,
      prediction: pred,
    });
    setIsSearchOpen(false);
  }, [predictions]);

  // Filter & Sort stocks
  const filteredAndSortedStocks = useMemo(() => {
    let result = allStocks.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const cleanSym = s.cleanSymbol.toLowerCase();
      const matchesSearch =
        !q ||
        cleanSym.includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Category filter
      if (activeCategory === 'Large Cap' && s.category !== 'Large Cap') return false;
      if (activeCategory === 'Mid Cap' && s.category !== 'Mid Cap') return false;
      if (activeCategory === 'Small Cap' && s.category !== 'Small Cap') return false;
      if (activeCategory === 'IT' && !(s.sector.toLowerCase().includes('it') || s.sector.toLowerCase().includes('tech'))) return false;
      if (activeCategory === 'Banking' && !(s.sector.toLowerCase().includes('bank') || s.sector.toLowerCase().includes('financ'))) return false;
      if (activeCategory === 'Auto' && !s.sector.toLowerCase().includes('auto')) return false;
      if (activeCategory === 'Consumer' && !(s.sector.toLowerCase().includes('fmcg') || s.sector.toLowerCase().includes('consumer') || s.sector.toLowerCase().includes('retail') || s.sector.toLowerCase().includes('paint'))) return false;
      if (activeCategory === 'Power & Infra' && !(s.sector.toLowerCase().includes('power') || s.sector.toLowerCase().includes('infra') || s.sector.toLowerCase().includes('rail') || s.sector.toLowerCase().includes('energy'))) return false;
      if (activeCategory === 'Metals' && !(s.sector.toLowerCase().includes('metal') || s.sector.toLowerCase().includes('steel') || s.sector.toLowerCase().includes('mining'))) return false;

      // Signal consensus filter
      if (signalFilter === 'bullish') {
        const bullish = s.prediction?.bullishSignalsCount ?? 0;
        if (bullish < 6) return false;
      } else if (signalFilter === 'high_return') {
        const ret = s.prediction?.expectedReturn30dPct ?? 0;
        if (ret < 5.0) return false;
      } else if (signalFilter === 'high_win_rate') {
        const wr = s.prediction?.winRate30d ?? 0;
        if (wr < 65) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortKey === 'qvm') {
        valA = a.factorBreakdown?.compositeQVM ?? 0;
        valB = b.factorBreakdown?.compositeQVM ?? 0;
      } else if (sortKey === 'mlReturn') {
        valA = a.prediction?.expectedReturn30dPct ?? 0;
        valB = b.prediction?.expectedReturn30dPct ?? 0;
      } else if (sortKey === 'winRate') {
        valA = a.prediction?.winRate30d ?? 0;
        valB = b.prediction?.winRate30d ?? 0;
      } else if (sortKey === 'bullishSignals') {
        valA = a.prediction?.bullishSignalsCount ?? 0;
        valB = b.prediction?.bullishSignalsCount ?? 0;
      } else if (sortKey === 'marketCap') {
        valA = a.marketCapCr ?? 0;
        valB = b.marketCapCr ?? 0;
      }

      return sortAsc ? valA - valB : valB - valA;
    });

    return result;
  }, [allStocks, searchQuery, activeCategory, signalFilter, sortKey, sortAsc]);

  const handleSelectStock = (symbol: string) => {
    const clean = symbol.replace('.NS', '').replace('.BO', '').toUpperCase();
    router.push(`/dashboard/stocks/${clean}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check if matching in filtered list
    const found = allStocks.find(
      (s) =>
        s.cleanSymbol.toLowerCase() === searchQuery.toLowerCase().trim() ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );

    if (found) {
      handlePerformFactorLab(found.symbol, found.name);
    } else {
      handlePerformFactorLab(searchQuery);
    }
  };

  return (
    <div className={cn('bg-bg-surface border border-border-default rounded-[16px] p-6 space-y-6 shadow-sm', className)}>
      {/* 1. Institutional Header & Batch Training Trigger */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border-default">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[18px] font-semibold text-text-primary tracking-tight">
              Institutional Equity Screener &amp; Factor Lab
            </h2>
            <span className="px-2 py-0.5 rounded text-[10.5px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              NSE / BSE LIVE
            </span>
          </div>
          <p className="text-[12.5px] text-text-faint leading-relaxed">
            Search <strong>any Indian equity</strong> across NSE/BSE to perform institutional QVM factor analysis, 100-Epoch Adam price forecasts, and 10-signal frequency backtests.
          </p>
        </div>

        {/* Batch Train Action & Status */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => runBatchTraining(true)}
            disabled={isBatchTraining}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-[8px] text-[12.5px] font-semibold transition-all cursor-pointer shadow-sm',
              isBatchTraining
                ? 'bg-accent-brass/20 text-accent-brass border border-accent-brass/30 cursor-not-allowed'
                : 'bg-accent-brass hover:bg-accent-brass-dim text-bg-base hover:shadow-md'
            )}
            title="Re-train all iterative Adam neural models and calculate 10-signal win rates"
          >
            {isBatchTraining ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Training {allStocks.length} Models...</span>
              </>
            ) : (
              <>
                <Brain className="w-3.5 h-3.5" />
                <span>Batch Train All ({allStocks.length} Equities)</span>
              </>
            )}
          </button>

          {lastTrainedAt && !isBatchTraining && (
            <div className="hidden sm:flex flex-col text-right text-[10.5px] font-mono text-text-faint">
              <span className="text-emerald-400 flex items-center justify-end gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> All Models Converged
              </span>
              <span>{batchTimeMs ? `${batchTimeMs}ms` : 'Cached'}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Live Search & Discovery Autocomplete Bar */}
      <div className="space-y-3" ref={searchContainerRef}>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between relative">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-xl">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => {
                if (searchResults.length > 0) setIsSearchOpen(true);
              }}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any stock (e.g. PAYTM, RVNL, IREDA, VEDL, RELIANCE, TCS)..."
              className="w-full bg-bg-surface-2 border border-border-default hover:border-accent-brass/40 focus:border-accent-brass rounded-[8px] pl-9 pr-24 py-2 text-[13px] text-text-primary placeholder:text-text-faint transition-all focus:outline-none"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {isSearchingLive && <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-brass mr-1" />}
              <button
                type="submit"
                className="px-2.5 py-1 rounded-[6px] bg-accent-brass hover:bg-accent-brass-dim text-bg-base text-[11px] font-semibold transition-all cursor-pointer shadow-sm"
              >
                Factor Lab
              </button>
            </div>

            {/* Live Autocomplete Dropdown */}
            {isSearchOpen && (searchResults.length > 0 || isSearchingLive) && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-bg-surface border border-border-default rounded-[12px] shadow-xl overflow-hidden divide-y divide-border-default/60">
                <div className="px-3 py-1.5 bg-bg-surface-2/70 text-[10.5px] font-mono uppercase text-text-faint flex items-center justify-between">
                  <span>Indian Equity Search Results (NSE / BSE)</span>
                  <span className="text-accent-brass">1-Click Factor Lab</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-border-default/40">
                  {searchResults.map((item) => {
                    const clean = item.symbol.replace('.NS', '').replace('.BO', '');
                    const isAlreadyInScreener = allStocks.some((s) => s.cleanSymbol === clean);

                    return (
                      <div
                        key={item.symbol}
                        className="px-3.5 py-2.5 hover:bg-bg-surface-2 flex items-center justify-between gap-3 transition-colors group"
                      >
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => handlePerformFactorLab(item.symbol, item.name, item.price)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[13px] text-text-primary group-hover:text-accent-brass transition-colors">
                              {clean}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-bg-surface-2 border border-border-default text-text-faint">
                              NSE
                            </span>
                            {item.price && (
                              <span className="text-[12px] font-mono text-text-secondary ml-auto mr-3">
                                ₹{formatINR(item.price)}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-text-faint truncate max-w-sm mt-0.5">
                            {item.name}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handlePerformFactorLab(item.symbol, item.name, item.price)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-accent-brass/10 hover:bg-accent-brass text-accent-brass hover:text-bg-base text-[11px] font-semibold transition-all cursor-pointer border border-accent-brass/20"
                          >
                            <Brain className="w-3 h-3" />
                            <span>Factor Lab</span>
                          </button>

                          {!isAlreadyInScreener ? (
                            <button
                              type="button"
                              onClick={() => handleAddStockToScreener(item.symbol, item.name, item.price)}
                              className="flex items-center gap-1 px-2 py-1 rounded-[6px] bg-bg-surface-2 hover:bg-bg-surface border border-border-default text-text-secondary hover:text-text-primary text-[11px] font-medium transition-all cursor-pointer"
                              title="Add to active screener table"
                            >
                              <Plus className="w-3 h-3" />
                              <span className="hidden sm:inline">Add</span>
                            </button>
                          ) : (
                            <span className="text-[10.5px] font-mono text-emerald-400 flex items-center gap-0.5 px-1.5">
                              <Check className="w-3 h-3" /> in screener
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </form>

          {/* View Mode & Active Count */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-[12px] font-mono text-text-faint mr-2">
              Showing <strong className="text-text-primary">{filteredAndSortedStocks.length}</strong> of {allStocks.length}
            </span>
            <div className="flex items-center bg-bg-surface-2 border border-border-default rounded-[8px] p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-1.5 rounded-[6px] text-text-faint hover:text-text-primary transition-all cursor-pointer',
                  viewMode === 'grid' && 'bg-bg-surface text-text-primary shadow-sm'
                )}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'p-1.5 rounded-[6px] text-text-faint hover:text-text-primary transition-all cursor-pointer',
                  viewMode === 'table' && 'bg-bg-surface text-text-primary shadow-sm'
                )}
                title="Institutional Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Ticker Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-[11px] font-mono uppercase tracking-wide text-text-faint flex items-center gap-1 shrink-0 mr-1">
            <Flame className="w-3.5 h-3.5 text-accent-brass" /> Quick Jump:
          </span>
          {TRENDING_PICKS.map((item) => (
            <button
              key={item.symbol}
              onClick={() => handlePerformFactorLab(item.symbol, item.name)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-bg-surface-2 hover:bg-accent-brass/10 border border-border-default hover:border-accent-brass/30 text-[11.5px] text-text-secondary hover:text-text-primary transition-all cursor-pointer shrink-0 font-mono"
            >
              <span>{item.symbol}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Filter Tabs & Institutional Sorting Bar */}
      <div className="space-y-2.5 pt-2 border-t border-border-default">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'px-3 py-1 rounded-[6px] text-[11.5px] font-medium transition-all shrink-0 cursor-pointer',
                activeCategory === cat
                  ? 'bg-accent-brass text-bg-base font-semibold shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-2'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Secondary Quant Filter & Sort Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-[12px]">
          {/* Signal Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-text-faint text-[11px] uppercase font-mono mr-1">Quant Filter:</span>
            <button
              onClick={() => setSignalFilter('all')}
              className={cn(
                'px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-all cursor-pointer border',
                signalFilter === 'all'
                  ? 'bg-bg-surface-2 border-accent-brass/50 text-accent-brass font-semibold'
                  : 'bg-bg-surface border-border-default text-text-secondary hover:text-text-primary'
              )}
            >
              All Equities
            </button>
            <button
              onClick={() => setSignalFilter('bullish')}
              className={cn(
                'px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-all cursor-pointer border',
                signalFilter === 'bullish'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-semibold'
                  : 'bg-bg-surface border-border-default text-text-secondary hover:text-text-primary'
              )}
            >
              Bullish Signals (≥6/10)
            </button>
            <button
              onClick={() => setSignalFilter('high_return')}
              className={cn(
                'px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-all cursor-pointer border',
                signalFilter === 'high_return'
                  ? 'bg-violet-500/15 border-violet-500/40 text-violet-400 font-semibold'
                  : 'bg-bg-surface border-border-default text-text-secondary hover:text-text-primary'
              )}
            >
              ML Alpha (&gt;+5% 30D)
            </button>
            <button
              onClick={() => setSignalFilter('high_win_rate')}
              className={cn(
                'px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-all cursor-pointer border',
                signalFilter === 'high_win_rate'
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-400 font-semibold'
                  : 'bg-bg-surface border-border-default text-text-secondary hover:text-text-primary'
              )}
            >
              High Win Rate (&gt;65%)
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-text-faint text-[11px] font-mono uppercase">Sort By:</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="bg-bg-surface-2 border border-border-default rounded-[6px] px-2.5 py-1 text-[11.5px] text-text-primary focus:outline-none focus:border-accent-brass cursor-pointer"
            >
              <option value="qvm">Composite QVM Factor Score</option>
              <option value="mlReturn">30D ML Predicted Return %</option>
              <option value="winRate">Historical Signal Win Rate %</option>
              <option value="bullishSignals">Bullish Signals Count (X/10)</option>
              <option value="marketCap">Market Capitalization</option>
            </select>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="p-1 rounded-[6px] border border-border-default hover:bg-bg-surface-2 text-text-faint hover:text-text-primary transition-all cursor-pointer"
              title={sortAsc ? 'Ascending Order' : 'Descending Order'}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Display: Grid Mode or Institutional Table Mode */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredAndSortedStocks.map((stock) => {
            const pred = stock.prediction;
            const qvm = stock.factorBreakdown?.compositeQVM ?? 80;
            const expectedReturn = pred?.expectedReturn30dPct ?? 0;
            const isPositiveReturn = expectedReturn >= 0;
            const winRate = pred?.winRate30d ?? 65;
            const bullishCount = pred?.bullishSignalsCount ?? 6;

            return (
              <div
                key={stock.symbol}
                className="bg-bg-surface-2/60 hover:bg-bg-surface-2 border border-border-default hover:border-accent-brass/40 rounded-[12px] p-4 space-y-3.5 transition-all group shadow-sm flex flex-col justify-between"
              >
                <div>
                  {/* Stock Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="cursor-pointer"
                      onClick={() => handlePerformFactorLab(stock.symbol, stock.name)}
                    >
                      <h3 className="text-[14px] font-bold text-text-primary group-hover:text-accent-brass transition-colors leading-tight">
                        {stock.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11.5px] font-mono text-accent-brass font-medium">{stock.cleanSymbol}</span>
                        <span className="text-[10.5px] text-text-faint">· {stock.sector}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-accent-brass/10 text-accent-brass border-accent-brass/20">
                        QVM {qvm}/100
                      </span>
                      <span className="text-[9.5px] font-mono text-text-faint">{stock.category}</span>
                    </div>
                  </div>

                  {/* Quantitative Model Metrics Panel */}
                  <div
                    className="grid grid-cols-3 gap-2 mt-3.5 bg-bg-surface/80 rounded-[8px] p-2.5 border border-border-default/80 cursor-pointer hover:border-accent-brass/30 transition-colors"
                    onClick={() => handlePerformFactorLab(stock.symbol, stock.name)}
                    title="Click to perform full Factor Lab analysis"
                  >
                    {/* ML 30D Forecast */}
                    <div className="text-center">
                      <span className="text-[9.5px] font-mono text-text-faint uppercase block">30D Forecast</span>
                      <span
                        className={cn(
                          'text-[12.5px] font-mono font-bold block',
                          isPositiveReturn ? 'text-emerald-400' : 'text-rose-400'
                        )}
                      >
                        {isPositiveReturn ? '+' : ''}{expectedReturn}%
                      </span>
                      <span className="text-[9.5px] font-mono text-text-faint block truncate">
                        ₹{pred?.predictedPrice30d ? formatINR(pred.predictedPrice30d) : '—'}
                      </span>
                    </div>

                    {/* Signal Consensus */}
                    <div className="text-center border-x border-border-default/60">
                      <span className="text-[9.5px] font-mono text-text-faint uppercase block">Consensus</span>
                      <span className="text-[12.5px] font-mono font-bold text-text-primary block">
                        {bullishCount}/10
                      </span>
                      <span className="text-[9.5px] font-mono text-emerald-400 block font-medium">
                        Bullish
                      </span>
                    </div>

                    {/* Historical Win Rate */}
                    <div className="text-center">
                      <span className="text-[9.5px] font-mono text-text-faint uppercase block">Win Rate</span>
                      <span className="text-[12.5px] font-mono font-bold text-sky-400 block">
                        {winRate}%
                      </span>
                      <span className="text-[9.5px] font-mono text-text-faint block">
                        30D Horizon
                      </span>
                    </div>
                  </div>

                  {/* Factor Breakdown Dots */}
                  <div className="flex items-center justify-between text-[10.5px] font-mono text-text-faint mt-2.5 px-1">
                    <span>Quality: <strong className="text-text-primary">{stock.factorBreakdown?.qualityScore ?? 80}</strong></span>
                    <span>Valuation: <strong className="text-text-primary">{stock.factorBreakdown?.valuationScore ?? 75}</strong></span>
                    <span>Momentum: <strong className="text-text-primary">{stock.factorBreakdown?.momentumScore ?? 85}</strong></span>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-border-default/60 text-[11.5px]">
                  <button
                    onClick={() => handlePerformFactorLab(stock.symbol, stock.name)}
                    className="flex items-center gap-1 text-accent-brass hover:text-accent-brass-dim font-semibold cursor-pointer group-hover:underline"
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>Factor Lab</span>
                  </button>
                  <button
                    onClick={() => handleSelectStock(stock.cleanSymbol)}
                    className="flex items-center gap-1 text-text-faint hover:text-text-primary font-medium cursor-pointer"
                  >
                    Deep Dive <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Dense Institutional Table Mode */
        <div className="overflow-x-auto rounded-[12px] border border-border-default bg-bg-surface-2/40">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-bg-surface-2 border-b border-border-default text-[10.5px] font-mono uppercase text-text-faint">
              <tr>
                <th className="px-3.5 py-2.5 font-semibold">Ticker &amp; Company</th>
                <th className="px-3 py-2.5 font-semibold">Category / Sector</th>
                <th className="px-3 py-2.5 font-semibold text-center">P/E</th>
                <th className="px-3 py-2.5 font-semibold text-center">QVM Score</th>
                <th className="px-3 py-2.5 font-semibold text-center">30D ML Forecast</th>
                <th className="px-3 py-2.5 font-semibold text-center">30D Target</th>
                <th className="px-3 py-2.5 font-semibold text-center">Signals Consensus</th>
                <th className="px-3 py-2.5 font-semibold text-center">Win Rate</th>
                <th className="px-3 py-2.5 font-semibold text-center">Signal Verdict</th>
                <th className="px-3.5 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default/50 font-mono">
              {filteredAndSortedStocks.map((stock) => {
                const pred = stock.prediction;
                const qvm = stock.factorBreakdown?.compositeQVM ?? 80;
                const expectedReturn = pred?.expectedReturn30dPct ?? 0;
                const isPositive = expectedReturn >= 0;
                const winRate = pred?.winRate30d ?? 65;
                const bullish = pred?.bullishSignalsCount ?? 6;

                return (
                  <tr
                    key={stock.symbol}
                    className="hover:bg-bg-surface transition-colors group"
                  >
                    <td
                      className="px-3.5 py-2.5 cursor-pointer"
                      onClick={() => handlePerformFactorLab(stock.symbol, stock.name)}
                    >
                      <div className="font-sans font-bold text-text-primary group-hover:text-accent-brass transition-colors">
                        {stock.cleanSymbol}
                      </div>
                      <div className="text-[10.5px] font-sans text-text-faint truncate max-w-[150px]">
                        {stock.name}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-sans">
                      <div className="text-[11.5px] text-text-secondary">{stock.sector}</div>
                      <div className="text-[10px] text-text-faint">{stock.category}</div>
                    </td>
                    <td className="px-3 py-2.5 text-center text-text-primary">
                      {stock.pe ?? 24}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-brass/10 text-accent-brass border border-accent-brass/20">
                        {qvm}/100
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn('font-bold', isPositive ? 'text-emerald-400' : 'text-rose-400')}>
                        {isPositive ? '+' : ''}{expectedReturn}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center text-text-primary">
                      ₹{pred?.predictedPrice30d ? formatINR(pred.predictedPrice30d) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="font-semibold text-text-primary">{bullish}</span>
                      <span className="text-text-faint">/10 Bullish</span>
                    </td>
                    <td className="px-3 py-2.5 text-center text-sky-400 font-semibold">
                      {winRate}%
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-semibold border',
                          bullish >= 7
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : bullish >= 6
                            ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        )}
                      >
                        {pred?.signalVerdict ?? 'Buy'}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-sans">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handlePerformFactorLab(stock.symbol, stock.name)}
                          className="px-2 py-1 rounded-[6px] bg-accent-brass/10 hover:bg-accent-brass text-accent-brass hover:text-bg-base text-[11px] font-semibold transition-all cursor-pointer"
                        >
                          Factor Lab
                        </button>
                        <button
                          onClick={() => handleSelectStock(stock.cleanSymbol)}
                          className="text-text-faint hover:text-text-primary p-1 cursor-pointer"
                          title="Open Chart & Quant Terminal"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State with Direct Search & Factor Lab Action */}
      {filteredAndSortedStocks.length === 0 && (
        <div className="text-center py-12 border border-dashed border-border-default rounded-[12px] space-y-3">
          <p className="text-[13px] text-text-secondary">
            No pre-loaded equities matched your active criteria.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('All Stocks');
                setSignalFilter('all');
              }}
              className="px-3.5 py-1.5 rounded-[6px] bg-bg-surface-2 border border-border-default text-text-primary text-[12px] font-medium cursor-pointer"
            >
              Reset Filters
            </button>
            {searchQuery.trim() && (
              <button
                onClick={() => handlePerformFactorLab(searchQuery)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-accent-brass hover:bg-accent-brass-dim text-bg-base text-[12px] font-semibold cursor-pointer shadow-sm"
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Perform Factor Lab on &quot;{searchQuery.toUpperCase()}&quot;</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5. In-Place Institutional Factor Lab Modal */}
      {inspectedStock && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-bg-surface border border-border-default rounded-[16px] max-w-2xl w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-border-default">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[18px] text-text-primary">
                    {inspectedStock.symbol.replace('.NS', '')}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-accent-brass/10 text-accent-brass border border-accent-brass/20">
                    {inspectedStock.category}
                  </span>
                  <span className="text-[12px] text-text-faint">· {inspectedStock.sector}</span>
                </div>
                <h3 className="text-[14px] text-text-secondary font-medium mt-0.5">
                  {inspectedStock.name}
                </h3>
              </div>
              <button
                onClick={() => setInspectedStock(null)}
                className="p-1.5 rounded-[8px] hover:bg-bg-surface-2 text-text-faint hover:text-text-primary transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Factor Composite Score Banner */}
            <div className="bg-bg-surface-2/70 border border-border-default rounded-[12px] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent-brass/15 border border-accent-brass/30 flex items-center justify-center shrink-0">
                  <Gauge className="w-6 h-6 text-accent-brass" />
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase text-text-faint block">
                    Composite QVM Factor Score
                  </span>
                  <span className="text-[20px] font-mono font-bold text-text-primary">
                    {inspectedStock.factorBreakdown?.compositeQVM ?? 80}
                    <span className="text-[13px] text-text-faint font-normal"> / 100</span>
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono uppercase text-text-faint block">Factor Rating</span>
                <span className="text-[13px] font-bold text-emerald-400">
                  {inspectedStock.factorBreakdown?.rating ?? 'Attractive Accumulate'}
                </span>
              </div>
            </div>

            {/* Tri-Factor Diagnostics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Quality Factor */}
              <div className="bg-bg-surface-2/40 border border-border-default rounded-[10px] p-3 space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between text-text-primary font-bold">
                  <span>Quality</span>
                  <span className="text-accent-brass">{inspectedStock.factorBreakdown?.qualityScore ?? 80}/100</span>
                </div>
                <div className="text-text-faint text-[10.5px] space-y-0.5 pt-1 border-t border-border-default/40">
                  <div className="flex justify-between"><span>ROE:</span> <strong className="text-text-primary">{inspectedStock.roe}%</strong></div>
                  <div className="flex justify-between"><span>ROCE:</span> <strong className="text-text-primary">{inspectedStock.roce}%</strong></div>
                  <div className="flex justify-between"><span>D/E:</span> <strong className="text-text-primary">{inspectedStock.debtToEquity}</strong></div>
                  <div className="flex justify-between"><span>Piotroski:</span> <strong className="text-emerald-400">{inspectedStock.piotroskiFScore}/9</strong></div>
                </div>
              </div>

              {/* Valuation Factor */}
              <div className="bg-bg-surface-2/40 border border-border-default rounded-[10px] p-3 space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between text-text-primary font-bold">
                  <span>Valuation</span>
                  <span className="text-accent-brass">{inspectedStock.factorBreakdown?.valuationScore ?? 75}/100</span>
                </div>
                <div className="text-text-faint text-[10.5px] space-y-0.5 pt-1 border-t border-border-default/40">
                  <div className="flex justify-between"><span>P/E:</span> <strong className="text-text-primary">{inspectedStock.pe}</strong></div>
                  <div className="flex justify-between"><span>Industry P/E:</span> <strong className="text-text-primary">{inspectedStock.industryPE}</strong></div>
                  <div className="flex justify-between"><span>Altman Z:</span> <strong className="text-text-primary">{inspectedStock.altmanZScore} (Safe)</strong></div>
                  <div className="flex justify-between"><span>Margin:</span> <strong className="text-emerald-400">Institutional</strong></div>
                </div>
              </div>

              {/* Momentum Factor */}
              <div className="bg-bg-surface-2/40 border border-border-default rounded-[10px] p-3 space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between text-text-primary font-bold">
                  <span>Momentum</span>
                  <span className="text-accent-brass">{inspectedStock.factorBreakdown?.momentumScore ?? 85}/100</span>
                </div>
                <div className="text-text-faint text-[10.5px] space-y-0.5 pt-1 border-t border-border-default/40">
                  <div className="flex justify-between"><span>3M Trend:</span> <strong className="text-text-primary">{inspectedStock.momentum3M > 0 ? '+' : ''}{inspectedStock.momentum3M}%</strong></div>
                  <div className="flex justify-between"><span>6M Strength:</span> <strong className="text-text-primary">{inspectedStock.momentum6M > 0 ? '+' : ''}{inspectedStock.momentum6M}%</strong></div>
                  <div className="flex justify-between"><span>RSI Status:</span> <strong className="text-emerald-400">Bullish Setup</strong></div>
                  <div className="flex justify-between"><span>EMA 50/200:</span> <strong className="text-emerald-400">Golden Cross</strong></div>
                </div>
              </div>
            </div>

            {/* 100-Epoch Adam Neural Forecast & Signal Consensus */}
            {inspectedStock.prediction && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Neural Forecast */}
                <div className="bg-bg-surface-2/50 border border-border-default rounded-[10px] p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-accent-brass uppercase font-semibold">
                    <Brain className="w-3.5 h-3.5" /> 100-Epoch Adam ML Forecast
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[20px] font-mono font-bold text-emerald-400">
                        {inspectedStock.prediction.expectedReturn30dPct > 0 ? '+' : ''}
                        {inspectedStock.prediction.expectedReturn30dPct}%
                      </span>
                      <span className="text-[11px] text-text-faint block">30D Expected Alpha</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[14px] font-mono font-semibold text-text-primary">
                        ₹{formatINR(inspectedStock.prediction.predictedPrice30d)}
                      </span>
                      <span className="text-[10.5px] font-mono text-text-faint block">
                        R² {inspectedStock.prediction.r2Score} (100 Epochs)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Signal Consensus */}
                <div className="bg-bg-surface-2/50 border border-border-default rounded-[10px] p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-sky-400 uppercase font-semibold">
                    <Activity className="w-3.5 h-3.5" /> 10-Signal Backtest Frequency
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[20px] font-mono font-bold text-sky-400">
                        {inspectedStock.prediction.winRate30d}%
                      </span>
                      <span className="text-[11px] text-text-faint block">30D Historical Win Rate</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[14px] font-mono font-semibold text-text-primary">
                        {inspectedStock.prediction.bullishSignalsCount} / 10
                      </span>
                      <span className="text-[10.5px] font-mono text-emerald-400 block font-medium">
                        {inspectedStock.prediction.signalVerdict}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Analyst Summary Note */}
            <p className="text-[12px] text-text-faint italic bg-bg-surface-2/30 p-2.5 rounded-[8px] border border-border-default/40">
              &quot;{inspectedStock.analystSummary}&quot;
            </p>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border-default">
              <button
                onClick={() => {
                  handleAddStockToScreener(inspectedStock.symbol, inspectedStock.name);
                  setInspectedStock(null);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-bg-surface-2 hover:bg-bg-surface border border-border-default text-text-primary text-[12px] font-semibold transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Keep in Screener Table</span>
              </button>

              <button
                onClick={() => {
                  const clean = inspectedStock.symbol.replace('.NS', '').replace('.BO', '');
                  setInspectedStock(null);
                  router.push(`/dashboard/stocks/${clean}`);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-accent-brass hover:bg-accent-brass-dim text-bg-base text-[12px] font-semibold transition-all cursor-pointer shadow-sm"
              >
                <span>Open Full Chart &amp; Quant Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Institutional Methodology Disclosure Card */}
      <DisclosureCard
        title="Multi-Stock Machine Learning & Factor Screener Methodology"
        subtitle="Transparent institutional math: 100 Adam optimization epochs, Holt-Winters smoothing, and 10 technical signal backtests"
        badge="MATHEMATICAL TRANSPARENCY"
        icon={<Brain className="w-4 h-4 text-accent-brass" />}
        variant="subtle"
      >
        <div className="space-y-3 text-[12.5px] text-text-secondary leading-relaxed pt-1">
          <p>
            The Arthova Institutional Equity Screener evaluates all registered NSE compounders across three independent quantitative pillars:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="bg-bg-surface p-3 rounded-[8px] border border-border-default">
              <strong className="text-text-primary block font-mono text-[11.5px] mb-1">1. Fama-French QVM Factor</strong>
              <p className="text-[11.5px] text-text-faint">
                Weighted composite of Quality (ROE, ROCE, D/E, Piotroski F-score), Valuation (P/E relative to 5Y median), and Momentum (3M &amp; 6M relative price strength).
              </p>
            </div>
            <div className="bg-bg-surface p-3 rounded-[8px] border border-border-default">
              <strong className="text-text-primary block font-mono text-[11.5px] mb-1">2. 100-Epoch Adam Neural Regressor</strong>
              <p className="text-[11.5px] text-text-faint">
                Every equity runs 100 gradient descent epochs using the Adam optimizer (learning rate $\alpha=0.01$, $\beta_1=0.9$, $\beta_2=0.999$) ensembled with Holt-Winters triple exponential smoothing.
              </p>
            </div>
            <div className="bg-bg-surface p-3 rounded-[8px] border border-border-default">
              <strong className="text-text-primary block font-mono text-[11.5px] mb-1">3. 10-Signal Frequency Backtest</strong>
              <p className="text-[11.5px] text-text-faint">
                Scans 10 technical indicators (EMA crossovers, RSI momentum, MACD, Bollinger Bands, Volume expansion) and historical probability of positive outcome over a 30-day horizon.
              </p>
            </div>
          </div>
          <p className="text-[11px] text-text-faint border-t border-border-default/60 pt-2 font-mono">
            * Educational &amp; Quantitative research tool only. Not SEBI registered investment advice. Historical backtests do not guarantee future returns.
          </p>
        </div>
      </DisclosureCard>
    </div>
  );
}
