'use client';

import { motion } from 'framer-motion';
import { HoldingsTable } from '@/components/portfolio/holdings-table';
import { stockHoldings } from '@/lib/mock-data';

export default function StocksPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div>
        <h1 className="font-display text-[28px] text-text-primary mb-1">Stocks</h1>
        <p className="text-[13px] text-text-faint">Your equity portfolio and market watch</p>
      </div>

      <HoldingsTable data={stockHoldings} />
    </motion.div>
  );
}
