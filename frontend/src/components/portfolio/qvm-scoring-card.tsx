'use client';

import { useState } from 'react';
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
  Layers
} from 'lucide-react';
import {
  INDIAN_EQUITY_FACTOR_REGISTRY,
  getStockFactorProfile,
  StockFactorData,
  MarketCapCategory,
  INDIAN_MUTUAL_FUND_REGISTRY,
  getTopMutualFundsByCategory,
  MutualFundFactorData,
} from '@/lib/factor-scoring';
import { formatINR, cn } from '@/lib/formatters';

export function QVMScoringCard() {
  const [assetType, setAssetType] = useState<'stocks' | 'mutual_funds'>('stocks');
  const [selectedCategory, setSelectedCategory] = useState<MarketCapCategory | 'ALL'>('ALL');
  const [activeStockSymbol, setActiveStockSymbol] = useState<string>('TCS.NS');
  const [activeMFCode, setActiveMFCode] = useState<string>('122639');

  // Stocks data
  const allSymbols = Object.keys(INDIAN_EQUITY_FACTOR_REGISTRY);
  const stockProfiles: StockFactorData[] = allSymbols.map((sym) => getStockFactorProfile(sym));
  const filteredStocks = stockProfiles.filter((s) => {
    if (selectedCategory === 'ALL') return true;
    return s.category === selectedCategory;
  });
  const activeStock = stockProfiles.find((s) => s.symbol === activeStockSymbol) || filteredStocks[0] || stockProfiles[0];

  // Mutual funds data
  const allMFs: MutualFundFactorData[] = [
    ...getTopMutualFundsByCategory('Large Cap'),
    ...getTopMutualFundsByCategory('Mid Cap'),
    ...getTopMutualFundsByCategory('Small Cap'),
  ];
  const filteredMFs = allMFs.filter((m) => {
    if (selectedCategory === 'ALL') return true;
    return m.category === selectedCategory;
  });
  const activeMF = allMFs.find((m) => m.schemeCode === activeMFCode) || filteredMFs[0] || allMFs[0];

  const isMF = assetType === 'mutual_funds';
  const factorBreakdown = isMF ? activeMF.factorBreakdown : activeStock.factorBreakdown;

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
              QVM Multi-Factor Quant Model
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent-brass/10 text-accent-brass border border-border-default">
                {isMF ? 'Sharpe & Alpha Screened' : 'Piotroski (0-9) & Altman Z'}
              </span>
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              40% Quality (ROE / Sharpe) + 30% Valuation (TER / PE Margin of Safety) + 30% Momentum (Relative Strength)
            </p>
          </div>
        </div>

        {/* Vehicle Switcher & Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Asset Type Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-surface-2 border border-border-default text-xs">
            <button
              onClick={() => setAssetType('stocks')}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer',
                !isMF ? 'bg-accent-brass text-bg-base font-semibold shadow-sm' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Direct Stocks</span>
            </button>
            <button
              onClick={() => setAssetType('mutual_funds')}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Selector List (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1">
          {isMF ? (
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
                      ? 'border-accent-brass bg-accent-brass/5 ring-1 ring-accent-brass/30'
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
                      ? 'border-accent-brass bg-accent-brass/5 ring-1 ring-accent-brass/30'
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
    </div>
  );
}
