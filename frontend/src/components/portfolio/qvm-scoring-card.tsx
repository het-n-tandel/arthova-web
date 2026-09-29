'use client';

import { useState, useMemo } from 'react';
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
  Info
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
  StockSuitabilityResult
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

  const livePrices = useLedgerStore((s) => s.livePrices);
  const portfolio = usePortfolio();
  const holdings = propStockHoldings || portfolio.stockHoldings || [];

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

  // If user searched a custom ticker not in registry, dynamically evaluate it
  const isCustomStock =
    searchQuery.trim().length > 1 &&
    filteredStocks.length === 0 &&
    assetType === 'stocks';

  const customProfile = useMemo(() => {
    if (!isCustomStock) return null;
    return getStockFactorProfile(searchQuery.trim());
  }, [isCustomStock, searchQuery]);

  // Active stock profile
  const activeStock = useMemo(() => {
    if (customProfile && customProfile.symbol === activeStockSymbol) return customProfile;
    const found = stockProfiles.find((s) => s.symbol === activeStockSymbol);
    if (found) return found;
    if (customProfile) return customProfile;
    return filteredStocks[0] || stockProfiles[0];
  }, [activeStockSymbol, stockProfiles, customProfile, filteredStocks]);

  // Mutual funds data
  const allMFs: MutualFundFactorData[] = useMemo(() => [
    ...getTopMutualFundsByCategory('Large Cap'),
    ...getTopMutualFundsByCategory('Mid Cap'),
    ...getTopMutualFundsByCategory('Small Cap'),
  ], []);

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

  const activeMF = allMFs.find((m) => m.schemeCode === activeMFCode) || filteredMFs[0] || allMFs[0];

  const isMF = assetType === 'mutual_funds';
  const factorBreakdown = isMF ? activeMF.factorBreakdown : activeStock.factorBreakdown;

  // Personal Suitability Assessment for active stock
  const suitability: StockSuitabilityResult = useMemo(() => {
    return evaluateStockSuitability(
      activeStock,
      userProfile ? {
        riskAppetite: userProfile.riskAndInsurance?.riskAppetite || 'Medium',
        horizonYears: userProfile.goalExecutionPlan?.[0]?.horizonYears || 10,
        primaryGoal: userProfile.goalExecutionPlan?.[0]?.goal || 'Wealth Compounding',
      } : undefined,
      holdings
    );
  }, [activeStock, userProfile, holdings]);

  const userRiskLabel = userProfile?.riskAndInsurance?.riskAppetite || 'Moderate';

  const quickPicks = [
    { label: 'TCS', sym: 'TCS.NS' },
    { label: 'Reliance', sym: 'RELIANCE.NS' },
    { label: 'Tata Motors', sym: 'TATAMOTORS.NS' },
    { label: 'Zomato', sym: 'ZOMATO.NS' },
    { label: 'HAL', sym: 'HAL.NS' },
    { label: 'BEL', sym: 'BEL.NS' },
    { label: 'CDSL', sym: 'CDSL.NS' },
    { label: 'ITC', sym: 'ITC.NS' },
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
                {isMF ? 'Sharpe & Alpha Screened' : 'Piotroski (0-9) & Altman Z'}
              </span>
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              40% Quality (ROE / Balance Sheet) + 30% Valuation (Margin of Safety) + 30% Momentum (Relative Strength)
            </p>
          </div>
        </div>

        {/* Vehicle Switcher & Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Asset Type Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-surface-2 border border-border-default text-xs">
            <button
              onClick={() => { setAssetType('stocks'); setSearchQuery(''); }}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer',
                !isMF ? 'bg-accent-brass text-bg-base font-semibold shadow-sm' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Direct Stocks</span>
            </button>
            <button
              onClick={() => { setAssetType('mutual_funds'); setSearchQuery(''); }}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer',
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
                    ? 'bg-bg-surface text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {cat === 'ALL' ? 'All Tiers' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Instant Search Bar & Popular Quick Filters */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isMF ? "Search mutual funds by name or AMC (e.g. Parag Parikh, Nippon, Quant)..." : "Search any Indian stock (e.g. ZOMATO, TATAMOTORS, HAL, BEL, ITC, BAJFINANCE)..."}
            className="w-full bg-bg-surface-2/70 border border-border-default rounded-xl pl-10 pr-9 py-2.5 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-brass transition-all font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-primary p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Ticker Chips for Stocks */}
        {!isMF && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono">
            <span className="text-text-faint shrink-0 pr-1">Popular:</span>
            {quickPicks.map((p) => (
              <button
                key={p.sym}
                onClick={() => {
                  setActiveStockSymbol(p.sym);
                  setSearchQuery('');
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
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Selector List (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-2 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
          {/* Custom On-The-Fly Ticker Result */}
          {isCustomStock && customProfile && (
            <div
              onClick={() => setActiveStockSymbol(customProfile.symbol)}
              className={cn(
                'p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between',
                activeStock.symbol === customProfile.symbol
                  ? 'border-accent-brass bg-accent-brass/10 ring-1 ring-accent-brass/40 shadow-sm'
                  : 'border-accent-brass/40 bg-accent-brass/5 hover:bg-accent-brass/10'
              )}
            >
              <div className="min-w-0 flex-1 pr-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono text-accent-brass bg-accent-brass/15 border border-accent-brass/30">
                    ⚡ Dynamic Lookup
                  </span>
                  <span className="font-semibold text-xs text-text-primary truncate">
                    {customProfile.name}
                  </span>
                </div>
                <div className="text-[11px] text-text-faint font-mono">
                  {customProfile.category} • {customProfile.sector}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[12px] font-mono font-bold text-accent-brass block">
                  {customProfile.factorBreakdown.compositeQVM}/100
                </span>
                <span className="text-[10px] text-text-faint font-mono">
                  F-Score {customProfile.piotroskiFScore}/9
                </span>
              </div>
            </div>
          )}

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
            ) : (
              <div className="p-8 text-center border border-dashed border-border-default rounded-xl">
                <p className="text-xs text-text-faint">No mutual fund matching &quot;{searchQuery}&quot;</p>
              </div>
            )
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
            ) : !isCustomStock ? (
              <div className="p-8 text-center border border-dashed border-border-default rounded-xl">
                <p className="text-xs text-text-faint">No stock found in registry matching &quot;{searchQuery}&quot;.</p>
                <p className="text-[11px] text-text-secondary mt-1">Press enter or type an exact ticker to run a dynamic scan.</p>
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
              <span className={cn('text-xs font-mono font-semibold px-2.5 py-1 rounded-full border self-start sm:self-auto', factorBreakdown.ratingColor)}>
                {factorBreakdown.rating}
              </span>
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

          {/* Personal Suitability Assessment (Dynamic Evaluation) */}
          {!isMF && (
            <div className="p-4 rounded-xl border border-border-default bg-bg-surface-2/70 space-y-3.5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-default pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-accent-brass/15 text-accent-brass">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-text-primary flex items-center gap-2">
                      Personal Suitability Assessment
                      <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-bg-surface border border-border-default text-text-secondary">
                        Profile: {userRiskLabel}
                      </span>
                    </h5>
                    <span className="text-[11px] text-text-faint">
                      Evaluated against your risk appetite, horizon & 10% concentration limit
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className={cn('text-xs font-mono font-semibold px-2.5 py-1 rounded-full border', suitability.verdictBadgeBg)}>
                    {suitability.verdict}
                  </span>
                  <span className="text-xs font-mono font-bold text-text-primary bg-bg-surface px-2 py-1 rounded-lg border border-border-default">
                    {suitability.overallScore}% Fit
                  </span>
                </div>
              </div>

              {/* 4 Factor Guardrail Checkpoints */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {Object.entries(suitability.checks).map(([key, check]) => (
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
                {suitability.recommendation}
              </div>

              {/* 1-Click Order Execution Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="text-xs text-text-faint flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-positive" />
                  <span>10% Single-Stock Ceiling Guardrail Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTradeAction('buy');
                      setIsTradeModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-positive hover:bg-positive/90 text-white transition-all shadow-sm"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Invest in {activeStock.symbol.replace('.NS', '')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTradeAction('sell');
                      setIsTradeModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-bg-surface hover:bg-bg-surface-2 border border-border-default text-text-secondary transition-all"
                  >
                    Manage / Sell
                  </button>
                </div>
              </div>
            </div>
          )}

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
        suitabilityVerdict={suitability.verdict}
        userRiskLabel={userRiskLabel}
      />
    </div>
  );
}
