'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import { goldSilverHoldings, goldPrice, silverPrice, generateCandlestickData } from '@/lib/mock-data';
import { formatINR, formatINRCompact, formatDate, cn } from '@/lib/formatters';
import { SummaryCard } from '@/components/ui/summary-card';
import { DeltaBadge } from '@/components/ui/delta-badge';
import { IncomeLineChart } from '@/components/charts/income-line-chart';

export default function GoldSilverPage() {
  const totalInvested = goldSilverHoldings.reduce((s, h) => s + h.investedAmount, 0);
  const totalCurrent = goldSilverHoldings.reduce((s, h) => s + h.currentValue, 0);
  const totalGain = totalCurrent - totalInvested;
  const totalGainPercent = (totalGain / totalInvested) * 100;

  const goldHoldings = goldSilverHoldings.filter((h) => h.type.toLowerCase().includes('gold'));
  const silverHoldings = goldSilverHoldings.filter((h) => h.type.toLowerCase().includes('silver'));
  const goldTotal = goldHoldings.reduce((s, h) => s + h.currentValue, 0);
  const silverTotal = silverHoldings.reduce((s, h) => s + h.currentValue, 0);

  const priceHistory = useMemo(() => {
    const data = [];
    let price = 6200;
    const now = new Date();
    for (let i = 12; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      price = price * (1 + (Math.random() - 0.3) * 0.03);
      data.push({ date: date.toISOString().slice(0, 10), value: Math.round(price) });
    }
    return data;
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
      <div>
        <h1 className="font-display text-[28px] text-text-primary mb-1">Gold & Silver</h1>
        <p className="text-[13px] text-text-faint">Track your precious metals portfolio</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Value" value={formatINRCompact(totalCurrent)} delta={totalGainPercent} icon={<Coins className="w-4 h-4" />} />
        <SummaryCard label="Gold Price" value={`₹${goldPrice.toLocaleString('en-IN')}/g`} sublabel="24K rate" />
        <SummaryCard label="Silver Price" value={`₹${silverPrice}/g`} sublabel="per gram" />
        <SummaryCard label="Total P&L" value={formatINR(totalGain)} delta={totalGainPercent} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-surface border border-border-default rounded-[12px] p-6">
          <h2 className="text-[16px] font-medium text-text-primary mb-4">Gold Price History</h2>
          <IncomeLineChart data={priceHistory} height={250} />
        </div>

        <div className="space-y-4">
          <h2 className="text-[16px] font-medium text-text-primary">Holdings Breakdown</h2>
          <div className="bg-bg-surface border border-border-default rounded-[12px] p-5">
            <h3 className="text-eyebrow text-accent-brass mb-3">Gold — {formatINRCompact(goldTotal)}</h3>
            <div className="space-y-3">
              {goldHoldings.map((h) => (
                <div key={h.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] text-text-primary">{h.type}</p>
                    <p className="text-[11px] text-text-faint" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{h.quantity}g · Bought {formatDate(h.purchaseDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(h.currentValue)}</p>
                    <DeltaBadge value={((h.currentValue - h.investedAmount) / h.investedAmount) * 100} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-bg-surface border border-border-default rounded-[12px] p-5">
            <h3 className="text-eyebrow text-text-faint mb-3">Silver — {formatINRCompact(silverTotal)}</h3>
            <div className="space-y-3">
              {silverHoldings.map((h) => (
                <div key={h.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] text-text-primary">{h.type}</p>
                    <p className="text-[11px] text-text-faint" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{h.quantity}g · Bought {formatDate(h.purchaseDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(h.currentValue)}</p>
                    <DeltaBadge value={((h.currentValue - h.investedAmount) / h.investedAmount) * 100} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
