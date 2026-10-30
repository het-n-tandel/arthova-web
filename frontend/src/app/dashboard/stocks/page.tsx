'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { HoldingsTable } from '@/components/portfolio/holdings-table';
import { StockScreenerLab } from '@/components/portfolio/stock-screener-lab';
import { MarketPatternScanner } from '@/components/portfolio/market-pattern-scanner';
import { usePortfolio } from '@/lib/hooks/use-portfolio';
import { AssetActionModal } from '@/components/ui/asset-action-modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, TrendingUp, Brain, Briefcase, Layers } from 'lucide-react';
import { SummaryCard } from '@/components/ui/summary-card';
import { DisclosureCard } from '@/components/ui/disclosure-card';
import { formatINR, formatINRCompact, cn } from '@/lib/formatters';

export default function StocksPage() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const { stockHoldings, isLoading, assets } = usePortfolio();

  const stockStats = assets.find(a => a.name === 'Stocks') || { invested: 0, current: 0, gain: 0, gainPercent: 0 };
  const activeStocks = stockHoldings.filter(s => s.quantity > 0);

  // Active tab: 'screener' | 'scanner' | 'holdings'
  const [activeTab, setActiveTab] = useState<'holdings' | 'screener' | 'scanner'>('screener');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-bold text-text-primary mb-1 tracking-tight">
            Equities &amp; Market Intelligence
          </h1>
          <p className="text-[13px] text-text-faint">
            NSE &amp; BSE live portfolio tracking, factor scoring, 10-signal frequency analysis, and ML forecasts
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 bg-accent-brass hover:bg-accent-brass-dim text-bg-base font-semibold px-4 py-2 rounded-lg text-[13px] transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Trade Stock
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Invested" value={formatINRCompact(stockStats.invested)} icon={<TrendingUp className="w-4 h-4" />} />
        <SummaryCard label="Current Value" value={formatINRCompact(stockStats.current)} delta={stockStats.gainPercent} />
        <SummaryCard label="Active Stocks" value={`${activeStocks.length}`} sublabel={`${formatINR(stockStats.current / (activeStocks.length || 1))}/avg value`} />
        <SummaryCard label="Total P&L" value={formatINR(stockStats.gain)} delta={stockStats.gainPercent} />
      </div>

      {/* Collapsible Screener & Quant Guide */}
      <DisclosureCard
        title="Institutional Equity Factor Screener & Signal Guide"
        subtitle="How Arthova ranks stocks using Quality, Valuation, Momentum, and 100-Epoch ML Models"
        badge="Factor Model Guide"
        icon={<Brain className="w-4 h-4 text-violet-400" />}
        variant="subtle"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[12px]">
          <div className="bg-bg-surface p-3 rounded-lg border border-border-default">
            <span className="font-mono font-bold text-emerald-400 block mb-1">1. Quality Score (40%)</span>
            <p className="text-text-secondary leading-relaxed">
              Screens for ROE &gt; 15%, low Debt-to-Equity &lt; 0.5, Piotroski F-Score (7–9), and safe Altman Z-Scores to guard against financial distress.
            </p>
          </div>
          <div className="bg-bg-surface p-3 rounded-lg border border-border-default">
            <span className="font-mono font-bold text-amber-400 block mb-1">2. Valuation Score (30%)</span>
            <p className="text-text-secondary leading-relaxed">
              Calculates enterprise discount vs historical median and sectoral P/E multiples, penalizing overvalued or speculative price levels.
            </p>
          </div>
          <div className="bg-bg-surface p-3 rounded-lg border border-border-default">
            <span className="font-mono font-bold text-violet-400 block mb-1">3. Momentum &amp; Signals (30%)</span>
            <p className="text-text-secondary leading-relaxed">
              Scans 3M/6M relative strength vs Nifty 50, EMA 20/50 crosses, and 100-epoch backprop convergence for directional alpha.
            </p>
          </div>
        </div>
      </DisclosureCard>

      {/* Primary Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-border-default pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('screener')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'screener'
              ? 'bg-violet-600 text-white font-semibold shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-2'
          )}
        >
          <Brain className="w-4 h-4" />
          <span>Market Screener &amp; Predictor</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/20 text-white">
            30+ Stocks
          </span>
        </button>

        <button
          onClick={() => setActiveTab('scanner')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'scanner'
              ? 'bg-cyan-600 text-white font-semibold shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-2'
          )}
        >
          <Layers className="w-4 h-4" />
          <span>Pattern Confluence Scanner</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            3-Layer Matrix
          </span>
        </button>

        <button
          onClick={() => setActiveTab('holdings')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'holdings'
              ? 'bg-accent-brass text-bg-base font-semibold shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-2'
          )}
        >
          <Briefcase className="w-4 h-4" />
          <span>My Portfolio Holdings</span>
          <span className={cn(
            'text-[10px] font-mono px-1.5 py-0.5 rounded-full',
            activeTab === 'holdings' ? 'bg-bg-base/20 text-bg-base font-bold' : 'bg-bg-surface-3 text-text-faint'
          )}>
            {activeStocks.length}
          </span>
        </button>
      </div>

      {/* Tab 1: AI Screener & Predictor */}
      {activeTab === 'screener' && (
        <StockScreenerLab />
      )}

      {/* Tab 2: Pattern Confluence Scanner */}
      {activeTab === 'scanner' && (
        <MarketPatternScanner />
      )}

      {/* Tab 2: My Portfolio Holdings */}
      {activeTab === 'holdings' && (
        <>
          {isLoading ? (
            <div className="flex flex-col items-center py-12 gap-3 border border-border-default rounded-[12px]">
              <div className="w-6 h-6 rounded-full border-2 border-accent-brass border-t-transparent animate-spin" />
              <p className="text-[13px] text-text-secondary">Loading portfolio...</p>
            </div>
          ) : stockHoldings.length > 0 ? (
            <HoldingsTable 
              data={stockHoldings} 
              onRowClick={(symbol) => router.push(`/dashboard/stocks/${symbol}`)}
            />
          ) : (
            <div className="space-y-6">
              <EmptyState
                icon={TrendingUp}
                title="No Equity Stocks in Portfolio Yet"
                description="You don't own any stocks yet. You can use our AI Screener & ML Prediction engine to analyze top compounders before buying!"
                tip="Use the 'Explore & Predict Stocks' tab above to test price forecasts and signal probabilities with ₹0 invested."
                actionLabel="Explore Market Screener"
                onAction={() => setActiveTab('screener')}
                accentColor="#C9A227"
              />
              <StockScreenerLab />
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <AssetActionModal
          assetType="stock"
          mode="add"
          onClose={() => setModalOpen(false)}
        />
      )}
    </motion.div>
  );
}
