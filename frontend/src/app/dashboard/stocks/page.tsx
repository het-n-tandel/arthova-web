'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { HoldingsTable } from '@/components/portfolio/holdings-table';
import { usePortfolio } from '@/lib/hooks/use-portfolio';
import { AssetActionModal } from '@/components/ui/asset-action-modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, TrendingUp } from 'lucide-react';
import { SummaryCard } from '@/components/ui/summary-card';
import { formatINR, formatINRCompact } from '@/lib/formatters';

export default function StocksPage() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const { stockHoldings, isLoading, assets } = usePortfolio();
  
  const stockStats = assets.find(a => a.name === 'Stocks') || { invested: 0, current: 0, gain: 0, gainPercent: 0 };
  const activeStocks = stockHoldings.filter(s => s.quantity > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[30px] font-bold text-text-primary mb-1 tracking-tight text-gradient-emerald">
            Equity Stocks
          </h1>
          <p className="text-[13px] text-text-secondary">Your live NSE/BSE equity holdings, sector allocation, and real-time P&L</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-[13px] transition-all shadow-md shadow-emerald-500/25"
        >
          <Plus className="w-4 h-4" />
          Trade Stock
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Invested" value={formatINRCompact(stockStats.invested)} icon={<TrendingUp className="w-4 h-4" />} />
        <SummaryCard label="Current Value" value={formatINRCompact(stockStats.current)} delta={stockStats.gainPercent} />
        <SummaryCard label="Active Stocks" value={`${activeStocks.length}`} sublabel={`${formatINR(stockStats.current / (activeStocks.length || 1))}/avg value`} />
        <SummaryCard label="Total P&L" value={formatINR(stockStats.gain)} delta={stockStats.gainPercent} />
      </div>

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
        <EmptyState
          icon={TrendingUp}
          title="No Equity Stocks in Portfolio"
          description="Build long-term compound wealth by holding shares of Indian bluechip compounders and high-growth businesses."
          tip="Equities historically deliver 12–14% CAGR in India, outpacing inflation and serving as the engine of net worth expansion."
          actionLabel="Add Your First Stock"
          onAction={() => setModalOpen(true)}
          accentColor="#C9A227"
        />
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
