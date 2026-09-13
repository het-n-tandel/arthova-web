'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  AlertTriangle, 
  Scissors, 
  CheckCircle2, 
  ShieldCheck, 
  Printer, 
  HelpCircle,
  Percent,
  Sparkles
} from 'lucide-react';
import { formatINR, formatINRCompact, formatDate, cn } from '@/lib/formatters';
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
  
  // Tax calculation (Indian tax brackets FY 2025-26 under Union Budget)
  // STCG @ 20%, LTCG @ 12.5% (above ₹1.25L exemption threshold), Dividend & FD Interest @ 30% slab
  const LTCG_EXEMPTION_LIMIT = 125000;
  const taxableLtcg = Math.max(ltcg - LTCG_EXEMPTION_LIMIT, 0);
  const estimatedTax = (stcg * 0.20) + (taxableLtcg * 0.125) + ((dividendIncome + interestIncome) * 0.30);

  // Section 112A Exemption Headroom
  const ltcgExemptionUsed = Math.min(ltcg, LTCG_EXEMPTION_LIMIT);
  const ltcgExemptionRemaining = Math.max(0, LTCG_EXEMPTION_LIMIT - ltcg);
  const ltcgExemptionPercent = Math.min(100, Math.round((ltcgExemptionUsed / LTCG_EXEMPTION_LIMIT) * 100));

  // Dynamic tax loss harvesting opportunities
  const losingStocks = useMemo(() => {
    return portfolio.stockHoldings
      .filter((s: any) => s.cmp < s.avgCost)
      .map((s: any) => ({
        id: s.id || s.symbol,
        symbol: s.symbol,
        name: s.name,
        quantity: s.quantity,
        avgCost: s.avgCost,
        cmp: s.cmp,
        loss: Math.round((s.avgCost - s.cmp) * s.quantity),
      }))
      .sort((a: any, b: any) => b.loss - a.loss);
  }, [portfolio.stockHoldings]);

  // Interactive Tax-Loss Harvesting Selection State
  const [selectedHarvestIds, setSelectedHarvestIds] = useState<string[]>([]);
  const [harvestSuccess, setHarvestSuccess] = useState(false);

  const totalHarvestableLoss = useMemo(() => {
    return losingStocks
      .filter((s) => selectedHarvestIds.includes(s.id))
      .reduce((sum, s) => sum + s.loss, 0);
  }, [losingStocks, selectedHarvestIds]);

  // Tax saved calculation: offsets STCG @ 20% first, then LTCG @ 12.5%
  const estimatedTaxSaved = useMemo(() => {
    if (totalHarvestableLoss <= 0) return 0;
    const stcgOffset = Math.min(stcg, totalHarvestableLoss);
    const remainingLoss = totalHarvestableLoss - stcgOffset;
    const ltcgOffset = Math.min(taxableLtcg, remainingLoss);
    return Math.round((stcgOffset * 0.20) + (ltcgOffset * 0.125));
  }, [totalHarvestableLoss, stcg, taxableLtcg]);

  const toggleSelectStock = (id: string) => {
    setSelectedHarvestIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedHarvestIds.length === losingStocks.length) {
      setSelectedHarvestIds([]);
    } else {
      setSelectedHarvestIds(losingStocks.map((s) => s.id));
    }
  };

  const handleExportCSV = () => {
    const headers = ['Asset Type', 'Symbol', 'Name', 'Quantity', 'Avg Cost (INR)', 'Current Price (INR)', 'Invested (INR)', 'Current Value (INR)', 'Gain/Loss (INR)', 'Tax Bucket', 'Tax Rate (%)'];
    const rows = taxableHoldings.map((h: any) => {
      const invested = h.avgCost * h.quantity;
      const current = h.cmp * h.quantity;
      const gain = current - invested;
      const bucket = h.isLTCG ? 'LTCG (> 12M)' : 'STCG (< 12M)';
      const rate = h.isLTCG ? '12.5%' : '20%';
      return [
        h.assetType || 'Stock',
        h.symbol,
        `"${h.name || h.symbol}"`,
        h.quantity,
        h.avgCost.toFixed(2),
        h.cmp.toFixed(2),
        invested.toFixed(2),
        current.toFixed(2),
        gain.toFixed(2),
        bucket,
        rate
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `arthova_capital_gains_FY2025_26_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[28px] text-text-primary">Tax Reports</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-accent-brass/10 text-accent-brass border border-accent-brass/20">
              FY 2025–26
            </span>
          </div>
          <p className="text-[13px] text-text-faint">
            Capital gains, Section 112A exemption headroom, and AI tax-loss harvesting
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-bg-surface-2 hover:bg-bg-surface-3 border border-border-default text-text-primary px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition-colors"
          >
            <Printer className="w-4 h-4 text-text-faint" />
            Print Statement
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-accent-brass hover:bg-accent-brass-dim text-bg-base px-4 py-2 rounded-[8px] text-[13px] font-semibold transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Schedule 112A (CSV)
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="STCG (< 12M)" value={formatINR(stcg)} sublabel="Taxed @ 20%" icon={<FileText className="w-4 h-4" />} />
        <SummaryCard label="LTCG (> 12M)" value={formatINR(ltcg)} sublabel="Taxed @ 12.5% above ₹1.25L" />
        <SummaryCard label="Total Taxable" value={formatINR(totalTaxable)} sublabel="includes div. & interest" />
        <SummaryCard label="Estimated Tax Liability" value={formatINR(estimatedTax)} sublabel="Net of deductions" />
      </div>

      {/* Section 112A ₹1.25 Lakh Exemption Headroom Meter */}
      <div className="bg-bg-surface border-2 border-accent-brass/30 rounded-[14px] p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-accent-brass/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-accent-brass" />
            </div>
            <div>
              <h2 className="text-[15px] font-medium text-text-primary">
                Section 112A Annual LTCG Exemption Meter
              </h2>
              <p className="text-[12px] text-text-faint">
                Every Indian investor gets ₹1,25,000 in 100% tax-free equity capital gains each financial year
              </p>
            </div>
          </div>
          <span className="text-[13px] font-mono font-medium text-accent-brass bg-accent-brass/10 px-3 py-1 rounded-full border border-accent-brass/20">
            {formatINR(ltcgExemptionUsed)} / {formatINR(LTCG_EXEMPTION_LIMIT)} ({ltcgExemptionPercent}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-bg-surface-2 rounded-full overflow-hidden border border-border-default">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                ltcgExemptionPercent >= 100 ? 'bg-warning' : 'bg-positive'
              )}
              style={{ width: `${ltcgExemptionPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11.5px] font-mono text-text-faint">
            <span>₹0 (Tax-Free Start)</span>
            <span>Threshold: ₹1,25,000</span>
          </div>
        </div>

        {/* Dynamic Context Banner */}
        <div className="bg-bg-surface-2 p-3.5 rounded-[10px] border border-border-default text-[12.5px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-brass shrink-0" />
            {ltcgExemptionRemaining > 0 ? (
              <span className="text-text-secondary">
                You have <strong className="text-positive font-mono">{formatINR(ltcgExemptionRemaining)}</strong> in remaining tax-free profit headroom! You can book profits up to this amount before March 31 without paying 1 rupee in tax.
              </span>
            ) : (
              <span className="text-text-secondary">
                You have exhausted your ₹1.25L exemption limit. Any additional long-term capital gains will be taxed at <strong className="text-warning">12.5%</strong>.
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Breakdown Card */}
        <div className="bg-bg-surface border border-border-default rounded-[14px] p-6">
          <h2 className="text-[16px] font-medium text-text-primary mb-4">Income & Tax Schedule</h2>
          <div className="space-y-3.5 text-[13px]">
            <div className="flex justify-between items-center py-1">
              <span className="text-text-secondary">Short-Term Capital Gains (STCG @ 20%)</span>
              <span className="font-mono text-text-primary font-medium">{formatINR(stcg)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-text-secondary">Long-Term Capital Gains (LTCG Gross)</span>
              <span className="font-mono text-text-primary font-medium">{formatINR(ltcg)}</span>
            </div>
            <div className="flex justify-between items-center py-1 text-positive">
              <span>Less: Section 112A Exemption</span>
              <span className="font-mono font-medium">-{formatINR(ltcgExemptionUsed)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-text-secondary">Taxable LTCG (@ 12.5%)</span>
              <span className="font-mono text-text-primary font-medium">{formatINR(taxableLtcg)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-text-secondary">Dividend Income (Slab @ 30%)</span>
              <span className="font-mono text-text-primary font-medium">{formatINR(dividendIncome)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-text-secondary">FD Interest Accrued (Slab @ 30%)</span>
              <span className="font-mono text-text-primary font-medium">{formatINR(interestIncome)}</span>
            </div>

            <div className="border-t border-border-default pt-3 flex justify-between items-center">
              <span className="text-[14px] font-medium text-text-primary">Total Estimated Tax Payable</span>
              <span className="text-[18px] font-medium text-accent-brass font-mono">{formatINR(estimatedTax)}</span>
            </div>
          </div>
        </div>

        {/* Interactive Tax-Loss Harvesting Simulator */}
        <div className="bg-bg-surface border border-border-default rounded-[14px] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border-default pb-3">
            <div className="flex items-center gap-2">
              <Scissors className="w-5 h-5 text-accent-brass" />
              <div>
                <h2 className="text-[16px] font-medium text-text-primary">Tax-Loss Harvesting Simulator</h2>
                <p className="text-[11.5px] text-text-faint">Sell losing assets to offset capital gains and reduce your tax liability</p>
              </div>
            </div>
            {losingStocks.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="text-[12px] text-accent-brass hover:underline font-medium"
              >
                {selectedHarvestIds.length === losingStocks.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {losingStocks.length === 0 ? (
              <div className="py-8 text-center bg-bg-surface-2 rounded-[10px] border border-border-default">
                <CheckCircle2 className="w-6 h-6 text-positive mx-auto mb-2" />
                <p className="text-[13px] font-medium text-text-primary">All Holdings Are Profitable</p>
                <p className="text-[11.5px] text-text-faint mt-0.5">No loss harvesting is needed right now.</p>
              </div>
            ) : (
              losingStocks.map((stock) => {
                const isSelected = selectedHarvestIds.includes(stock.id);
                return (
                  <div
                    key={stock.id}
                    onClick={() => toggleSelectStock(stock.id)}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-[10px] border cursor-pointer transition-all',
                      isSelected
                        ? 'bg-accent-brass/10 border-accent-brass/40 shadow-sm'
                        : 'bg-bg-surface-2 border-border-default hover:bg-bg-surface-3'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by parent div
                        className="accent-[#C9A227] w-4 h-4 rounded cursor-pointer"
                      />
                      <div>
                        <p className="text-[13px] font-medium text-text-primary">{stock.symbol}</p>
                        <p className="text-[11px] text-text-faint font-mono">
                          {stock.quantity} shares • Cost: ₹{stock.avgCost.toFixed(2)} • CMP: ₹{stock.cmp.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[13px] font-mono font-medium text-negative">
                        -{formatINR(stock.loss)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Simulation Results Footer */}
          {losingStocks.length > 0 && (
            <div className="pt-2 border-t border-border-default space-y-3">
              <div className="bg-bg-surface-2 p-3.5 rounded-[10px] border border-border-default flex items-center justify-between text-[12.5px]">
                <div>
                  <span className="text-text-faint block">Simulated Tax Savings:</span>
                  <span className="text-positive font-bold font-mono text-[16px]">
                    +{formatINR(estimatedTaxSaved)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-text-faint block">Harvestable Capital Loss:</span>
                  <span className="text-text-primary font-mono font-medium text-[14px]">
                    {formatINR(totalHarvestableLoss)}
                  </span>
                </div>
              </div>

              <button
                disabled={selectedHarvestIds.length === 0}
                onClick={() => {
                  setHarvestSuccess(true);
                  setTimeout(() => setHarvestSuccess(false), 5000);
                }}
                className={cn(
                  'w-full py-2.5 rounded-[8px] text-[13px] font-semibold transition-all shadow-sm',
                  'bg-accent-brass hover:bg-accent-brass-dim text-bg-base',
                  'disabled:opacity-40 disabled:cursor-not-allowed'
                )}
              >
                Execute Selected Tax Harvest Plan
              </button>

              {harvestSuccess && (
                <div className="p-3 rounded-[8px] bg-positive/10 border border-positive/30 text-positive text-[12px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Harvesting orders simulated. You will save approximately ₹{estimatedTaxSaved.toLocaleString('en-IN')} in capital gains tax!</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schedule 112A Tax Statement Table */}
      <div className="bg-bg-surface border border-border-default rounded-[14px] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-medium text-text-primary">Schedule 112A Holdings Statement</h2>
            <p className="text-[12px] text-text-faint">Granular asset-level breakdown of holding periods and tax classifications</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-accent-brass hover:underline text-[12.5px] font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-[10px] border border-border-default">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-bg-surface-2 text-[11px] font-medium text-text-faint uppercase tracking-wider font-mono">
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Avg Cost</th>
                <th className="px-4 py-3">CMP</th>
                <th className="px-4 py-3">Invested</th>
                <th className="px-4 py-3">Current</th>
                <th className="px-4 py-3">Unrealized P&L</th>
                <th className="px-4 py-3">Classification</th>
              </tr>
            </thead>
            <tbody className="text-[12.5px] divide-y divide-border-default font-mono">
              {taxableHoldings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-text-faint">No taxable holdings recorded.</td>
                </tr>
              ) : (
                taxableHoldings.map((h: any, idx: number) => {
                  const invested = h.avgCost * h.quantity;
                  const current = h.cmp * h.quantity;
                  const gain = current - invested;
                  const isPositive = gain >= 0;

                  return (
                    <tr key={idx} className="hover:bg-bg-surface-2 transition-colors">
                      <td className="px-4 py-2.5 font-sans font-medium text-text-primary">
                        {h.name || h.symbol}
                        <span className="text-[11px] text-text-faint block font-mono">{h.symbol}</span>
                      </td>
                      <td className="px-4 py-2.5 text-text-secondary">{h.quantity}</td>
                      <td className="px-4 py-2.5 text-text-secondary">₹{h.avgCost.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-text-primary font-medium">₹{h.cmp.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{formatINR(invested)}</td>
                      <td className="px-4 py-2.5 text-text-primary">{formatINR(current)}</td>
                      <td className={cn('px-4 py-2.5 font-semibold', isPositive ? 'text-positive' : 'text-negative')}>
                        {isPositive ? '+' : ''}{formatINR(gain)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full font-medium font-sans',
                          h.isLTCG ? 'bg-positive/10 text-positive border border-positive/20' : 'bg-warning/10 text-warning border border-warning/20'
                        )}>
                          {h.isLTCG ? 'LTCG (12.5%)' : 'STCG (20%)'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
