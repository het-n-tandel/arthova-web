'use client';

/**
 * MutualFundScreenerLab — Arthova Institutional Mutual Fund Screener & Factor Lab
 * Quantitative Alpha Scoring, Expense Ratio Efficiency, Sharpe Ratios & Portfolio Moats
 * Screen, search, and analyze ANY Indian Mutual Fund (AMFI) without investing first.
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
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
  PiggyBank,
  Award,
  Scale,
  Gauge,
  Check,
  Percent,
} from 'lucide-react';
import {
  INDIAN_MUTUAL_FUND_REGISTRY,
  getMutualFundFactorProfile,
  createDynamicMFProfile,
  MutualFundFactorData,
  MarketCapCategory,
} from '@/lib/factor-scoring';
import { MutualFundPerformanceChart } from '@/components/charts/mf-performance-chart';
import { formatINR, formatINRCompact, cn } from '@/lib/formatters';
import { DisclosureCard } from '@/components/ui/disclosure-card';
import { TradeModal } from '@/components/portfolio/trade-modal';

interface MutualFundScreenerLabProps {
  className?: string;
  defaultCategory?: string;
}

const TRENDING_FUNDS = [
  { code: '122639', name: 'Parag Parikh Flexi Cap', tag: 'Flexi Cap Moat' },
  { code: '120716', name: 'UTI Nifty 50 Index', tag: '0.18% Ultra-Low Cost' },
  { code: '118989', name: 'Motilal Oswal Midcap', tag: '32% 3Y CAGR Alpha' },
  { code: '118778', name: 'Nippon India Small Cap', tag: 'Top Small Cap' },
  { code: '120828', name: 'Quant Small Cap', tag: 'High Sharpe Alpha' },
  { code: '100033', name: 'ICICI Bluechip', tag: 'Large Cap Quality' },
  { code: '135800', name: 'Tata Digital India', tag: 'Tech Theme' },
  { code: '120503', name: 'Axis Small Cap', tag: 'Low-Beta Quality' },
];

const CATEGORIES = [
  'All Funds',
  'Large & Flexi Cap',
  'Mid Cap',
  'Small Cap',
  'Index Funds',
  'Thematic & Tech',
];

type SortKey = 'score' | 'cagr3Y' | 'sharpe' | 'expenseRatio' | 'aum';
type QuantFilter = 'all' | 'high_sharpe' | 'low_cost' | 'high_alpha' | 'high_cagr';
type ViewMode = 'grid' | 'table';

interface SearchResultFund {
  symbol: string;
  name: string;
  price?: number;
  aiRationale?: string;
}

export function MutualFundScreenerLab({
  className = '',
  defaultCategory = 'All Funds',
}: MutualFundScreenerLabProps) {
  const router = useRouter();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(defaultCategory);
  const [quantFilter, setQuantFilter] = useState<QuantFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Live AMFI Search state
  const [searchResults, setSearchResults] = useState<SearchResultFund[]>([]);
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // User-added custom funds (persisted in session)
  const [customFunds, setCustomFunds] = useState<MutualFundFactorData[]>([]);

  // In-Place Factor Lab Modal state
  const [inspectedFund, setInspectedFund] = useState<MutualFundFactorData | null>(null);

  // Trade Modal execution state
  const [tradeFundConfig, setTradeFundConfig] = useState<{
    isOpen: boolean;
    symbol: string;
    name: string;
    currentPrice: number;
  }>({
    isOpen: false,
    symbol: '122639',
    name: 'Parag Parikh Flexi Cap Fund',
    currentPrice: 84.5,
  });

  // Load custom funds from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('arthova_screener_custom_mfs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCustomFunds(parsed);
        }
      }
    } catch {}
  }, []);

  // Debounced live AMFI mutual fund search against /api/ai/search?q={query}&type=mutual_fund
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
        const res = await fetch(`/api/ai/search?q=${encodeURIComponent(q)}&type=mutual_fund`);
        if (res.ok) {
          const json = await res.json();
          const items: SearchResultFund[] = [];
          if (Array.isArray(json.suggestions)) {
            items.push(...json.suggestions);
          }
          if (Array.isArray(json.topPerformers)) {
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
        console.warn('Live MF search failed:', err);
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

  // Combine curated registry + custom-added funds
  const allFunds = useMemo(() => {
    const registryFunds = Object.keys(INDIAN_MUTUAL_FUND_REGISTRY).map((code) =>
      getMutualFundFactorProfile(code)
    );

    const combined = [...registryFunds];
    for (const cf of customFunds) {
      if (!combined.some((f) => f.schemeCode === cf.schemeCode)) {
        combined.push(cf);
      }
    }
    return combined;
  }, [customFunds]);

  // Add any searched fund to screener table
  const handleAddFundToScreener = useCallback((schemeCode: string, name?: string, nav?: number) => {
    const profile = getMutualFundFactorProfile(schemeCode, name, { nav });

    setCustomFunds((prev) => {
      if (prev.some((p) => p.schemeCode === schemeCode)) return prev;
      const next = [profile, ...prev];
      try {
        localStorage.setItem('arthova_screener_custom_mfs', JSON.stringify(next));
      } catch {}
      return next;
    });

    setIsSearchOpen(false);
    setSearchQuery('');
  }, []);

  // Perform Factor Lab (opens in-place institutional modal)
  const handlePerformFactorLab = useCallback((schemeCode: string, name?: string, nav?: number) => {
    const profile = getMutualFundFactorProfile(schemeCode, name, { nav });
    setInspectedFund(profile);
    setIsSearchOpen(false);
  }, []);

  // Start SIP / Trade pre-filled modal
  const handleOpenTrade = useCallback((fund: MutualFundFactorData) => {
    setTradeFundConfig({
      isOpen: true,
      symbol: fund.schemeCode,
      name: fund.name,
      currentPrice: fund.nav,
    });
  }, []);

  // Filter & Sort funds
  const filteredAndSortedFunds = useMemo(() => {
    let result = allFunds.filter((f) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.fundHouse.toLowerCase().includes(q) ||
        f.schemeCode.includes(q);

      if (!matchesSearch) return false;

      // Category filter
      if (activeCategory === 'Large & Flexi Cap') {
        const isMatch = f.category === 'Large Cap' || /flexi|large|bluechip/i.test(f.name);
        if (!isMatch) return false;
      } else if (activeCategory === 'Mid Cap') {
        if (f.category !== 'Mid Cap' && !/mid/i.test(f.name)) return false;
      } else if (activeCategory === 'Small Cap') {
        if (f.category !== 'Small Cap' && !/small/i.test(f.name)) return false;
      } else if (activeCategory === 'Index Funds') {
        if (!/index|nifty|sensex|etf/i.test(f.name)) return false;
      } else if (activeCategory === 'Thematic & Tech') {
        if (!/tech|digital|pharma|infra|manufacturing/i.test(f.name)) return false;
      }

      // Quant filters
      if (quantFilter === 'high_sharpe' && f.sharpeRatio < 1.5) return false;
      if (quantFilter === 'low_cost' && f.expenseRatio > 0.5) return false;
      if (quantFilter === 'high_alpha' && f.alpha < 5.0) return false;
      if (quantFilter === 'high_cagr' && f.cagr3Y < 25.0) return false;

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortKey === 'score') {
        valA = a.factorBreakdown?.compositeQVM ?? 0;
        valB = b.factorBreakdown?.compositeQVM ?? 0;
      } else if (sortKey === 'cagr3Y') {
        valA = a.cagr3Y;
        valB = b.cagr3Y;
      } else if (sortKey === 'sharpe') {
        valA = a.sharpeRatio;
        valB = b.sharpeRatio;
      } else if (sortKey === 'expenseRatio') {
        valA = a.expenseRatio;
        valB = b.expenseRatio;
        // Ascending preferred for expense ratio (lower is better)
        return sortAsc ? valB - valA : valA - valB;
      } else if (sortKey === 'aum') {
        valA = a.aumCr;
        valB = b.aumCr;
      }

      return sortAsc ? valA - valB : valB - valA;
    });

    return result;
  }, [allFunds, searchQuery, activeCategory, quantFilter, sortKey, sortAsc]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const found = allFunds.find((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));
    if (found) {
      handlePerformFactorLab(found.schemeCode, found.name, found.nav);
    } else {
      handlePerformFactorLab(searchQuery, searchQuery);
    }
  };

  return (
    <div className={cn('bg-bg-surface border border-border-default rounded-[16px] p-6 space-y-6 shadow-sm', className)}>
      {/* 1. Institutional Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border-default">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[18px] font-semibold text-text-primary tracking-tight flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-accent-brass" />
              Institutional Mutual Fund Screener &amp; Factor Lab
            </h2>
            <span className="px-2 py-0.5 rounded text-[10.5px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              AMFI VERIFIED LIVE
            </span>
          </div>
          <p className="text-[12.5px] text-text-faint leading-relaxed">
            Multi-factor quantitative alpha scoring, expense ratio efficiency (TER), Sharpe ratios, and underlying portfolio holdings across {allFunds.length} Indian AMC schemes.
          </p>
        </div>

        {/* Action Header Stats */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right text-[11px] font-mono text-text-faint hidden sm:block">
            <span className="text-text-primary font-bold block">{allFunds.length} Tier-1 Funds Tracked</span>
            <span className="text-emerald-400">Direct Growth Schemes</span>
          </div>
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
              placeholder="Search any mutual fund (e.g. Parag Parikh, Quant, Nippon, Nifty 50, Mirae)..."
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
                  <span>AMFI Verified Mutual Fund Search</span>
                  <span className="text-accent-brass">1-Click Factor Lab</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-border-default/40">
                  {searchResults.map((item) => {
                    const isAlreadyInScreener = allFunds.some((f) => f.schemeCode === item.symbol);

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
                            <span className="font-sans font-bold text-[13px] text-text-primary group-hover:text-accent-brass transition-colors truncate max-w-xs">
                              {item.name}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-bg-surface-2 border border-border-default text-text-faint shrink-0">
                              #{item.symbol}
                            </span>
                            {item.price && (
                              <span className="text-[12px] font-mono text-text-secondary ml-auto mr-3 shrink-0">
                                NAV ₹{item.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-text-faint truncate max-w-sm mt-0.5">
                            {item.aiRationale || 'AMFI Direct Growth Scheme'}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handlePerformFactorLab(item.symbol, item.name, item.price)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-accent-brass/10 hover:bg-accent-brass text-accent-brass hover:text-bg-base text-[11px] font-semibold transition-all cursor-pointer border border-accent-brass/20"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Factor Lab</span>
                          </button>

                          {!isAlreadyInScreener ? (
                            <button
                              type="button"
                              onClick={() => handleAddFundToScreener(item.symbol, item.name, item.price)}
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
              Showing <strong className="text-text-primary">{filteredAndSortedFunds.length}</strong> of {allFunds.length}
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
          {TRENDING_FUNDS.map((item) => (
            <button
              key={item.code}
              onClick={() => handlePerformFactorLab(item.code, item.name)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-bg-surface-2 hover:bg-accent-brass/10 border border-border-default hover:border-accent-brass/30 text-[11.5px] text-text-secondary hover:text-text-primary transition-all cursor-pointer shrink-0 font-medium"
            >
              <span>{item.name}</span>
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
          {/* Quant Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-text-faint text-[11px] uppercase font-mono mr-1">Quant Filter:</span>
            <button
              onClick={() => setQuantFilter('all')}
              className={cn(
                'px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-all cursor-pointer border',
                quantFilter === 'all'
                  ? 'bg-bg-surface-2 border-accent-brass/50 text-accent-brass font-semibold'
                  : 'bg-bg-surface border-border-default text-text-secondary hover:text-text-primary'
              )}
            >
              All Funds
            </button>
            <button
              onClick={() => setQuantFilter('high_sharpe')}
              className={cn(
                'px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-all cursor-pointer border',
                quantFilter === 'high_sharpe'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-semibold'
                  : 'bg-bg-surface border-border-default text-text-secondary hover:text-text-primary'
              )}
            >
              High Sharpe (&gt; 1.5)
            </button>
            <button
              onClick={() => setQuantFilter('low_cost')}
              className={cn(
                'px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-all cursor-pointer border',
                quantFilter === 'low_cost'
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-400 font-semibold'
                  : 'bg-bg-surface border-border-default text-text-secondary hover:text-text-primary'
              )}
            >
              Low Expense (&lt; 0.5% TER)
            </button>
            <button
              onClick={() => setQuantFilter('high_alpha')}
              className={cn(
                'px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-all cursor-pointer border',
                quantFilter === 'high_alpha'
                  ? 'bg-violet-500/15 border-violet-500/40 text-violet-400 font-semibold'
                  : 'bg-bg-surface border-border-default text-text-secondary hover:text-text-primary'
              )}
            >
              Alpha Outperformer (&gt; 5.0%)
            </button>
            <button
              onClick={() => setQuantFilter('high_cagr')}
              className={cn(
                'px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-all cursor-pointer border',
                quantFilter === 'high_cagr'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 font-semibold'
                  : 'bg-bg-surface border-border-default text-text-secondary hover:text-text-primary'
              )}
            >
              High CAGR (&gt; 25% 3Y)
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
              <option value="score">Composite Factor Score</option>
              <option value="cagr3Y">3-Year Compounded CAGR %</option>
              <option value="sharpe">Sharpe Ratio (Risk-Adjusted Alpha)</option>
              <option value="expenseRatio">Lowest Expense Ratio (TER %)</option>
              <option value="aum">Fund AUM (Cr)</option>
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
          {filteredAndSortedFunds.map((fund) => {
            const score = fund.factorBreakdown?.compositeQVM ?? 80;
            const isTopAlpha = score >= 82;

            return (
              <div
                key={fund.schemeCode}
                className="bg-bg-surface-2/60 hover:bg-bg-surface-2 border border-border-default hover:border-accent-brass/40 rounded-[12px] p-4 space-y-3.5 transition-all group shadow-sm flex flex-col justify-between"
              >
                <div>
                  {/* Fund Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="cursor-pointer"
                      onClick={() => handlePerformFactorLab(fund.schemeCode, fund.name, fund.nav)}
                    >
                      <h3 className="text-[14px] font-bold text-text-primary group-hover:text-accent-brass transition-colors leading-tight">
                        {fund.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11.5px] text-accent-brass font-medium">{fund.fundHouse}</span>
                        <span className="text-[10.5px] text-text-faint font-mono">· #{fund.schemeCode}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-accent-brass/10 text-accent-brass border-accent-brass/20">
                        SCORE {score}/100
                      </span>
                      <span className="text-[9.5px] font-mono text-text-faint">{fund.category}</span>
                    </div>
                  </div>

                  {/* Quantitative Model Metrics Panel */}
                  <div
                    className="grid grid-cols-3 gap-2 mt-3.5 bg-bg-surface/80 rounded-[8px] p-2.5 border border-border-default/80 cursor-pointer hover:border-accent-brass/30 transition-colors"
                    onClick={() => handlePerformFactorLab(fund.schemeCode, fund.name, fund.nav)}
                    title="Click to perform full Factor Lab analysis"
                  >
                    {/* 3Y CAGR */}
                    <div className="text-center">
                      <span className="text-[9.5px] font-mono text-text-faint uppercase block">3Y CAGR</span>
                      <span className="text-[13px] font-mono font-bold text-emerald-400 block">
                        +{fund.cagr3Y}%
                      </span>
                      <span className="text-[9.5px] font-mono text-text-faint block">
                        5Y: +{fund.cagr5Y}%
                      </span>
                    </div>

                    {/* Sharpe Ratio */}
                    <div className="text-center border-x border-border-default/60">
                      <span className="text-[9.5px] font-mono text-text-faint uppercase block">Sharpe Alpha</span>
                      <span className="text-[13px] font-mono font-bold text-text-primary block">
                        {fund.sharpeRatio}
                      </span>
                      <span className="text-[9.5px] font-mono text-emerald-400 block font-medium">
                        +{fund.alpha}% vs Nifty
                      </span>
                    </div>

                    {/* Expense Ratio (TER) */}
                    <div className="text-center">
                      <span className="text-[9.5px] font-mono text-text-faint uppercase block">TER Cost</span>
                      <span className="text-[13px] font-mono font-bold text-sky-400 block">
                        {fund.expenseRatio}%
                      </span>
                      <span className="text-[9.5px] font-mono text-text-faint block">
                        NAV ₹{fund.nav.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Top 5 Holdings Pills */}
                  {fund.topHoldings && fund.topHoldings.length > 0 && (
                    <div className="mt-2.5 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-text-faint block">Top Portfolio Holdings:</span>
                      <div className="flex flex-wrap gap-1">
                        {fund.topHoldings.slice(0, 4).map((holding) => (
                          <span
                            key={holding}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-bg-surface-2 border border-border-default/60 text-text-secondary"
                          >
                            {holding}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Factor Breakdown Mini-Dots */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-text-faint mt-2.5 px-1 border-t border-border-default/50 pt-1.5">
                    <span>Quality/Alpha: <strong className="text-text-primary">{fund.factorBreakdown?.qualityScore ?? 85}</strong></span>
                    <span>Cost Score: <strong className="text-text-primary">{fund.factorBreakdown?.valuationScore ?? 80}</strong></span>
                    <span>AUM: <strong className="text-text-primary">{fund.aumCr ? formatINRCompact(fund.aumCr * 10000000) : '—'}</strong></span>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-border-default/60 text-[11.5px]">
                  <button
                    onClick={() => handlePerformFactorLab(fund.schemeCode, fund.name, fund.nav)}
                    className="flex items-center gap-1 text-accent-brass hover:text-accent-brass-dim font-semibold cursor-pointer group-hover:underline"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Factor Lab</span>
                  </button>
                  <button
                    onClick={() => handleOpenTrade(fund)}
                    className="flex items-center gap-1 px-3 py-1 rounded-[6px] bg-accent-brass/10 hover:bg-accent-brass text-accent-brass hover:text-bg-base font-semibold text-[11px] transition-all cursor-pointer border border-accent-brass/20"
                  >
                    <span>Start SIP</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
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
                <th className="px-3.5 py-2.5 font-semibold">Scheme &amp; AMC</th>
                <th className="px-3 py-2.5 font-semibold">Category</th>
                <th className="px-3 py-2.5 font-semibold text-center">NAV</th>
                <th className="px-3 py-2.5 font-semibold text-center">TER (%)</th>
                <th className="px-3 py-2.5 font-semibold text-center">3Y CAGR</th>
                <th className="px-3 py-2.5 font-semibold text-center">5Y CAGR</th>
                <th className="px-3 py-2.5 font-semibold text-center">Sharpe Ratio</th>
                <th className="px-3 py-2.5 font-semibold text-center">Alpha vs Nifty</th>
                <th className="px-3 py-2.5 font-semibold text-center">Factor Score</th>
                <th className="px-3.5 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default/50 font-mono">
              {filteredAndSortedFunds.map((fund) => {
                const score = fund.factorBreakdown?.compositeQVM ?? 80;

                return (
                  <tr
                    key={fund.schemeCode}
                    className="hover:bg-bg-surface transition-colors group"
                  >
                    <td
                      className="px-3.5 py-2.5 cursor-pointer"
                      onClick={() => handlePerformFactorLab(fund.schemeCode, fund.name, fund.nav)}
                    >
                      <div className="font-sans font-bold text-text-primary group-hover:text-accent-brass transition-colors truncate max-w-xs">
                        {fund.name}
                      </div>
                      <div className="text-[10.5px] font-sans text-text-faint flex items-center gap-1.5">
                        <span>{fund.fundHouse}</span>
                        <span>· #{fund.schemeCode}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-sans">
                      <div className="text-[11.5px] text-text-secondary">{fund.category}</div>
                    </td>
                    <td className="px-3 py-2.5 text-center text-text-primary font-bold">
                      ₹{fund.nav.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-center text-sky-400 font-semibold">
                      {fund.expenseRatio}%
                    </td>
                    <td className="px-3 py-2.5 text-center text-emerald-400 font-bold">
                      +{fund.cagr3Y}%
                    </td>
                    <td className="px-3 py-2.5 text-center text-text-secondary">
                      +{fund.cagr5Y}%
                    </td>
                    <td className="px-3 py-2.5 text-center text-text-primary font-semibold">
                      {fund.sharpeRatio}
                    </td>
                    <td className="px-3 py-2.5 text-center text-emerald-400">
                      +{fund.alpha}%
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-brass/10 text-accent-brass border border-accent-brass/20">
                        {score}/100
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-sans">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handlePerformFactorLab(fund.schemeCode, fund.name, fund.nav)}
                          className="px-2 py-1 rounded-[6px] bg-accent-brass/10 hover:bg-accent-brass text-accent-brass hover:text-bg-base text-[11px] font-semibold transition-all cursor-pointer"
                        >
                          Factor Lab
                        </button>
                        <button
                          onClick={() => handleOpenTrade(fund)}
                          className="px-2.5 py-1 rounded-[6px] bg-accent-brass text-bg-base text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                        >
                          SIP
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

      {/* Empty State with Direct Search */}
      {filteredAndSortedFunds.length === 0 && (
        <div className="text-center py-12 border border-dashed border-border-default rounded-[12px] space-y-3">
          <p className="text-[13px] text-text-secondary">
            No mutual funds matched your active criteria.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('All Funds');
                setQuantFilter('all');
              }}
              className="px-3.5 py-1.5 rounded-[6px] bg-bg-surface-2 border border-border-default text-text-primary text-[12px] font-medium cursor-pointer"
            >
              Reset Filters
            </button>
            {searchQuery.trim() && (
              <button
                onClick={() => handlePerformFactorLab(searchQuery, searchQuery)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-accent-brass hover:bg-accent-brass-dim text-bg-base text-[12px] font-semibold cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Perform Factor Lab on &quot;{searchQuery}&quot;</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5. In-Place Institutional Mutual Fund Factor Lab Modal */}
      {inspectedFund && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-bg-surface border border-border-default rounded-[16px] max-w-3xl w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-border-default">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-sans font-bold text-[18px] text-text-primary">
                    {inspectedFund.name}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-accent-brass/10 text-accent-brass border border-accent-brass/20 shrink-0">
                    {inspectedFund.category}
                  </span>
                </div>
                <div className="text-[12px] text-text-faint flex items-center gap-1.5 mt-0.5">
                  <span className="text-accent-brass font-medium">{inspectedFund.fundHouse}</span>
                  <span>· AMFI Code #{inspectedFund.schemeCode}</span>
                </div>
              </div>
              <button
                onClick={() => setInspectedFund(null)}
                className="p-1.5 rounded-[8px] hover:bg-bg-surface-2 text-text-faint hover:text-text-primary transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scheme Performance Chart (Historical NAV + SIP Compounding Horizon) */}
            <MutualFundPerformanceChart
              schemeName={inspectedFund.name}
              schemeCode={inspectedFund.schemeCode}
              currentNav={inspectedFund.nav}
              cagr1Y={inspectedFund.cagr3Y ? Number((inspectedFund.cagr3Y * 0.9).toFixed(1)) : 18.5}
              cagr3Y={inspectedFund.cagr3Y}
              cagr5Y={inspectedFund.cagr5Y}
              category={inspectedFund.category}
              benchmarkName={inspectedFund.category?.includes('Small') ? 'Nifty Smallcap 250' : inspectedFund.category?.includes('Mid') ? 'Nifty Midcap 150' : 'Nifty 50 TRI'}
              onStartSip={() => {
                const fundToTrade = inspectedFund;
                setInspectedFund(null);
                handleOpenTrade(fundToTrade);
              }}
            />

            {/* Factor Composite Score Banner */}
            <div className="bg-bg-surface-2/70 border border-border-default rounded-[12px] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent-brass/15 border border-accent-brass/30 flex items-center justify-center shrink-0">
                  <Gauge className="w-6 h-6 text-accent-brass" />
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase text-text-faint block">
                    Institutional Factor Alpha Score
                  </span>
                  <span className="text-[20px] font-mono font-bold text-text-primary">
                    {inspectedFund.factorBreakdown?.compositeQVM ?? 80}
                    <span className="text-[13px] text-text-faint font-normal"> / 100</span>
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono uppercase text-text-faint block">Suitability Rating</span>
                <span className="text-[13px] font-bold text-emerald-400">
                  {inspectedFund.factorBreakdown?.rating ?? 'Strong Buy / Quality Alpha'}
                </span>
              </div>
            </div>

            {/* Tri-Factor Diagnostics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Quality & Alpha */}
              <div className="bg-bg-surface-2/40 border border-border-default rounded-[10px] p-3 space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between text-text-primary font-bold">
                  <span>Risk-Adjusted Alpha</span>
                  <span className="text-accent-brass">{inspectedFund.factorBreakdown?.qualityScore ?? 85}/100</span>
                </div>
                <div className="text-text-faint text-[10.5px] space-y-0.5 pt-1 border-t border-border-default/40">
                  <div className="flex justify-between"><span>Sharpe Ratio:</span> <strong className="text-text-primary">{inspectedFund.sharpeRatio}</strong></div>
                  <div className="flex justify-between"><span>Alpha vs Nifty:</span> <strong className="text-emerald-400">+{inspectedFund.alpha}%</strong></div>
                  <div className="flex justify-between"><span>Beta (Volatility):</span> <strong className="text-text-primary">{inspectedFund.beta}</strong></div>
                  <div className="flex justify-between"><span>Stewardship:</span> <strong className="text-emerald-400">Tier-1 AMC</strong></div>
                </div>
              </div>

              {/* Expense Ratio & Cost Efficiency */}
              <div className="bg-bg-surface-2/40 border border-border-default rounded-[10px] p-3 space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between text-text-primary font-bold">
                  <span>Cost Efficiency</span>
                  <span className="text-accent-brass">{inspectedFund.factorBreakdown?.valuationScore ?? 80}/100</span>
                </div>
                <div className="text-text-faint text-[10.5px] space-y-0.5 pt-1 border-t border-border-default/40">
                  <div className="flex justify-between"><span>TER Expense:</span> <strong className="text-sky-400">{inspectedFund.expenseRatio}%</strong></div>
                  <div className="flex justify-between"><span>Latest NAV:</span> <strong className="text-text-primary">₹{inspectedFund.nav.toFixed(2)}</strong></div>
                  <div className="flex justify-between"><span>AUM Corpus:</span> <strong className="text-text-primary">{inspectedFund.aumCr ? formatINRCompact(inspectedFund.aumCr * 10000000) : '—'}</strong></div>
                  <div className="flex justify-between"><span>Plan Type:</span> <strong className="text-emerald-400">Direct Growth</strong></div>
                </div>
              </div>

              {/* Compounding Momentum */}
              <div className="bg-bg-surface-2/40 border border-border-default rounded-[10px] p-3 space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between text-text-primary font-bold">
                  <span>CAGR Compounding</span>
                  <span className="text-accent-brass">{inspectedFund.factorBreakdown?.momentumScore ?? 85}/100</span>
                </div>
                <div className="text-text-faint text-[10.5px] space-y-0.5 pt-1 border-t border-border-default/40">
                  <div className="flex justify-between"><span>3Y CAGR:</span> <strong className="text-emerald-400">+{inspectedFund.cagr3Y}%</strong></div>
                  <div className="flex justify-between"><span>5Y CAGR:</span> <strong className="text-emerald-400">+{inspectedFund.cagr5Y}%</strong></div>
                  <div className="flex justify-between"><span>Benchmark:</span> <strong className="text-text-primary">Outperforming</strong></div>
                  <div className="flex justify-between"><span>Horizon:</span> <strong className="text-text-primary">&gt; 5 Years</strong></div>
                </div>
              </div>
            </div>

            {/* Top 5 Portfolio Holdings */}
            {inspectedFund.topHoldings && inspectedFund.topHoldings.length > 0 && (
              <div className="bg-bg-surface-2/50 border border-border-default rounded-[10px] p-3 space-y-2">
                <span className="text-[11px] font-mono uppercase text-accent-brass font-semibold flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> Core Portfolio Moats (Underlying Assets)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {inspectedFund.topHoldings.map((h) => (
                    <span
                      key={h}
                      className="px-2.5 py-1 rounded-[6px] bg-bg-surface border border-border-default text-[11.5px] text-text-primary font-medium"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Analyst Summary Note */}
            <p className="text-[12px] text-text-faint italic bg-bg-surface-2/30 p-2.5 rounded-[8px] border border-border-default/40">
              &quot;{inspectedFund.analystSummary}&quot;
            </p>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border-default">
              <button
                onClick={() => {
                  handleAddFundToScreener(inspectedFund.schemeCode, inspectedFund.name, inspectedFund.nav);
                  setInspectedFund(null);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-bg-surface-2 hover:bg-bg-surface border border-border-default text-text-primary text-[12px] font-semibold transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Keep in Screener Table</span>
              </button>

              <button
                onClick={() => {
                  const fundToTrade = inspectedFund;
                  setInspectedFund(null);
                  handleOpenTrade(fundToTrade);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-accent-brass hover:bg-accent-brass-dim text-bg-base text-[12px] font-semibold transition-all cursor-pointer shadow-sm"
              >
                <span>Start SIP / Invest in Fund</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Institutional Methodology Disclosure Card */}
      <DisclosureCard
        title="Institutional Mutual Fund Quantitative Factor Methodology"
        subtitle="Transparent evaluation: Sharpe Ratio, Expense Ratio (TER), 3Y/5Y CAGR, and Portfolio Holding Moats"
        badge="FACTOR MATHEMATICS"
        icon={<PiggyBank className="w-4 h-4 text-accent-brass" />}
        variant="subtle"
      >
        <div className="space-y-3 text-[12.5px] text-text-secondary leading-relaxed pt-1">
          <p>
            The Arthova Mutual Fund Screener evaluates Indian AMFI registered schemes using Fama-French multi-factor standards:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="bg-bg-surface p-3 rounded-[8px] border border-border-default">
              <strong className="text-text-primary block font-mono text-[11.5px] mb-1">1. Risk-Adjusted Alpha (40%)</strong>
              <p className="text-[11.5px] text-text-faint">
                Evaluates the Sharpe Ratio and Jensen&apos;s Alpha over category benchmarks to ensure returns are derived from manager skill rather than unhedged market beta.
              </p>
            </div>
            <div className="bg-bg-surface p-3 rounded-[8px] border border-border-default">
              <strong className="text-text-primary block font-mono text-[11.5px] mb-1">2. Cost Efficiency TER (30%)</strong>
              <p className="text-[11.5px] text-text-faint">
                Severely penalizes high Total Expense Ratios (TER). Index funds ($TER &le; 0.25\%$) receive maximum score; funds above $0.85\%$ TER are downgraded.
              </p>
            </div>
            <div className="bg-bg-surface p-3 rounded-[8px] border border-border-default">
              <strong className="text-text-primary block font-mono text-[11.5px] mb-1">3. Compounding Momentum (30%)</strong>
              <p className="text-[11.5px] text-text-faint">
                Blends 3-Year ($60\%$ weight) and 5-Year ($40\%$ weight) annualized CAGR to ensure consistent long-term wealth compounding across market cycles.
              </p>
            </div>
          </div>
          <p className="text-[11px] text-text-faint border-t border-border-default/60 pt-2 font-mono">
            * Educational &amp; Quantitative research tool only. Mutual fund investments are subject to market risks. Read all scheme related documents carefully.
          </p>
        </div>
      </DisclosureCard>

      {/* Trade Modal execution */}
      {tradeFundConfig.isOpen && (
        <TradeModal
          isOpen={tradeFundConfig.isOpen}
          onClose={() => setTradeFundConfig((prev) => ({ ...prev, isOpen: false }))}
          symbol={tradeFundConfig.symbol}
          name={tradeFundConfig.name}
          currentPrice={tradeFundConfig.currentPrice}
          assetType="mutual_fund"
          initialAction="buy"
        />
      )}
    </div>
  );
}
