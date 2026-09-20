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
} from 'lucide-react';
import {
  INDIAN_EQUITY_FACTOR_REGISTRY,
  getStockFactorProfile,
  StockFactorData,
  MarketCapCategory,
} from '@/lib/factor-scoring';

export function QVMScoringCard() {
  const [selectedCategory, setSelectedCategory] = useState<MarketCapCategory | 'ALL'>('ALL');
  const [activeStockSymbol, setActiveStockSymbol] = useState<string>('TCS.NS');

  const allSymbols = Object.keys(INDIAN_EQUITY_FACTOR_REGISTRY);
  const stockProfiles: StockFactorData[] = allSymbols.map((sym) => getStockFactorProfile(sym));

  const filteredStocks = stockProfiles.filter((s) => {
    if (selectedCategory === 'ALL') return true;
    return s.category === selectedCategory;
  });

  const activeProfile =
    stockProfiles.find((s) => s.symbol === activeStockSymbol) ||
    filteredStocks[0] ||
    stockProfiles[0];

  const { factorBreakdown } = activeProfile;

  return (
    <div className="rounded-2xl border border-border-default bg-bg-surface p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 pb-4 border-b border-border-default">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent-brass/10 border border-accent-brass/20 text-accent-brass">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
              QVM Multi-Factor Quant Model
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent-brass/15 text-accent-brass border border-accent-brass/30">
                Piotroski (0-9) &amp; Altman Z
              </span>
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              40% Quality (ROE/ROCE/Balance Sheet) + 30% Valuation (Margin of Safety) + 30% Momentum (Relative Strength)
            </p>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-surface-2 border border-border-default text-xs">
          {(['ALL', 'Large Cap', 'Mid Cap', 'Small Cap'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-bg-surface text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {cat === 'ALL' ? 'All Tiers' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Stock Factor Selector List (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1">
          {filteredStocks.map((stock) => {
            const isSelected = stock.symbol === activeProfile.symbol;
            const qvm = stock.factorBreakdown.compositeQVM;

            return (
              <div
                key={stock.symbol}
                onClick={() => setActiveStockSymbol(stock.symbol)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-150 flex items-center justify-between ${
                  isSelected
                    ? 'border-accent-brass bg-accent-brass/5 ring-1 ring-accent-brass/30'
                    : 'border-border-default bg-bg-surface-2/50 hover:bg-bg-surface-2 hover:border-border-strong'
                }`}
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-xs text-text-primary truncate">
                      {stock.name}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        stock.category === 'Large Cap'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : stock.category === 'Mid Cap'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {stock.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-text-faint">
                    <span>{stock.sector}</span>
                    <span>•</span>
                    <span className="font-mono">P/E {stock.pe}x</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-bold font-mono text-text-primary flex items-center justify-end gap-1">
                    <span>{qvm}</span>
                    <span className="text-[10px] font-normal text-text-faint">/100</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border inline-block mt-0.5 ${stock.factorBreakdown.ratingColor}`}>
                    {stock.factorBreakdown.rating.split('/')[0]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Detailed Factor Diagnostics (7 Cols) */}
        <div className="lg:col-span-7 rounded-xl border border-border-default bg-bg-surface-2/30 p-5 flex flex-col justify-between">
          <div>
            {/* Active Stock Title & Composite Gauge */}
            <div className="flex items-start justify-between gap-3 mb-5 pb-4 border-b border-border-default">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-text-primary">{activeProfile.name}</h4>
                  <span className="font-mono text-xs text-text-faint">({activeProfile.symbol})</span>
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {activeProfile.category} • {activeProfile.sector} • ₹{(activeProfile.marketCapCr / 1000).toFixed(1)}k Cr M-Cap
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black font-mono text-accent-brass leading-none">
                  {factorBreakdown.compositeQVM}
                  <span className="text-xs font-normal text-text-faint ml-1">QVM Index</span>
                </div>
                <div className={`text-[11px] font-medium px-2 py-0.5 rounded border inline-block mt-1.5 ${factorBreakdown.ratingColor}`}>
                  {factorBreakdown.rating}
                </div>
              </div>
            </div>

            {/* Tri-Factor Breakdown Bars (Quality 40%, Valuation 30%, Momentum 30%) */}
            <div className="space-y-3.5 mb-5">
              {/* Quality */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-text-primary flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    Quality Factor (40% Weight)
                  </span>
                  <span className="font-mono font-bold text-blue-400">{factorBreakdown.qualityScore}/100</span>
                </div>
                <div className="h-2 bg-bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${factorBreakdown.qualityScore}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-text-faint mt-1 font-mono">
                  <span>ROE: {activeProfile.roe}%</span>
                  <span>ROCE: {activeProfile.roce}%</span>
                  <span>Debt/Eq: {activeProfile.debtToEquity}</span>
                </div>
              </div>

              {/* Valuation */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-text-primary flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-amber-400" />
                    Valuation Factor (30% Weight)
                  </span>
                  <span className="font-mono font-bold text-amber-400">{factorBreakdown.valuationScore}/100</span>
                </div>
                <div className="h-2 bg-bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${factorBreakdown.valuationScore}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-text-faint mt-1 font-mono">
                  <span>P/E: {activeProfile.pe}x</span>
                  <span>Industry P/E: {activeProfile.industryPE}x</span>
                  <span>
                    {activeProfile.pe <= activeProfile.industryPE
                      ? `${Math.round(((activeProfile.industryPE - activeProfile.pe) / activeProfile.industryPE) * 100)}% Discount`
                      : `${Math.round(((activeProfile.pe - activeProfile.industryPE) / activeProfile.industryPE) * 100)}% Premium`}
                  </span>
                </div>
              </div>

              {/* Momentum */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-text-primary flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    Momentum Factor (30% Weight)
                  </span>
                  <span className="font-mono font-bold text-emerald-400">{factorBreakdown.momentumScore}/100</span>
                </div>
                <div className="h-2 bg-bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${factorBreakdown.momentumScore}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-text-faint mt-1 font-mono">
                  <span>3M Trend: {activeProfile.momentum3M > 0 ? '+' : ''}{activeProfile.momentum3M}%</span>
                  <span>6M Relative: {activeProfile.momentum6M > 0 ? '+' : ''}{activeProfile.momentum6M}%</span>
                </div>
              </div>
            </div>

            {/* Forensic Checkpoint Cards: Piotroski & Altman */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl border border-border-default bg-bg-surface flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-accent-brass/10 text-accent-brass shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-text-primary">Piotroski F-Score</div>
                  <div className="text-lg font-mono font-bold text-text-primary mt-0.5">
                    {factorBreakdown.piotroskiFScore} <span className="text-xs font-normal text-text-faint">/ 9</span>
                  </div>
                  <div className="text-[10px] text-text-secondary mt-0.5">
                    {factorBreakdown.piotroskiFScore >= 8
                      ? 'Pristine financial health (Stanford Check)'
                      : factorBreakdown.piotroskiFScore >= 6
                      ? 'Stable operating metrics'
                      : 'Accounting caution flag'}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-border-default bg-bg-surface flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-text-primary">Altman Z-Score</div>
                  <div className="text-lg font-mono font-bold text-text-primary mt-0.5">
                    {activeProfile.altmanZScore.toFixed(1)}{' '}
                    <span className={`text-xs px-1.5 py-0.2 rounded font-normal ${
                      factorBreakdown.altmanZone === 'Safe'
                        ? 'bg-positive/15 text-positive'
                        : factorBreakdown.altmanZone === 'Grey'
                        ? 'bg-warning/15 text-warning'
                        : 'bg-negative/15 text-negative'
                    }`}>
                      {factorBreakdown.altmanZone}
                    </span>
                  </div>
                  <div className="text-[10px] text-text-secondary mt-0.5">
                    Solvency: Zero 2-year bankruptcy probability
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Commentary */}
          <div className="p-3 rounded-xl border border-border-default bg-bg-surface text-xs text-text-secondary leading-relaxed">
            <span className="font-semibold text-text-primary mr-1.5">Institutional Summary:</span>
            {activeProfile.analystSummary}
          </div>
        </div>
      </div>
    </div>
  );
}
