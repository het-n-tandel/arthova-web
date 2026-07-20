'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PiggyBank, Calendar, Star as StarIcon } from 'lucide-react';
import { mutualFunds } from '@/lib/mock-data';
import { formatINR, formatINRCompact, formatDate, cn } from '@/lib/formatters';
import { SummaryCard } from '@/components/ui/summary-card';
import { DeltaBadge } from '@/components/ui/delta-badge';

export default function MutualFundsPage() {
  const totalInvested = mutualFunds.reduce((s, f) => s + f.investedAmount, 0);
  const totalCurrent = mutualFunds.reduce((s, f) => s + f.currentValue, 0);
  const totalGain = totalCurrent - totalInvested;
  const totalGainPercent = (totalGain / totalInvested) * 100;
  const activeSIPs = mutualFunds.filter((f) => f.sipAmount !== null);
  const totalSIPAmount = activeSIPs.reduce((s, f) => s + (f.sipAmount || 0), 0);

  const [sipCalcMonthly, setSipCalcMonthly] = useState(10000);
  const [sipCalcYears, setSipCalcYears] = useState(10);
  const [sipCalcRate, setSipCalcRate] = useState(12);

  const sipCalcResult = useMemo(() => {
    const n = sipCalcYears * 12;
    const r = sipCalcRate / 100 / 12;
    const fv = sipCalcMonthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const invested = sipCalcMonthly * n;
    return { futureValue: Math.round(fv), invested, gains: Math.round(fv - invested) };
  }, [sipCalcMonthly, sipCalcYears, sipCalcRate]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
      <div>
        <h1 className="font-display text-[28px] text-text-primary mb-1">Mutual Funds & SIPs</h1>
        <p className="text-[13px] text-text-faint">Track your mutual fund investments and SIP performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Invested" value={formatINRCompact(totalInvested)} icon={<PiggyBank className="w-4 h-4" />} />
        <SummaryCard label="Current Value" value={formatINRCompact(totalCurrent)} delta={totalGainPercent} />
        <SummaryCard label="Active SIPs" value={`${activeSIPs.length}`} sublabel={`${formatINR(totalSIPAmount)}/month`} />
        <SummaryCard label="Total P&L" value={formatINR(totalGain)} delta={totalGainPercent} />
      </div>

      {/* SIP Table */}
      <div>
        <h2 className="text-[16px] font-medium text-text-primary mb-4">Fund Holdings</h2>
        <div className="overflow-x-auto rounded-[12px] border border-border-default">
          <table className="w-full">
            <thead>
              <tr className="bg-bg-surface-2">
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Fund</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Category</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>NAV</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Invested</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Current</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>XIRR</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>SIP</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Risk</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Rating</th>
              </tr>
            </thead>
            <tbody>
              {mutualFunds.map((mf) => (
                <tr key={mf.id} className="border-t border-border-default hover:bg-bg-surface-2 transition-colors h-[52px]">
                  <td className="px-4 py-2">
                    <p className="text-[13px] font-medium text-text-primary">{mf.name}</p>
                    <p className="text-[11px] text-text-faint">Since {formatDate(mf.startDate)}</p>
                  </td>
                  <td className="px-4 py-2 text-[12px] text-text-secondary">{mf.category}</td>
                  <td className="px-4 py-2 text-[13px]" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>₹{mf.nav.toFixed(2)}</td>
                  <td className="px-4 py-2 text-[13px] text-text-secondary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(mf.investedAmount)}</td>
                  <td className="px-4 py-2 text-[13px] text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(mf.currentValue)}</td>
                  <td className="px-4 py-2"><DeltaBadge value={mf.xirr} /></td>
                  <td className="px-4 py-2 text-[13px]" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{mf.sipAmount ? `₹${mf.sipAmount.toLocaleString('en-IN')}/mo` : '—'}</td>
                  <td className="px-4 py-2">
                    <span className={cn('text-[11px] px-2 py-0.5 rounded-full', mf.riskLevel === 'Low' ? 'bg-positive-bg text-positive' : mf.riskLevel === 'Moderate' ? 'bg-warning-bg text-warning' : 'bg-negative-bg text-negative')}>
                      {mf.riskLevel}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarIcon key={i} className={cn('w-3 h-3', i < mf.rating ? 'fill-accent-brass text-accent-brass' : 'text-text-faint')} />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SIP Calculator */}
      <div className="bg-bg-surface border border-border-default rounded-[12px] p-6">
        <h2 className="text-[16px] font-medium text-text-primary mb-4">SIP Calculator</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <label className="text-[12px] text-text-faint block mb-2">Monthly Investment</label>
              <input type="range" min="1000" max="100000" step="1000" value={sipCalcMonthly} onChange={(e) => setSipCalcMonthly(Number(e.target.value))} className="w-full accent-[#C9A227]" />
              <span className="text-[14px] text-text-primary block mt-1" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(sipCalcMonthly)}/month</span>
            </div>
            <div>
              <label className="text-[12px] text-text-faint block mb-2">Duration (years)</label>
              <input type="range" min="1" max="30" value={sipCalcYears} onChange={(e) => setSipCalcYears(Number(e.target.value))} className="w-full accent-[#C9A227]" />
              <span className="text-[14px] text-text-primary block mt-1" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{sipCalcYears} years</span>
            </div>
            <div>
              <label className="text-[12px] text-text-faint block mb-2">Expected Return (%)</label>
              <input type="range" min="4" max="25" step="0.5" value={sipCalcRate} onChange={(e) => setSipCalcRate(Number(e.target.value))} className="w-full accent-[#C9A227]" />
              <span className="text-[14px] text-text-primary block mt-1" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{sipCalcRate}% p.a.</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-bg-surface-2 rounded-[12px] p-5 space-y-4">
              <div className="flex justify-between">
                <span className="text-[13px] text-text-secondary">Total Invested</span>
                <span className="text-[16px] text-text-primary font-medium" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINRCompact(sipCalcResult.invested)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[13px] text-text-secondary">Est. Returns</span>
                <span className="text-[16px] text-positive font-medium" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINRCompact(sipCalcResult.gains)}</span>
              </div>
              <div className="border-t border-border-default pt-3 flex justify-between">
                <span className="text-[13px] font-medium text-text-primary">Future Value</span>
                <span className="text-[22px] text-accent-brass font-medium" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINRCompact(sipCalcResult.futureValue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
