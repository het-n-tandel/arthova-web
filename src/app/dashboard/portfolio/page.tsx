'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase } from 'lucide-react';
import { stockHoldings, mutualFunds, goldSilverHoldings, fixedDeposits, properties } from '@/lib/mock-data';
import { usePortfolio } from '@/lib/hooks/use-portfolio';
import { formatINR, formatINRCompact, cn } from '@/lib/formatters';
import { SummaryCard } from '@/components/ui/summary-card';
import { DeltaBadge } from '@/components/ui/delta-badge';
import { HoldingsTable } from '@/components/portfolio/holdings-table';

const tabs = ['All Holdings', 'Stocks', 'Mutual Funds', 'Gold & Silver', 'Fixed Deposits', 'Property'] as const;

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Stocks');
  const portfolio = usePortfolio();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div>
        <h1 className="font-display text-[28px] text-text-primary mb-1">Portfolio</h1>
        <p className="text-[13px] text-text-faint">Detailed breakdown of all your investments</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Invested" value={formatINRCompact(portfolio.totalInvested)} icon={<Briefcase className="w-4 h-4" />} />
        <SummaryCard label="Current Value" value={formatINRCompact(portfolio.totalCurrent)} delta={portfolio.totalGainPercent} />
        <SummaryCard label="Total P&L" value={formatINR(portfolio.totalGain)} delta={portfolio.totalGainPercent} />
        <SummaryCard label="Day Change" value={formatINR(portfolio.dayChange)} delta={portfolio.dayChangePercent} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border-default overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors relative',
              activeTab === tab
                ? 'text-accent-brass'
                : 'text-text-faint hover:text-text-primary'
            )}
          >
            {tab}
            {activeTab === tab && (
              <motion.div
                layoutId="portfolio-tab"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-brass"
                transition={{ duration: 0.2 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {(activeTab === 'All Holdings' || activeTab === 'Stocks') && (
        <HoldingsTable data={stockHoldings} />
      )}

      {activeTab === 'Mutual Funds' && (
        <div className="overflow-x-auto rounded-[12px] border border-border-default">
          <table className="w-full">
            <thead>
              <tr className="bg-bg-surface-2">
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Fund</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Category</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Invested</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Current</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>XIRR</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>SIP</th>
              </tr>
            </thead>
            <tbody>
              {mutualFunds.map((mf) => (
                <tr key={mf.id} className="border-t border-border-default hover:bg-bg-surface-2 transition-colors h-[52px]">
                  <td className="px-4 py-2">
                    <p className="text-[13px] font-medium text-text-primary">{mf.name}</p>
                    <p className="text-[11px] text-text-faint">{mf.amc}</p>
                  </td>
                  <td className="px-4 py-2 text-[12px] text-text-secondary">{mf.category}</td>
                  <td className="px-4 py-2 text-[13px] text-text-secondary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(mf.investedAmount)}</td>
                  <td className="px-4 py-2 text-[13px] text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(mf.currentValue)}</td>
                  <td className="px-4 py-2"><DeltaBadge value={mf.xirr} /></td>
                  <td className="px-4 py-2 text-[13px] text-text-secondary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{mf.sipAmount ? formatINR(mf.sipAmount) + '/mo' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Gold & Silver' && (
        <div className="overflow-x-auto rounded-[12px] border border-border-default">
          <table className="w-full">
            <thead>
              <tr className="bg-bg-surface-2">
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Type</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Qty (g)</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Invested</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Current</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>P&L %</th>
              </tr>
            </thead>
            <tbody>
              {goldSilverHoldings.map((h) => (
                <tr key={h.id} className="border-t border-border-default hover:bg-bg-surface-2 transition-colors h-[52px]">
                  <td className="px-4 py-2 text-[13px] font-medium text-text-primary">{h.type}</td>
                  <td className="px-4 py-2 text-[13px]" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{h.quantity}</td>
                  <td className="px-4 py-2 text-[13px] text-text-secondary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(h.investedAmount)}</td>
                  <td className="px-4 py-2 text-[13px] text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(h.currentValue)}</td>
                  <td className="px-4 py-2"><DeltaBadge value={((h.currentValue - h.investedAmount) / h.investedAmount) * 100} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Fixed Deposits' && (
        <div className="overflow-x-auto rounded-[12px] border border-border-default">
          <table className="w-full">
            <thead>
              <tr className="bg-bg-surface-2">
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Bank</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Amount</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Rate</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Maturity</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Interest</th>
              </tr>
            </thead>
            <tbody>
              {fixedDeposits.map((fd) => (
                <tr key={fd.id} className="border-t border-border-default hover:bg-bg-surface-2 transition-colors h-[52px]">
                  <td className="px-4 py-2 text-[13px] font-medium text-text-primary">{fd.bank}</td>
                  <td className="px-4 py-2 text-[13px]" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(fd.amount)}</td>
                  <td className="px-4 py-2 text-[13px] text-positive" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{fd.ratePercent}%</td>
                  <td className="px-4 py-2 text-[12px] text-text-secondary">{new Date(fd.maturityDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</td>
                  <td className="px-4 py-2 text-[13px] text-positive" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(fd.interestEarned)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Property' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties.map((prop) => (
            <div key={prop.id} className="bg-bg-surface border border-border-default rounded-[12px] p-5">
              <h3 className="text-[16px] font-medium text-text-primary mb-1">{prop.name}</h3>
              <p className="text-[12px] text-text-faint mb-4">{prop.type} · {prop.location}, {prop.city}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-eyebrow">Acquisition</span>
                  <p className="text-[16px] text-text-secondary mt-1" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINRCompact(prop.acquisitionCost)}</p>
                </div>
                <div>
                  <span className="text-eyebrow">Current Value</span>
                  <p className="text-[16px] text-text-primary mt-1" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINRCompact(prop.currentValue)}</p>
                </div>
              </div>
              <div className="mt-3"><DeltaBadge value={((prop.currentValue - prop.acquisitionCost) / prop.acquisitionCost) * 100} size="md" /></div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
