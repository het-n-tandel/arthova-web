'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PiggyBank, Calendar, Star as StarIcon, Plus, Sparkles, TrendingUp, Layers, Briefcase, LineChart, X } from 'lucide-react';
import { formatINR, formatINRCompact, formatDate, cn } from '@/lib/formatters';
import { SummaryCard } from '@/components/ui/summary-card';
import { DeltaBadge } from '@/components/ui/delta-badge';
import { usePortfolio } from '@/lib/hooks/use-portfolio';
import { AssetActionModal } from '@/components/ui/asset-action-modal';
import { EmptyState } from '@/components/ui/empty-state';
import { MutualFundScreenerLab } from '@/components/portfolio/mutual-fund-screener-lab';
import { SipCalculatorChart } from '@/components/charts/sip-calculator-chart';
import { MutualFundPerformanceChart } from '@/components/charts/mf-performance-chart';

export default function MutualFundsPage() {
  const { mfHoldings, assets } = usePortfolio();
  
  const mfStats = assets.find(a => a.name === 'Mutual Funds') || { invested: 0, current: 0, gain: 0, gainPercent: 0 };
  
  const activeSIPs = mfHoldings.filter(f => f.quantity > 0);
  const totalSIPAmount = mfHoldings.reduce((s, f) => s + (f.quantity * f.avgCost), 0);

  // If user has no active funds, default to Screener tab
  const [activeTab, setActiveTab] = useState<'screener' | 'holdings'>(
    activeSIPs.length > 0 ? 'holdings' : 'screener'
  );

  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [inspectedHolding, setInspectedHolding] = useState<any>(null);
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
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-[28px] text-text-primary mb-1">Mutual Funds & SIPs</h1>
          <p className="text-[13px] text-text-faint">Track your mutual fund investments and SIP performance</p>
        </div>
        <button onClick={() => setIsTradeOpen(true)} className="flex items-center gap-2 bg-accent-brass hover:bg-accent-brass-dim text-bg-base px-4 py-2 rounded-[8px] font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Trade Funds
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Invested" value={formatINRCompact(mfStats.invested)} icon={<PiggyBank className="w-4 h-4" />} />
        <SummaryCard label="Current Value" value={formatINRCompact(mfStats.current)} delta={mfStats.gainPercent} />
        <SummaryCard label="Active Funds" value={`${activeSIPs.length}`} sublabel={`${formatINR(mfStats.current / (activeSIPs.length || 1))}/avg value`} />
        <SummaryCard label="Total P&L" value={formatINR(mfStats.gain)} delta={mfStats.gainPercent} />
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-border-default pb-2">
        <button
          onClick={() => setActiveTab('screener')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer',
            activeTab === 'screener'
              ? 'bg-emerald-600 text-white font-semibold shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-2'
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>Fund Screener &amp; Factor Lab</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/20 text-white">
            AMFI Live
          </span>
        </button>

        <button
          onClick={() => setActiveTab('holdings')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer',
            activeTab === 'holdings'
              ? 'bg-accent-brass text-bg-base font-semibold shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-2'
          )}
        >
          <Briefcase className="w-4 h-4" />
          <span>My Fund Holdings &amp; SIPs</span>
          <span className={cn(
            'text-[10px] font-mono px-1.5 py-0.5 rounded-full',
            activeTab === 'holdings' ? 'bg-bg-base/20 text-bg-base font-bold' : 'bg-bg-surface-3 text-text-faint'
          )}>
            {activeSIPs.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Mutual Fund Screener & Factor Lab */}
      {activeTab === 'screener' && (
        <MutualFundScreenerLab />
      )}

      {/* Tab 2: Holdings & SIP Management */}
      {activeTab === 'holdings' && (
        <div className="space-y-6">
          {mfHoldings.length === 0 ? (
            <EmptyState
              icon={PiggyBank}
              title="No Mutual Funds or SIPs Logged"
              description="Track active Systematic Investment Plans (SIPs) across Flexi Cap, Large & Mid Cap, and Index funds."
              tip="Systematic rupee-cost averaging via mutual funds ensures disciplined compounding without trying to time daily market swings."
              actionLabel="Add Your First Mutual Fund"
              onAction={() => setIsTradeOpen(true)}
              accentColor="#C9A227"
            />
          ) : (
            <div>
              <h2 className="text-[16px] font-medium text-text-primary mb-4">Fund Holdings</h2>
              <div className="overflow-x-auto rounded-[12px] border border-border-default">
                <table className="w-full">
                  <thead>
                    <tr className="bg-bg-surface-2">
                      <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Fund</th>
                      <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Units</th>
                      <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Avg NAV</th>
                      <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>CMP</th>
                      <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Invested</th>
                      <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Current</th>
                      <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>P&L</th>
                      <th className="px-4 py-3 text-right text-[11px] font-medium text-text-faint uppercase tracking-wider" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Analytics</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mfHoldings.map((mf) => (
                      <tr key={mf.id} className="border-t border-border-default hover:bg-bg-surface-2 transition-colors h-[52px]">
                        <td className="px-4 py-2">
                          <p className="text-[13px] font-medium text-text-primary truncate max-w-[200px]" title={mf.name}>{mf.name}</p>
                          <p className="text-[11px] text-text-faint">{mf.symbol}</p>
                        </td>
                        <td className="px-4 py-2 text-[13px]" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{mf.quantity}</td>
                        <td className="px-4 py-2 text-[13px] text-text-secondary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>₹{mf.avgCost.toFixed(2)}</td>
                        <td className="px-4 py-2 text-[13px]" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>₹{mf.cmp.toFixed(2)}</td>
                        <td className="px-4 py-2 text-[13px] text-text-secondary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(mf.avgCost * mf.quantity)}</td>
                        <td className="px-4 py-2 text-[13px] text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(mf.cmp * mf.quantity)}</td>
                        <td className="px-4 py-2">
                          <DeltaBadge value={((mf.cmp - mf.avgCost) / mf.avgCost) * 100} />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => setInspectedHolding(mf)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-bg-surface-2 hover:bg-accent-brass/10 border border-border-default hover:border-accent-brass/30 text-text-primary text-[11px] font-medium transition-all cursor-pointer"
                            title="View Interactive NAV & SIP Compounding Graph"
                          >
                            <LineChart className="w-3.5 h-3.5 text-accent-brass" />
                            <span>Graph</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SIP Compounding Calculator & Interactive Horizon Graph */}
          <div className="bg-bg-surface border border-border-default rounded-[12px] p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-default pb-4">
              <div>
                <h2 className="text-[17px] font-semibold text-text-primary flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent-brass" />
                  SIP Compounding Calculator &amp; Horizon Graph
                </h2>
                <p className="text-[12px] text-text-faint">
                  Simulate wealth creation over time with disciplined monthly rupee-cost averaging
                </p>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-bg-surface-2 text-accent-brass border border-border-default font-medium">
                Live Compounding Projections
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Sliders and Metrics Column (5 cols) */}
              <div className="lg:col-span-5 space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[12px] text-text-faint">Monthly Investment</label>
                    <span className="text-[13px] text-text-primary font-mono font-bold">
                      {formatINR(sipCalcMonthly)}
                    </span>
                  </div>
                  <input type="range" min="1000" max="100000" step="1000" value={sipCalcMonthly} onChange={(e) => setSipCalcMonthly(Number(e.target.value))} className="w-full accent-[#C9A227] cursor-pointer" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[12px] text-text-faint">Investment Horizon</label>
                    <span className="text-[13px] text-text-primary font-mono font-bold">
                      {sipCalcYears} Years
                    </span>
                  </div>
                  <input type="range" min="1" max="30" value={sipCalcYears} onChange={(e) => setSipCalcYears(Number(e.target.value))} className="w-full accent-[#C9A227] cursor-pointer" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[12px] text-text-faint">Expected Return (CAGR)</label>
                    <span className="text-[13px] text-emerald-400 font-mono font-bold">
                      {sipCalcRate}% p.a.
                    </span>
                  </div>
                  <input type="range" min="4" max="25" step="0.5" value={sipCalcRate} onChange={(e) => setSipCalcRate(Number(e.target.value))} className="w-full accent-[#C9A227] cursor-pointer" />
                </div>

                {/* Metric Summary Strip */}
                <div className="bg-bg-surface-2 rounded-[12px] p-4 space-y-3 border border-border-default/60">
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] text-text-secondary">Total Invested Principal</span>
                    <span className="text-[15px] text-text-primary font-mono font-semibold">{formatINRCompact(sipCalcResult.invested)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] text-text-secondary">Est. Compounded Gains</span>
                    <span className="text-[15px] text-positive font-mono font-semibold">+{formatINRCompact(sipCalcResult.gains)}</span>
                  </div>
                  <div className="border-t border-border-default pt-2.5 flex justify-between items-center">
                    <span className="text-[13px] font-medium text-text-primary">Expected Corpus</span>
                    <span className="text-[20px] text-accent-brass font-mono font-bold">{formatINRCompact(sipCalcResult.futureValue)}</span>
                  </div>
                </div>
              </div>

              {/* Interactive SIP Horizon Area Chart (7 cols) */}
              <div className="lg:col-span-7 flex flex-col justify-center">
                <SipCalculatorChart
                  monthlyInvestment={sipCalcMonthly}
                  years={sipCalcYears}
                  annualRate={sipCalcRate}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Modal for Held Mutual Fund Graph */}
      {inspectedHolding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-bg-surface border border-border-default rounded-[16px] max-w-3xl w-full p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border-default pb-3">
              <div>
                <h3 className="text-[18px] font-bold text-text-primary">{inspectedHolding.name}</h3>
                <p className="text-[12px] text-text-faint font-mono">Symbol: {inspectedHolding.symbol} • Active Units: {inspectedHolding.quantity}</p>
              </div>
              <button
                onClick={() => setInspectedHolding(null)}
                className="p-1.5 rounded-lg hover:bg-bg-surface-2 text-text-faint hover:text-text-primary transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <MutualFundPerformanceChart
              schemeName={inspectedHolding.name}
              currentNav={inspectedHolding.cmp}
              cagr1Y={17.5}
              cagr3Y={20.4}
              cagr5Y={18.9}
              category="Held Asset"
              benchmarkName="Nifty 50 TRI"
              onStartSip={() => {
                setInspectedHolding(null);
                setIsTradeOpen(true);
              }}
            />
          </div>
        </div>
      )}

      <AnimatePresence>
        {isTradeOpen && <AssetActionModal assetType="mutual_fund" mode="add" onClose={() => setIsTradeOpen(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
