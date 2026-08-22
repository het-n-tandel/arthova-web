'use client';

import { motion } from 'framer-motion';
import { FileText, Download, AlertTriangle, Scissors } from 'lucide-react';
import { formatINR, formatINRCompact, cn } from '@/lib/formatters';
import { SummaryCard } from '@/components/ui/summary-card';
import { DeltaBadge } from '@/components/ui/delta-badge';
import { usePortfolio } from '@/lib/hooks/use-portfolio';

export default function TaxReportsPage() {
  const portfolio = usePortfolio();

  // Compute actual STCG & LTCG directly from portfolio holdings using purchaseDate classification
  let actualStcgGains = 0;
  let actualLtcgGains = 0;

  const taxableHoldings = [
    ...portfolio.stockHoldings,
    ...portfolio.mfHoldings,
    ...portfolio.goldHoldings,
    ...portfolio.cryptoHoldings,
  ];

  taxableHoldings.forEach((h: any) => {
    const gain = (h.cmp - h.avgCost) * h.quantity;
    if (gain > 0) {
      if (h.isLTCG) actualLtcgGains += gain;
      else actualStcgGains += gain;
    }
  });

  const stcg = actualStcgGains;
  const ltcg = actualLtcgGains;
  
  const dividendIncome = Math.max(portfolio.stockHoldings.reduce((s: number, h: any) => s + (h.cmp * h.quantity * 0.015), 0), 0); // 1.5% dividend yield
  const interestIncome = portfolio.fdHoldings.reduce((s, fd) => s + (fd.interestAccrued || 0), 0); // Actual accrued FD interest
  
  const totalTaxable = stcg + ltcg + dividendIncome + interestIncome;
  
  // Tax calculation (approximate Indian tax brackets FY 2025-26)
  // STCG @ 20%, LTCG @ 12.5% (above 1.25L exemption threshold), Dividend & FD Interest @ 30% slab
  const taxableLtcg = Math.max(ltcg - 125000, 0);
  const estimatedTax = (stcg * 0.20) + (taxableLtcg * 0.125) + ((dividendIncome + interestIncome) * 0.30);

  // Dynamic tax loss harvesting opportunities
  const losingStocks = portfolio.stockHoldings
    .filter((s: any) => s.cmp < s.avgCost)
    .sort((a: any, b: any) => ((a.cmp - a.avgCost) * a.quantity) - ((b.cmp - b.avgCost) * b.quantity))
    .slice(0, 3);

  const harvestingOpportunities = losingStocks.map((s: any) => ({
      symbol: s.symbol,
      loss: (s.avgCost - s.cmp) * s.quantity,
      recommendation: `Selling ${s.symbol} now books a loss of ${formatINR((s.avgCost - s.cmp) * s.quantity)}. This can offset your Short-Term Capital Gains, saving approximately ₹${Math.round(((s.avgCost - s.cmp) * s.quantity) * 0.2).toLocaleString('en-IN')} in taxes.`
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
      <div>
        <h1 className="font-display text-[28px] text-text-primary mb-1">Tax Reports</h1>
        <p className="text-[13px] text-text-faint">Capital gains, income summary, and tax-loss harvesting for FY 2025-26</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="STCG" value={formatINR(stcg)} sublabel="Estimated short-term gains" icon={<FileText className="w-4 h-4" />} />
        <SummaryCard label="LTCG" value={formatINR(ltcg)} sublabel="Estimated long-term gains" />
        <SummaryCard label="Total Taxable" value={formatINR(totalTaxable)} />
        <SummaryCard label="Estimated Tax" value={formatINR(estimatedTax)} sublabel="at current rates" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Breakdown */}
        <div className="bg-bg-surface border border-border-default rounded-[12px] p-6">
          <h2 className="text-[16px] font-medium text-text-primary mb-4">Income Breakdown</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-text-secondary">Short-Term Capital Gains</span>
              <span className="text-[14px] text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(stcg)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-text-secondary">Long-Term Capital Gains</span>
              <span className="text-[14px] text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(ltcg)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-text-secondary">Est. Dividend Income</span>
              <span className="text-[14px] text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(dividendIncome)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-text-secondary">Est. Interest Income</span>
              <span className="text-[14px] text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(interestIncome)}</span>
            </div>
            <div className="border-t border-border-default pt-3 flex justify-between items-center">
              <span className="text-[14px] font-medium text-text-primary">Total Taxable Income</span>
              <span className="text-[18px] font-medium text-accent-brass" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(totalTaxable)}</span>
            </div>
          </div>
        </div>

        {/* Tax-Loss Harvesting */}
        <div className="bg-bg-surface border border-border-default rounded-[12px] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Scissors className="w-5 h-5 text-accent-brass" />
            <h2 className="text-[16px] font-medium text-text-primary">Tax-Loss Harvesting</h2>
          </div>
          <p className="text-[12.5px] text-text-secondary mb-4">AI-identified opportunities to reduce your tax burden by booking losses strategically based on your live portfolio.</p>
          
          <div className="space-y-4">
            {harvestingOpportunities.length > 0 ? harvestingOpportunities.map((opp, i) => (
              <div key={i} className="bg-bg-surface-2 rounded-[12px] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-[13px] font-medium text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{opp.symbol}</span>
                  <span className="ml-auto text-[13px] text-negative" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>-{formatINR(opp.loss)}</span>
                </div>
                <p className="text-[12px] text-text-secondary leading-relaxed">{opp.recommendation}</p>
              </div>
            )) : (
              <div className="bg-bg-surface-2 rounded-[12px] p-6 text-center">
                <p className="text-[13px] text-text-secondary">No loss harvesting opportunities found.</p>
                <p className="text-[12px] text-text-faint mt-1">All your tracked assets are currently profitable or you have no holdings.</p>
              </div>
            )}
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
