'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, Clock, Calendar, Plus } from 'lucide-react';
import { formatINR, formatINRCompact, formatDate, cn } from '@/lib/formatters';
import { SummaryCard } from '@/components/ui/summary-card';
import { usePortfolio } from '@/lib/hooks/use-portfolio';
import { AssetActionModal } from '@/components/ui/asset-action-modal';

export default function FixedDepositsPage() {
  const { fdHoldings } = usePortfolio();
  const [isTradeOpen, setIsTradeOpen] = useState(false);

  const enrichedFDs = useMemo(() => {
    return fdHoldings.map((h) => {
      // metadata arrives as object from DB (JSONB) or string — handle both
      const meta: any = h.metadata && typeof h.metadata === 'object'
        ? h.metadata
        : (() => { try { return JSON.parse(h.metadata || '{}'); } catch { return {}; } })();

      const principal    = (parseFloat(h.quantity) || 0) * (parseFloat(h.avgCost) || 1);
      const ratePercent  = parseFloat(meta.interestRate)  || 7.1;
      const tenureMonths = parseInt(meta.tenureMonths)    || 12;

      // Use the actual user-supplied purchase date, fall back to createdAt
      const startDate    = new Date(h.purchaseDate || h.createdAt || Date.now());

      const maturityDate = new Date(startDate);
      maturityDate.setMonth(maturityDate.getMonth() + tenureMonths);

      // Interest accrued so far (capped at full tenure)
      const now           = new Date();
      const msSinceStart  = Math.max(0, now.getTime() - startDate.getTime());
      const monthsElapsed = Math.min(
        Math.floor(msSinceStart / (1000 * 60 * 60 * 24 * 30)),
        tenureMonths
      );
      const isMatured     = now >= maturityDate;

      const interestAccrued  = principal * (ratePercent / 100) * (monthsElapsed / 12);
      const interestAtMaturity = principal * (ratePercent / 100) * (tenureMonths / 12);

      return {
        ...h,
        principal,
        ratePercent,
        tenureMonths,
        startDate,
        maturityDate,
        monthsElapsed,
        isMatured,
        interestAccrued,
        interestAtMaturity,
        currentValue:   principal + interestAccrued,
        maturityAmount: principal + interestAtMaturity,
        status: isMatured ? 'Matured' : 'Active',
      };
    });
  }, [fdHoldings]);

  const totalDeposited    = enrichedFDs.reduce((s, fd) => s + fd.principal, 0);
  const totalInterestNow  = enrichedFDs.reduce((s, fd) => s + fd.interestAccrued, 0);
  const totalCurrentVal   = enrichedFDs.reduce((s, fd) => s + fd.currentValue, 0);
  const totalMaturity     = enrichedFDs.reduce((s, fd) => s + fd.maturityAmount, 0);
  const avgRate = enrichedFDs.length > 0
    ? enrichedFDs.reduce((s, fd) => s + fd.ratePercent, 0) / enrichedFDs.length
    : 0;

  const sortedByMaturity = [...enrichedFDs].sort(
    (a, b) => a.maturityDate.getTime() - b.maturityDate.getTime()
  );

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-[28px] text-text-primary mb-1">Fixed Deposits</h1>
          <p className="text-[13px] text-text-faint">Track your FD investments and maturity timeline</p>
        </div>
        <button onClick={() => setIsTradeOpen(true)} className="flex items-center gap-2 bg-accent-brass hover:bg-accent-brass-dim text-bg-base px-4 py-2 rounded-[8px] font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Add FD
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Deposited"  value={formatINRCompact(totalDeposited)} icon={<Landmark className="w-4 h-4" />} />
        <SummaryCard label="Interest Accrued" value={formatINR(totalInterestNow)}  sublabel="earned so far" />
        <SummaryCard label="Current Value"    value={formatINRCompact(totalCurrentVal)} sublabel="principal + interest" />
        <SummaryCard label="At Maturity"      value={formatINRCompact(totalMaturity)} sublabel={`Avg ${avgRate.toFixed(2)}% p.a.`} />
      </div>

      {/* FD Table */}
      <div>
        <h2 className="text-[16px] font-medium text-text-primary mb-4">Active Deposits</h2>
        <div className="overflow-x-auto rounded-[12px] border border-border-default">
          <table className="w-full">
            <thead>
              <tr className="bg-bg-surface-2">
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Name</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Amount</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Rate</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Tenure</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Start</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Maturity</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Interest</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {enrichedFDs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-[13px] text-text-faint">No FDs found. Click Add FD to track one.</td>
                </tr>
              ) : enrichedFDs.map((fd) => (
                <tr key={fd.id} className="border-t border-border-default hover:bg-bg-surface-2 transition-colors h-[52px]">
                  <td className="px-4 py-2 text-[13px] font-medium text-text-primary">{fd.name}</td>
                  <td className="px-4 py-2 text-[13px]" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(fd.principal)}</td>
                  <td className="px-4 py-2 text-[13px] text-positive" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{fd.ratePercent}%</td>
                  <td className="px-4 py-2 text-[12px] text-text-secondary">{fd.tenureMonths}M ({fd.monthsElapsed}M elapsed)</td>
                  <td className="px-4 py-2 text-[12px] text-text-faint">{formatDate(fd.startDate.toISOString())}</td>
                  <td className="px-4 py-2 text-[12px] text-text-secondary">{formatDate(fd.maturityDate.toISOString())}</td>
                  <td className="px-4 py-2 text-[13px] text-positive" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(fd.interestAccrued)} / {formatINR(fd.interestAtMaturity)}</td>
                  <td className="px-4 py-2">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${fd.isMatured ? 'bg-warning-bg text-warning' : 'bg-positive-bg text-positive'}`}>{fd.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maturity Timeline */}
      {sortedByMaturity.length > 0 && (
      <div className="bg-bg-surface border border-border-default rounded-[12px] p-6">
        <h2 className="text-[16px] font-medium text-text-primary mb-4">Maturity Timeline</h2>
        <div className="space-y-4">
          {sortedByMaturity.map((fd) => {
            const progress = Math.min(Math.max((fd.monthsElapsed / fd.tenureMonths) * 100, 0), 100);
            return (
              <div key={fd.id} className="flex items-center gap-4">
                <div className="w-28 shrink-0">
                  <p className="text-[13px] font-medium text-text-primary truncate">{fd.name}</p>
                  <p className="text-[11px] text-text-faint font-mono">{formatINR(fd.principal)} @ {fd.ratePercent}%</p>
                </div>
                <div className="flex-1">
                  <div className="h-3 bg-bg-surface-2 rounded-full overflow-hidden">
                    <div className="h-full bg-accent-brass rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-text-faint">{formatDate(fd.startDate.toISOString())}</span>
                    <span className="text-[10px] text-text-faint">{fd.monthsElapsed}M / {fd.tenureMonths}M</span>
                  </div>
                </div>
                <div className="w-32 text-right shrink-0">
                  <p className="text-[12px] text-text-secondary">{formatDate(fd.maturityDate.toISOString())}</p>
                  <p className="text-[11px] text-positive font-mono">{formatINR(fd.maturityAmount)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      <AnimatePresence>
        {isTradeOpen && <AssetActionModal assetType="fd" mode="add" onClose={() => setIsTradeOpen(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
