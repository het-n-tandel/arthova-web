'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { HoldingsTable } from '@/components/portfolio/holdings-table';
import { usePortfolio } from '@/lib/hooks/use-portfolio';
import { AssetActionModal } from '@/components/ui/asset-action-modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, Landmark } from 'lucide-react';

export default function BondsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { bondHoldings, isLoading } = usePortfolio();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] text-text-primary mb-1">Bonds</h1>
          <p className="text-[13px] text-text-faint">Your fixed income portfolio</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 bg-accent-brass hover:bg-accent-brass-dim text-bg-base px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Bond
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center py-12 gap-3 border border-border-default rounded-[12px]">
          <div className="w-6 h-6 rounded-full border-2 border-accent-brass border-t-transparent animate-spin" />
          <p className="text-[13px] text-text-secondary">Loading portfolio...</p>
        </div>
      ) : bondHoldings.length > 0 ? (
        <HoldingsTable data={bondHoldings} />
      ) : (
        <EmptyState
          icon={Landmark}
          title="No Bonds or Fixed Income Assets Yet"
          description="Invest in Sovereign Gold Bonds, Government G-Secs, and Corporate Debentures for reliable semi-annual coupon yields."
          tip="Sovereign Bonds offer sovereign credit safety and predictable income that cushions equity downturns."
          actionLabel="Add Your First Bond"
          onAction={() => setModalOpen(true)}
          accentColor="#3FA88A"
        />
      )}

      {modalOpen && (
        <AssetActionModal
          assetType="bond"
          mode="add"
          onClose={() => setModalOpen(false)}
        />
      )}
    </motion.div>
  );
}
