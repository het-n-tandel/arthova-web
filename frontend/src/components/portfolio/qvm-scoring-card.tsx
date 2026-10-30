'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Search,
  SlidersHorizontal,
  PiggyBank,
  Award,
  Layers,
  X,
  Target,
  Info,
  Loader2,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  RefreshCw,
  Brain,
} from 'lucide-react';
import {
  INDIAN_EQUITY_FACTOR_REGISTRY,
  getStockFactorProfile,
  StockFactorData,
  MarketCapCategory,
  INDIAN_MUTUAL_FUND_REGISTRY,
  getTopMutualFundsByCategory,
  MutualFundFactorData,
  evaluateStockSuitability,
  StockSuitabilityResult,
  evaluateMutualFundSuitability,
  MutualFundSuitabilityResult,
  createDynamicMFProfile,
  getMutualFundFactorProfile
} from '@/lib/factor-scoring';
import { formatINR, cn } from '@/lib/formatters';
import { usePortfolio } from '@/lib/hooks/use-portfolio';
import { useLedgerStore } from '@/lib/store';
import { TradeModal } from './trade-modal';

interface QVMScoringCardProps {
  userProfile?: any;
  stockHoldings?: any[];
}

export function QVMScoringCard({ userProfile, stockHoldings: propStockHoldings }: QVMScoringCardProps) {
  const [assetType, setAssetType] = useState<'stocks' | 'mutual_funds'>('stocks');
  const [selectedCategory, setSelectedCategory] = useState<MarketCapCategory | 'ALL'>('ALL');
  const [activeStockSymbol, setActiveStockSymbol] = useState<string>('TCS.NS');
  const [activeMFCode, setActiveMFCode] = useState<string>('122639');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell'>('buy');

  // Live Dynamic Search State
  const [liveSearchResults, setLiveSearchResults] = useState<any[]>([]);
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [dynamicCustomStocks, setDynamicCustomStocks] = useState<Record<string, StockFactorData>>({});
  const [dynamicCustomMFs, setDynamicCustomMFs] = useState<Record<string, MutualFundFactorData>>({});

  const livePrices = useLedgerStore((s) => s.livePrices);
  const portfolio = usePortfolio();
  const holdings = propStockHoldings || portfolio.stockHoldings || [];

  // Debounced Live Quant Search across all Indian Equities & AMFI Mutual Funds
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query || query.length < 2) {
      setLiveSearchResults([]);
      setIsSearchingLive(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLive(true);
      try {
        const targetType = assetType === 'mutual_funds' ? 'mutual_fund' : 'stock';
        const res = await fetch(`/api/ai/search?q=${encodeURIComponent(query)}&type=${targetType}`);
        if (res.ok) {
          const data = await res.json();
          const items = data.suggestions || [];
          setLiveSearchResults(items);

          if (assetType === 'mutual_funds') {
            const newMap: Record<string, MutualFundFactorData> = {};
            items.forEach((item: any) => {
              newMap[item.symbol] = createDynamicMFProfile(item.symbol, item.name, {
                nav: item.price,
              });
            });
            setDynamicCustomMFs(prev => ({ ...prev, ...newMap }));
          } else {
            const newMap: Record<string, StockFactorData> = {};
            items.forEach((item: any) => {
              newMap[item.symbol] = getStockFactorProfile(item.symbol);
            });
            setDynamicCustomStocks(prev => ({ ...prev, ...newMap }));
          }
        }
      } catch (err) {
        console.error('Failed to run live quant search:', err);
      } finally {
        setIsSearchingLive(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, assetType]);

  // Curated stocks
  const allSymbols = Object.keys(INDIAN_EQUITY_FACTOR_REGISTRY);
  const stockProfiles: StockFactorData[] = useMemo(() => {
    return allSymbols.map((sym) => getStockFactorProfile(sym));
  }, [allSymbols]);

  // Filtered stocks based on category & search query
  const filteredStocks = useMemo(() => {
    return stockProfiles.filter((s) => {
      const matchesCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.sector.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [stockProfiles, selectedCategory, searchQuery]);

  // Active stock profile (resolves pre-loaded or dynamic live searched stock)
  const activeStock: StockFactorData = useMemo(() => {
    if (dynamicCustomStocks[activeStockSymbol]) return dynamicCustomStocks[activeStockSymbol];
    const found = stockProfiles.find((s) => s.symbol === activeStockSymbol);
    if (found) return found;
    return filteredStocks[0] || stockProfiles[0];
  }, [activeStockSymbol, stockProfiles, filteredStocks, dynamicCustomStocks]);

  // Mutual funds data
  const allMFs: MutualFundFactorData[] = useMemo(() => {
    return Object.keys(INDIAN_MUTUAL_FUND_REGISTRY).map(code => getMutualFundFactorProfile(code));
  }, []);

  const filteredMFs = useMemo(() => {
    return allMFs.filter((m) => {
      const matchesCategory = selectedCategory === 'ALL' || m.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.fundHouse.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allMFs, selectedCategory, searchQuery]);

  // Active MF profile (resolves pre-loaded or dynamic live AMFI searched fund)
  const activeMF: MutualFundFactorData = useMemo(() => {
    if (dynamicCustomMFs[activeMFCode]) return dynamicCustomMFs[activeMFCode];
    const found = allMFs.find((m) => m.schemeCode === activeMFCode);
    if (found) return found;
    return filteredMFs[0] || allMFs[0];
  }, [activeMFCode, allMFs, filteredMFs, dynamicCustomMFs]);

  const isMF = assetType === 'mutual_funds';
  const factorBreakdown = isMF ? activeMF.factorBreakdown : activeStock.factorBreakdown;

  // Personal Suitability Assessment for active stock
  const stockSuitability: StockSuitabilityResult = useMemo(() => {
    return evaluateStockSuitability(
      activeStock,
      userProfile ? {
        riskAppetite: userProfile.riskAndInsurance?.riskAppetite || userProfile.riskTolerance || 'Medium',
        horizonYears: userProfile.goalExecutionPlan?.[0]?.horizonYears || 10,
        primaryGoal: userProfile.goalExecutionPlan?.[0]?.goal || 'Wealth Compounding',
      } : undefined,
      holdings
    );
  }, [activeStock, userProfile, holdings]);

  // Personal Suitability Assessment for active mutual fund
  const mfSuitability: MutualFundSuitabilityResult = useMemo(() => {
    return evaluateMutualFundSuitability(
      activeMF,
      userProfile ? {
        riskAppetite: userProfile.riskAndInsurance?.riskAppetite || userProfile.riskTolerance || 'Medium',
        horizonYears: userProfile.goalExecutionPlan?.[0]?.horizonYears || 10,
        primaryGoal: userProfile.goalExecutionPlan?.[0]?.goal || 'Wealth Compounding',
      } : undefined,
      holdings
    );
  }, [activeMF, userProfile, holdings]);

  const userRiskLabel = userProfile?.riskAndInsurance?.riskAppetite || userProfile?.riskTolerance || 'Moderate';

  const quickStockPicks = [
    { label: 'TCS', sym: 'TCS.NS' },
    { label: 'Reliance', sym: 'RELIANCE.NS' },
    { label: 'Tata Motors', sym: 'TATAMOTORS.NS' },
    { label: 'Zomato', sym: 'ZOMATO.NS' },
    { label: 'HAL', sym: 'HAL.NS' },
    { label: 'BEL', sym: 'BEL.NS' },
    { label: 'Wipro', sym: 'WIPRO.NS' },
    { label: 'CDSL', sym: 'CDSL.NS' },
    { label: 'ITC', sym: 'ITC.NS' },
    { label: 'IRFC', sym: 'IRFC.NS' },
  ];

  const quickMFPicks = [
    { label: 'Parag Parikh Flexi', code: '122639' },
    { label: 'UTI Nifty 50', code: '120716' },
    { label: 'Nippon Small Cap', code: '118778' },
    { label: 'Tata Digital India', code: '135800' },
    { label: 'Quant Active', code: '120847' },
    { label: 'HDFC Mid-Cap', code: '118955' },
    { label: 'ICICI Bluechip', code: '100033' },
    { label: 'SBI Small Cap', code: '125497' },
  ];

  return (
    <div className="rounded-2xl border border-border-default bg-bg-surface p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-default">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent-brass/10 border border-border-default text-accent-brass">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
              QVM Multi-Factor Quant Screener & Suitability Engine
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent-brass/10 text-accent-brass border border-border-default">
                {isMF ? 'AMFI & Sharpe Verified' : 'Piotroski (0-9) & Altman Z'}
              </span>
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              40% Quality (ROE / Capital Efficiency) + 30% Valuation (Margin of Safety) + 30% Momentum (Relative Alpha)
            </p>
          </div>
        </div>

        {/* Vehicle Switcher & Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Asset Type Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-surface-2 border border-border-default text-xs">
            <button
              onClick={() => { setAssetType('stocks'); setSearchQuery(''); setLiveSearchResults([]); }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer',
                !isMF ? 'bg-accent-brass text-bg-base font-semibold shadow-sm' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Direct Equities</span>
            </button>
            <button
              onClick={() => { setAssetType('mutual_funds'); setSearchQuery(''); setLiveSearchResults([]); }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer',
                isMF ? 'bg-accent-brass text-bg-base font-semibold shadow-sm' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <PiggyBank className="w-3.5 h-3.5" />
              <span>Mutual Funds</span>
            </button>
          </div>

          {/* Market Cap Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-surface-2 border border-border-default text-xs">
            {(['ALL', 'Large Cap', 'Mid Cap', 'Small Cap'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer',
                  selectedCategory === cat
                    ? 'bg-bg-surface text-text-primary shadow-sm font-semibold'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {cat === 'ALL' ? 'All Tiers' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Universal Search Bar & Fast Ticker Chips */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isMF
                ? 'Search any Indian mutual fund across all AMCs (e.g. Parag Parikh, Tata Digital, SBI Small Cap, Quant, Mirae)...'
                : 'Search any Indian equity (e.g. WIPRO, TATAPOWER, IRFC, RELIANCE, ZOMATO, INFY, HAL, BEL)...'
            }
            className="w-full bg-bg-surface-2/70 border border-border-default rounded-xl pl-10 pr-9 py-2.5 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-brass transition-all font-mono"
          />
          {isSearchingLive ? (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 text-accent-brass animate-spin" />
            </div>
          ) : searchQuery ? (
            <button
              onClick={() => { setSearchQuery(''); setLiveSearchResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-primary p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {/* Popular Quick Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono custom-scrollbar">
          <span className="text-text-faint shrink-0 pr-1">Popular:</span>
          {isMF
            ? quickMFPicks.map((p) => (
                <button
                  key={p.code}
                  onClick={() => {
                    setActiveMFCode(p.code);
                    setSearchQuery('');
                    setLiveSearchResults([]);
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-lg border transition-all cursor-pointer shrink-0',
                    activeMF.schemeCode === p.code
                      ? 'bg-accent-brass/10 border-accent-brass text-accent-brass font-medium'
                      : 'bg-bg-surface-2 border-border-default text-text-secondary hover:text-text-primary'
                  )}
                >
                  {p.label}
                </button>
              ))
            : quickStockPicks.map((p) => (
                <button
                  key={p.sym}
                  onClick={() => {
                    setActiveStockSymbol(p.sym);
                    setSearchQuery('');
                    setLiveSearchResults([]);
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-lg border transition-all cursor-pointer shrink-0',
                    activeStock.symbol === p.sym
                      ? 'bg-accent-brass/10 border-accent-brass text-accent-brass font-medium'
                      : 'bg-bg-surface-2 border-border-default text-text-secondary hover:text-text-primary'
                  )}
                >
                  {p.label}
                </button>
              ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Selector List (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-2 max-h-[560px] overflow-y-auto pr-1 custom-scrollbar">
          {/* Live Market Dynamic Results Section */}
          {liveSearchResults.length > 0 && (
            <div className="space-y-1.5 pb-2 mb-2 border-b border-border-default">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Live Search Discoveries ({liveSearchResults.length})
                </span>
                <span className="text-[10px] text-text-faint font-mono">Real-time quote</span>
              </div>
              {liveSearchResults.map((item) => {
                const isSelected = isMF
                  ? item.symbol === activeMF.schemeCode
                  : item.symbol === activeStock.symbol;
                return (
                  <div
                    key={item.symbol}
                    onClick={() => {
                      if (isMF) {
                        setActiveMFCode(item.symbol);
                      } else {
                        setActiveStockSymbol(item.symbol);
                      }
                    }}
                    className={cn(
                      'p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between',
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/40 shadow-sm'
                        : 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10'
                    )}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono text-emerald-300 bg-emerald-500/20">
                          {isMF ? 'AMFI Fund' : 'NSE/BSE'}
                        </span>
                        <span className="font-semibold text-xs text-text-primary truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-text-faint font-mono truncate">
                        {item.symbol} • {item.aiRationale || 'Quant Scanned'}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {item.price !== undefined && (
                        <span className="text-[12px] font-mono font-bold text-emerald-400 block">
                          ₹{Number(item.price).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      )}
                      <span className="text-[10px] text-text-faint font-mono">
                        Click to Score →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Curated & Catalog Assets */}
          {isMF ? (
            filteredMFs.length > 0 ? (
              filteredMFs.map((mf) => {
                const isSelected = mf.schemeCode === activeMF.schemeCode;
                const qvm = mf.factorBreakdown.compositeQVM;
                return (
                  <div
                    key={mf.schemeCode}
                    onClick={() => setActiveMFCode(mf.schemeCode)}
                    className={cn(
                      'p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between',
                      isSelected
                        ? 'border-accent-brass bg-accent-brass/5 ring-1 ring-accent-brass/30 shadow-sm'
                        : 'border-border-default bg-bg-surface-2/50 hover:bg-bg-surface-2 hover:border-border-strong'
                    )}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-xs text-text-primary truncate">
                          {mf.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-text-faint font-mono">
                        <span>{mf.category}</span>
                        <span>•</span>
                        <span className="text-positive font-medium">3Y: {mf.cagr3Y}%</span>
                        <span>•</span>
                        <span>TER: {mf.expenseRatio}%</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[12px] font-mono font-bold text-accent-brass block">
                        {qvm}/100
                      </span>
                      <span className="text-[10px] text-text-faint font-mono">
                        Sharpe {mf.sharpeRatio}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : liveSearchResults.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border-default rounded-xl">
                <p className="text-xs text-text-faint">No mutual fund found matching &quot;{searchQuery}&quot;</p>
                <p className="text-[11px] text-text-secondary mt-1">Live AMFI search runs automatically as you type.</p>
              </div>
            ) : null
          ) : (
            filteredStocks.length > 0 ? (
              filteredStocks.map((stock) => {
                const isSelected = stock.symbol === activeStock.symbol;
                const qvm = stock.factorBreakdown.compositeQVM;

                return (
                  <div
                    key={stock.symbol}
                    onClick={() => setActiveStockSymbol(stock.symbol)}
                    className={cn(
                      'p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between',
                      isSelected
                        ? 'border-accent-brass bg-accent-brass/5 ring-1 ring-accent-brass/30 shadow-sm'
                        : 'border-border-default bg-bg-surface-2/50 hover:bg-bg-surface-2 hover:border-border-strong'
                    )}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-xs text-text-primary truncate">
                          {stock.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono text-text-faint bg-bg-surface border border-border-default">
                          {stock.symbol.replace('.NS', '')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-text-faint font-mono">
                        <span>{stock.category}</span>
                        <span>•</span>
                        <span>{stock.sector}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[12px] font-mono font-bold text-accent-brass block">
                        {qvm}/100
                      </span>
                      <span className="text-[10px] text-text-faint font-mono">
                        F-Score {stock.piotroskiFScore}/9
                      </span>
                    </div>
                  </div>
                );
              })
            ) : liveSearchResults.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border-default rounded-xl">
                <p className="text-xs text-text-faint">No stock found in local registry matching &quot;{searchQuery}&quot;</p>
                <p className="text-[11px] text-text-secondary mt-1">Live market scan runs automatically as you type.</p>
              </div>
            ) : null
          )}
        </div>

        {/* Right: Detailed Deep Dive Card (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Active Summary Banner */}
          <div className="p-4 rounded-xl border border-border-default bg-bg-surface-2/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div>
                <h4 className="text-sm font-semibold text-text-primary">
                  {isMF ? activeMF.name : activeStock.name}
                </h4>
                <p className="text-xs text-text-faint font-mono mt-0.5">
                  {isMF
                    ? `${activeMF.category} • ${activeMF.fundHouse} • AUM: ₹${activeMF.aumCr.toLocaleString('en-IN')} Cr`
                    : `${activeStock.symbol} • ${activeStock.category} • ${activeStock.sector}`}
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className={cn('text-xs font-mono font-semibold px-2.5 py-1 rounded-full border', factorBreakdown.ratingColor)}>
                  {factorBreakdown.rating}
                </span>
                <span className="text-xs font-mono font-bold text-accent-brass bg-accent-brass/10 border border-accent-brass/30 px-2.5 py-1 rounded-full">
                  QVM: {factorBreakdown.compositeQVM}/100
                </span>
              </div>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed italic border-t border-border-default pt-2 mt-2">
              &ldquo;{isMF ? activeMF.analystSummary : activeStock.analystSummary}&rdquo;
            </p>
          </div>

          {/* Tri-Factor Gauges (Quality, Valuation, Momentum) */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-border-default bg-bg-surface-2/40 space-y-1">
              <span className="text-[11px] font-mono uppercase text-text-faint block">Quality (40%)</span>
              <div className="text-lg font-bold font-mono text-positive">
                {factorBreakdown.qualityScore}/100
              </div>
              <div className="w-full h-1.5 bg-bg-surface rounded-full overflow-hidden">
                <div className="h-full bg-positive rounded-full" style={{ width: `${factorBreakdown.qualityScore}%` }} />
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border-default bg-bg-surface-2/40 space-y-1">
              <span className="text-[11px] font-mono uppercase text-text-faint block">Valuation / Cost (30%)</span>
              <div className="text-lg font-bold font-mono text-accent-brass">
                {factorBreakdown.valuationScore}/100
              </div>
              <div className="w-full h-1.5 bg-bg-surface rounded-full overflow-hidden">
                <div className="h-full bg-accent-brass rounded-full" style={{ width: `${factorBreakdown.valuationScore}%` }} />
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border-default bg-bg-surface-2/40 space-y-1">
              <span className="text-[11px] font-mono uppercase text-text-faint block">Momentum (30%)</span>
              <div className="text-lg font-bold font-mono text-info-indigo">
                {factorBreakdown.momentumScore}/100
              </div>
              <div className="w-full h-1.5 bg-bg-surface rounded-full overflow-hidden">
                <div className="h-full bg-info-indigo rounded-full" style={{ width: `${factorBreakdown.momentumScore}%` }} />
              </div>
            </div>
          </div>

          {/* Personal Suitability Assessment (Dynamic Evaluation for BOTH Stocks & MFs) */}
          <div className="p-4 rounded-xl border border-border-default bg-bg-surface-2/70 space-y-3.5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-default pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-accent-brass/15 text-accent-brass">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-text-primary flex items-center gap-2">
                    {isMF ? 'Mutual Fund Suitability Engine' : 'Personal Stock Suitability Engine'}
                    <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-bg-surface border border-border-default text-text-secondary">
                      Profile: {userRiskLabel}
                    </span>
                  </h5>
                  <span className="text-[11px] text-text-faint">
                    {isMF
                      ? 'Evaluated against your risk appetite, horizon, expense ratio & alpha persistence'
                      : 'Evaluated against your risk appetite, goal timeline & 10% portfolio concentration guardrail'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className={cn('text-xs font-mono font-semibold px-2.5 py-1 rounded-full border', isMF ? mfSuitability.verdictBadgeBg : stockSuitability.verdictBadgeBg)}>
                  {isMF ? mfSuitability.verdict : stockSuitability.verdict}
                </span>
                <span className="text-xs font-mono font-bold text-text-primary bg-bg-surface px-2 py-1 rounded-lg border border-border-default">
                  {isMF ? mfSuitability.overallScore : stockSuitability.overallScore}% Fit
                </span>
              </div>
            </div>

            {/* 4 Factor Guardrail Checkpoints */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {Object.entries(isMF ? mfSuitability.checks : stockSuitability.checks).map(([key, check]) => (
                <div key={key} className="p-2.5 rounded-lg border border-border-default bg-bg-surface/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-primary text-[11.5px]">{check.label}</span>
                    {check.status === 'passed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-positive shrink-0" />
                    ) : check.status === 'warning' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-warning shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-text-secondary leading-snug">
                    {check.detail}
                  </p>
                </div>
              ))}
            </div>

            {/* Summary Recommendation */}
            <div className="p-3 rounded-lg bg-accent-brass/5 border border-accent-brass/20 text-xs text-text-secondary leading-relaxed">
              <span className="font-semibold text-accent-brass block mb-0.5">AI Quant Verdict:</span>
              {isMF ? mfSuitability.recommendation : stockSuitability.recommendation}
            </div>

            {/* 1-Click Order Execution Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="text-xs text-text-faint flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-positive" />
                <span>Institutional Risk Guardrails Active</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!isMF && (
                  <a
                    href={`/dashboard/stocks/${activeStock.symbol.replace('.NS', '')}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600/15 hover:bg-violet-600/25 text-violet-400 border border-violet-500/30 transition-all cursor-pointer"
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>Signals &amp; ML Forecast →</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setTradeAction('buy');
                    setIsTradeModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-positive hover:bg-positive/90 text-white transition-all shadow-sm cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  {isMF ? `Start SIP in ${activeMF.name.split(' - ')[0]}` : `Invest in ${activeStock.symbol.replace('.NS', '')}`}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTradeAction('sell');
                    setIsTradeModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-bg-surface hover:bg-bg-surface-2 border border-border-default text-text-secondary transition-all cursor-pointer"
                >
                  Manage / Sell
                </button>
              </div>
            </div>
          </div>

          {/* Forensic / Fund Metrics Grid */}
          {isMF ? (
            <div className="p-4 rounded-xl border border-border-default bg-bg-surface-2/40 space-y-3">
              <span className="text-[11px] font-mono uppercase text-text-faint block">Institutional Fund Metrics</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-text-faint block text-[10.5px]">Expense Ratio</span>
                  <span className="font-mono font-medium text-positive">{activeMF.expenseRatio}% p.a.</span>
                </div>
                <div>
                  <span className="text-text-faint block text-[10.5px]">Sharpe Ratio</span>
                  <span className="font-mono font-medium text-text-primary">{activeMF.sharpeRatio}</span>
                </div>
                <div>
                  <span className="text-text-faint block text-[10.5px]">Alpha vs Index</span>
                  <span className="font-mono font-medium text-positive">+{activeMF.alpha}%</span>
                </div>
                <div>
                  <span className="text-text-faint block text-[10.5px]">Beta (Volatility)</span>
                  <span className="font-mono font-medium text-text-primary">{activeMF.beta}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-border-default">
                <span className="text-[10.5px] font-mono text-text-faint block mb-1">Top Holdings:</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeMF.topHoldings.map((h) => (
                    <span key={h} className="text-[11px] px-2 py-0.5 rounded bg-bg-surface border border-border-default text-text-secondary">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-border-default bg-bg-surface-2/40 space-y-3">
              <span className="text-[11px] font-mono uppercase text-text-faint block">Forensic Accounting Checkpoints</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-text-faint block text-[10.5px]">Piotroski F-Score</span>
                  <span className="font-mono font-medium text-positive">{activeStock.piotroskiFScore} / 9</span>
                </div>
                <div>
                  <span className="text-text-faint block text-[10.5px]">Altman Z-Zone</span>
                  <span className="font-mono font-medium text-positive">{activeStock.factorBreakdown.altmanZone} ({activeStock.altmanZScore})</span>
                </div>
                <div>
                  <span className="text-text-faint block text-[10.5px]">ROE / ROCE</span>
                  <span className="font-mono font-medium text-text-primary">{activeStock.roe}% / {activeStock.roce}%</span>
                </div>
                <div>
                  <span className="text-text-faint block text-[10.5px]">Debt to Equity</span>
                  <span className="font-mono font-medium text-text-primary">{activeStock.debtToEquity === 0 ? 'Zero Debt' : activeStock.debtToEquity}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trade Modal */}
      <TradeModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        symbol={isMF ? activeMF.schemeCode : activeStock.symbol}
        name={isMF ? activeMF.name : activeStock.name}
        currentPrice={
          isMF
            ? activeMF.nav
            : (livePrices.get(activeStock.symbol)?.price || holdings.find((h: any) => h.symbol === activeStock.symbol)?.cmp || 2500)
        }
        initialAction={tradeAction}
        assetType={isMF ? 'mutual_fund' : 'stock'}
        qvmScore={factorBreakdown.compositeQVM}
        suitabilityVerdict={isMF ? mfSuitability.verdict : stockSuitability.verdict}
        userRiskLabel={userRiskLabel}
      />
    </div>
  );
}
