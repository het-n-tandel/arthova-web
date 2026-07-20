'use client';

import { motion } from 'framer-motion';
import { FileText, Download, AlertTriangle, Scissors } from 'lucide-react';
import { taxSummary } from '@/lib/mock-data';
import { formatINR, formatINRCompact, cn } from '@/lib/formatters';
import { SummaryCard } from '@/components/ui/summary-card';
import { DeltaBadge } from '@/components/ui/delta-badge';

export default function TaxReportsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
      <div>
        <h1 className="font-display text-[28px] text-text-primary mb-1">Tax Reports</h1>
        <p className="text-[13px] text-text-faint">Capital gains, income summary, and tax-loss harvesting for FY 2025-26</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="STCG" value={formatINR(taxSummary.stcg)} sublabel="Short-term gains" icon={<FileText className="w-4 h-4" />} />
        <SummaryCard label="LTCG" value={formatINR(taxSummary.ltcg)} sublabel="Long-term gains" />
        <SummaryCard label="Total Taxable" value={formatINR(taxSummary.totalTaxable)} />
        <SummaryCard label="Estimated Tax" value={formatINR(taxSummary.estimatedTax)} sublabel="at current rates" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Breakdown */}
        <div className="bg-bg-surface border border-border-default rounded-[12px] p-6">
          <h2 className="text-[16px] font-medium text-text-primary mb-4">Income Breakdown</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-text-secondary">Short-Term Capital Gains</span>
              <span className="text-[14px] text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(taxSummary.stcg)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-text-secondary">Long-Term Capital Gains</span>
              <span className="text-[14px] text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(taxSummary.ltcg)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-text-secondary">Dividend Income</span>
              <span className="text-[14px] text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(taxSummary.dividendIncome)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-text-secondary">Interest Income</span>
              <span className="text-[14px] text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(taxSummary.interestIncome)}</span>
            </div>
            <div className="border-t border-border-default pt-3 flex justify-between items-center">
              <span className="text-[14px] font-medium text-text-primary">Total Taxable Income</span>
              <span className="text-[18px] font-medium text-accent-brass" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(taxSummary.totalTaxable)}</span>
            </div>
          </div>
        </div>

        {/* Tax-Loss Harvesting */}
        <div className="bg-bg-surface border border-border-default rounded-[12px] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Scissors className="w-5 h-5 text-accent-brass" />
            <h2 className="text-[16px] font-medium text-text-primary">Tax-Loss Harvesting</h2>
          </div>
          <p className="text-[12.5px] text-text-secondary mb-4">AI-identified opportunities to reduce your tax burden by booking losses strategically.</p>
          <div className="space-y-4">
            {taxSummary.harvestingOpportunities.map((opp, i) => (
              <div key={i} className="bg-bg-surface-2 rounded-[12px] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-[13px] font-medium text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{opp.symbol}</span>
                  <span className="ml-auto text-[13px] text-negative" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(opp.loss)}</span>
                </div>
                <p className="text-[12px] text-text-secondary leading-relaxed">{opp.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Download Reports */}
      <div className="bg-bg-surface border border-border-default rounded-[12px] p-6">
        <h2 className="text-[16px] font-medium text-text-primary mb-4">Download Reports</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Capital Gains Statement', desc: 'STCG & LTCG details for ITR filing', format: 'PDF' },
            { label: 'Dividend Report', desc: 'All dividend income with TDS details', format: 'Excel' },
            { label: 'Portfolio Statement', desc: 'Complete holdings as of today', format: 'PDF' },
          ].map((report, i) => (
            <button
              key={i}
              className="bg-bg-surface-2 border border-border-default rounded-[12px] p-4 text-left hover:border-border-strong transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-medium text-text-primary">{report.label}</span>
                <Download className="w-4 h-4 text-text-faint group-hover:text-accent-brass transition-colors" />
              </div>
              <p className="text-[11px] text-text-faint">{report.desc}</p>
              <span className="text-[10px] text-accent-brass-dim mt-2 inline-block" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{report.format}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
