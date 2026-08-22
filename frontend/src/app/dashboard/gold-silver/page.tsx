'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Plus } from 'lucide-react';
import { formatINR, formatINRCompact, formatDate, cn } from '@/lib/formatters';
import { SummaryCard } from '@/components/ui/summary-card';
import { DeltaBadge } from '@/components/ui/delta-badge';
import { IncomeLineChart } from '@/components/charts/income-line-chart';
import { useLedgerStore } from '@/lib/store';
import { usePortfolio } from '@/lib/hooks/use-portfolio';
import { AssetActionModal } from '@/components/ui/asset-action-modal';

export default function GoldSilverPage() {
  const livePrices = useLedgerStore((s) => s.livePrices);
  const { goldHoldings, assets } = usePortfolio();
  
  const [tradeMetal, setTradeMetal] = useState<'gold' | 'silver' | null>(null);

  const totalStats = assets.find(a => a.name === 'Gold & Silver') || { invested: 0, current: 0, gain: 0, gainPercent: 0 };
  
  const TROY_OUNCE_TO_GRAMS = 31.1034768;
  const inrRate = livePrices.get('INR=X')?.price || 83.50; 
  
  const rawGoldUSD = livePrices.get('GC=F')?.price || 2400; // Mock fallback if offline
  const rawSilverUSD = livePrices.get('SI=F')?.price || 30;
  
  const liveGoldPrice = (rawGoldUSD * inrRate) / TROY_OUNCE_TO_GRAMS;
  const liveSilverPrice = (rawSilverUSD * inrRate) / TROY_OUNCE_TO_GRAMS;

  const myGoldHoldings = goldHoldings.filter(h => h.symbol === 'GC=F' || h.assetType === 'gold');
  const mySilverHoldings = goldHoldings.filter(h => h.symbol === 'SI=F' || h.assetType === 'silver');

  const goldTotal = myGoldHoldings.reduce((s, h) => s + (h.quantity * h.cmp), 0);
  const silverTotal = mySilverHoldings.reduce((s, h) => s + (h.quantity * h.cmp), 0);

  const priceHistory = useMemo(() => {
    const data = [];
    let price = liveGoldPrice || 6200;
    const now = new Date();
    for (let i = 12; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      price = price * (1 + (Math.random() - 0.3) * 0.03);
      data.push({ date: date.toISOString().slice(0, 10), value: Math.round(price) });
    }
    return data;
  }, [liveGoldPrice]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-[28px] text-text-primary mb-1">Gold & Silver</h1>
          <p className="text-[13px] text-text-faint">Track your precious metals portfolio</p>
        </div>
        <div className="flex gap-3">
            <button onClick={() => setTradeMetal('gold')} className="flex items-center gap-2 bg-accent-brass hover:bg-accent-brass-dim text-bg-base px-4 py-2 rounded-[8px] font-medium transition-colors">
            <Plus className="w-4 h-4" />
            Trade Gold
            </button>
            <button onClick={() => setTradeMetal('silver')} className="flex items-center gap-2 bg-bg-surface-2 hover:bg-bg-surface-3 border border-border-default text-text-primary px-4 py-2 rounded-[8px] font-medium transition-colors">
            <Plus className="w-4 h-4" />
            Trade Silver
            </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Value" value={formatINRCompact(totalStats.current)} delta={totalStats.gainPercent} icon={<Coins className="w-4 h-4" />} />
        <SummaryCard label="Gold Price" value={`₹${Math.round(liveGoldPrice).toLocaleString('en-IN')}/g`} sublabel="24K rate (Live)" />
        <SummaryCard label="Silver Price" value={`₹${Math.round(liveSilverPrice)}/g`} sublabel="per gram (Live)" />
        <SummaryCard label="Total P&L" value={formatINR(totalStats.gain)} delta={totalStats.gainPercent} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-surface border border-border-default rounded-[12px] p-6">
          <h2 className="text-[16px] font-medium text-text-primary mb-4">Gold Price History</h2>
          <IncomeLineChart data={priceHistory} height={250} />
        </div>

        <div className="space-y-4">
          <h2 className="text-[16px] font-medium text-text-primary">Holdings Breakdown</h2>
          
          <div className="bg-bg-surface border border-border-default rounded-[12px] p-5">
            <h3 className="text-eyebrow text-accent-brass mb-3 flex justify-between">
                <span>Gold</span>
                <span>{formatINRCompact(goldTotal)}</span>
            </h3>
            <div className="space-y-3">
              {myGoldHoldings.length === 0 ? (
                  <p className="text-[13px] text-text-faint">No gold holdings.</p>
              ) : myGoldHoldings.map((h) => (
                <div key={h.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] text-text-primary">{h.name || 'Gold'}</p>
                    <p className="text-[11px] text-text-faint" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{h.quantity}g</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(h.quantity * h.cmp)}</p>
                    <DeltaBadge value={(((h.quantity * h.cmp) - (h.quantity * h.avgCost)) / (h.quantity * h.avgCost)) * 100} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-bg-surface border border-border-default rounded-[12px] p-5">
            <h3 className="text-eyebrow text-text-faint mb-3 flex justify-between">
                <span>Silver</span>
                <span>{formatINRCompact(silverTotal)}</span>
            </h3>
            <div className="space-y-3">
              {mySilverHoldings.length === 0 ? (
                  <p className="text-[13px] text-text-faint">No silver holdings.</p>
              ) : mySilverHoldings.map((h) => (
                <div key={h.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] text-text-primary">{h.name || 'Silver'}</p>
                    <p className="text-[11px] text-text-faint" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{h.quantity}g</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(h.quantity * h.cmp)}</p>
                    <DeltaBadge value={(((h.quantity * h.cmp) - (h.quantity * h.avgCost)) / (h.quantity * h.avgCost)) * 100} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {tradeMetal && <AssetActionModal assetType={tradeMetal} mode="add" onClose={() => setTradeMetal(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}
