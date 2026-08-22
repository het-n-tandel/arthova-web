'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { HoldingsTable } from '@/components/portfolio/holdings-table';
import { usePortfolio } from '@/lib/hooks/use-portfolio';
import { AssetActionModal } from '@/components/ui/asset-action-modal';
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
          <h1 className="font-display text-[28px] text-text-primary mb-1">Stocks</h1>
          <p className="text-[13px] text-text-faint">Your equity portfolio and market watch</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 bg-accent-brass hover:bg-accent-brass-dim text-bg-base px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors"
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
        <div className="text-center py-12 border border-border-default rounded-[12px] bg-bg-surface-2">
          <p className="text-[14px] text-text-secondary mb-3">You don't own any stocks yet.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="text-accent-brass text-[13px] font-medium hover:underline"
          >
            Buy your first stock
          </button>
        </div>
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
