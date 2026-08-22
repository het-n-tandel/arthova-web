'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ManualAssetTable } from '@/components/portfolio/manual-asset-table';
import { usePortfolio } from '@/lib/hooks/use-portfolio';
import { AssetActionModal } from '@/components/ui/asset-action-modal';
import { Plus } from 'lucide-react';

export default function CashPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { cashHoldings, isLoading } = usePortfolio();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] text-text-primary mb-1">Cash & Income</h1>
          <p className="text-[13px] text-text-faint">Your liquidity and regular income sources</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 bg-accent-brass hover:bg-accent-brass-dim text-bg-base px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Cash
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center py-12 gap-3 border border-border-default rounded-[12px]">
          <div className="w-6 h-6 rounded-full border-2 border-accent-brass border-t-transparent animate-spin" />
          <p className="text-[13px] text-text-secondary">Loading portfolio...</p>
        </div>
      ) : cashHoldings.length > 0 ? (
        <ManualAssetTable data={cashHoldings} type="cash" />
      ) : (
        <div className="text-center py-12 border border-border-default rounded-[12px] bg-bg-surface-2">
          <p className="text-[14px] text-text-secondary mb-3">You don't have any cash accounts added.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="text-accent-brass text-[13px] font-medium hover:underline"
          >
            Add your first cash source
          </button>
        </div>
      )}

      {modalOpen && (
        <AssetActionModal
          assetType="cash"
          mode="add"
          onClose={() => setModalOpen(false)}
        />
      )}
    </motion.div>
  );
}
