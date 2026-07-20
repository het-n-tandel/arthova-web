'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Landmark, Clock, Calendar } from 'lucide-react';
import { fixedDeposits } from '@/lib/mock-data';
import { formatINR, formatINRCompact, formatDate, cn } from '@/lib/formatters';
import { SummaryCard } from '@/components/ui/summary-card';

export default function FixedDepositsPage() {
  const totalDeposited = fixedDeposits.reduce((s, fd) => s + fd.amount, 0);
  const totalInterest = fixedDeposits.reduce((s, fd) => s + fd.interestEarned, 0);
  const totalMaturity = fixedDeposits.reduce((s, fd) => s + fd.maturityAmount, 0);
  const avgRate = fixedDeposits.reduce((s, fd) => s + fd.ratePercent, 0) / fixedDeposits.length;

  const sortedByMaturity = [...fixedDeposits].sort(
    (a, b) => new Date(a.maturityDate).getTime() - new Date(b.maturityDate).getTime()
  );

  const now = new Date();

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
      <div>
        <h1 className="font-display text-[28px] text-text-primary mb-1">Fixed Deposits</h1>
        <p className="text-[13px] text-text-faint">Track your FD investments and maturity timeline</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Deposited" value={formatINRCompact(totalDeposited)} icon={<Landmark className="w-4 h-4" />} />
        <SummaryCard label="Total Interest" value={formatINR(totalInterest)} sublabel="earned" />
        <SummaryCard label="Maturity Value" value={formatINRCompact(totalMaturity)} />
        <SummaryCard label="Avg Rate" value={`${avgRate.toFixed(2)}%`} sublabel="weighted average" />
      </div>

      {/* FD Table */}
      <div>
        <h2 className="text-[16px] font-medium text-text-primary mb-4">Active Deposits</h2>
        <div className="overflow-x-auto rounded-[12px] border border-border-default">
          <table className="w-full">
            <thead>
              <tr className="bg-bg-surface-2">
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Bank</th>
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
              {fixedDeposits.map((fd) => (
                <tr key={fd.id} className="border-t border-border-default hover:bg-bg-surface-2 transition-colors h-[52px]">
                  <td className="px-4 py-2 text-[13px] font-medium text-text-primary">{fd.bank}</td>
                  <td className="px-4 py-2 text-[13px]" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(fd.amount)}</td>
                  <td className="px-4 py-2 text-[13px] text-positive" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{fd.ratePercent}%</td>
                  <td className="px-4 py-2 text-[12px] text-text-secondary">{fd.tenureMonths} months</td>
                  <td className="px-4 py-2 text-[12px] text-text-faint">{formatDate(fd.startDate)}</td>
                  <td className="px-4 py-2 text-[12px] text-text-secondary">{formatDate(fd.maturityDate)}</td>
                  <td className="px-4 py-2 text-[13px] text-positive" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(fd.interestEarned)}</td>
                  <td className="px-4 py-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-positive-bg text-positive">{fd.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maturity Timeline */}
      <div className="bg-bg-surface border border-border-default rounded-[12px] p-6">
        <h2 className="text-[16px] font-medium text-text-primary mb-4">Maturity Timeline</h2>
        <div className="space-y-4">
          {sortedByMaturity.map((fd) => {
            const matDate = new Date(fd.maturityDate);
            const startDate = new Date(fd.startDate);
            const totalDays = (matDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
            const elapsed = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
            const progress = Math.min(Math.max((elapsed / totalDays) * 100, 0), 100);

            return (
              <div key={fd.id} className="flex items-center gap-4">
                <div className="w-24 shrink-0">
                  <p className="text-[13px] font-medium text-text-primary">{fd.bank}</p>
                  <p className="text-[11px] text-text-faint" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(fd.amount)}</p>
                </div>
                <div className="flex-1">
                  <div className="h-3 bg-bg-surface-2 rounded-full overflow-hidden">
                    <div className="h-full bg-accent-brass rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="w-28 text-right shrink-0">
                  <p className="text-[12px] text-text-secondary">{formatDate(fd.maturityDate)}</p>
                  <p className="text-[11px] text-text-faint" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(fd.maturityAmount)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
