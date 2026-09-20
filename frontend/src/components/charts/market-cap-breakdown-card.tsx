'use client';

import { ShieldCheck, AlertTriangle, TrendingUp, Layers, Info } from 'lucide-react';
import { MarketCapAllocationAnalysis } from '@/lib/ai-engine';

interface MarketCapBreakdownCardProps {
  marketCapAllocation?: MarketCapAllocationAnalysis;
  isLoading?: boolean;
}

export function MarketCapBreakdownCard({
  marketCapAllocation,
  isLoading = false,
}: MarketCapBreakdownCardProps) {
  if (isLoading || !marketCapAllocation) {
    return (
      <div className="rounded-2xl border border-border-default bg-bg-surface p-6 shadow-sm animate-pulse">
        <div className="h-6 w-56 bg-bg-surface-2 rounded mb-4" />
        <div className="h-28 bg-bg-surface-2 rounded mb-4" />
        <div className="h-20 bg-bg-surface-2 rounded" />
      </div>
    );
  }

  const { targets, currentRatio, concentrationAlerts, sectorBreakdown } = marketCapAllocation;

  const tiers = [
    {
      name: 'Large Cap',
      badge: 'Nifty 50 / 100 Leaders',
      current: currentRatio.largeCapPercent,
      target: targets.largeCap.targetPercent,
      min: targets.largeCap.minFloorPercent,
      max: targets.largeCap.maxCeilingPercent,
      rationale: targets.largeCap.rationale,
      color: 'from-blue-500 to-indigo-600',
      barColor: 'bg-blue-500',
      bgColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    {
      name: 'Mid Cap',
      badge: 'Nifty Midcap 150 Growth',
      current: currentRatio.midCapPercent,
      target: targets.midCap.targetPercent,
      min: targets.midCap.minFloorPercent,
      max: targets.midCap.maxCeilingPercent,
      rationale: targets.midCap.rationale,
      color: 'from-amber-500 to-orange-600',
      barColor: 'bg-amber-500',
      bgColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    {
      name: 'Small Cap',
      badge: 'Nifty Smallcap 250 Alpha',
      current: currentRatio.smallCapPercent,
      target: targets.smallCap.targetPercent,
      min: targets.smallCap.minFloorPercent,
      max: targets.smallCap.maxCeilingPercent,
      rationale: targets.smallCap.rationale,
      color: 'from-emerald-500 to-teal-600',
      barColor: 'bg-emerald-500',
      bgColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
  ];

  return (
    <div className="rounded-2xl border border-border-default bg-bg-surface p-6 shadow-sm transition-all duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 pb-4 border-b border-border-default">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent-brass/10 border border-accent-brass/20 text-accent-brass">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
              Market-Cap Allocation & Guardrails
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent-brass/15 text-accent-brass border border-accent-brass/30">
                PMS / SEBI RIA Rules
              </span>
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Disciplined multi-tier capitalization with strict single-stock (&le;10%) and sector (&le;25%) concentration limits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-faint">
          <Info className="w-3.5 h-3.5" />
          <span>Dynamic targets calibrated to your risk profile & horizon</span>
        </div>
      </div>

      {/* Tier Bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {tiers.map((tier) => {
          const isOverCeiling = tier.current > tier.max;
          const isUnderFloor = tier.current < tier.min;

          return (
            <div
              key={tier.name}
              className="p-4 rounded-xl border border-border-default bg-bg-surface-2/40 flex flex-col justify-between relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-text-primary">{tier.name}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${tier.bgColor}`}>
                    Target: {tier.target}%
                  </span>
                </div>

                <div className="flex items-baseline justify-between mb-3 font-mono">
                  <div className="text-2xl font-bold text-text-primary">
                    {tier.current}%
                    <span className="text-xs font-normal text-text-faint ml-1.5">Current</span>
                  </div>
                  <div className="text-right text-xs text-text-secondary">
                    Floor: <span className="font-medium text-text-primary">{tier.min}%</span> | Max:{' '}
                    <span className="font-medium text-text-primary">{tier.max}%</span>
                  </div>
                </div>

                {/* Progress Visualizer */}
                <div className="space-y-1.5 mb-3">
                  <div className="h-2.5 w-full bg-bg-surface-3 rounded-full overflow-hidden flex relative">
                    <div
                      className={`h-full ${tier.barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(100, tier.current)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-text-faint font-mono">
                    <span>Min {tier.min}%</span>
                    <span className="text-accent-brass">Recommended {tier.target}%</span>
                    <span>Max {tier.max}%</span>
                  </div>
                </div>

                <p className="text-[11px] text-text-secondary leading-relaxed mb-2">
                  {tier.rationale}
                </p>
              </div>

              {/* Status Indicator */}
              <div className="pt-2 border-t border-border-default/50 text-[11px] flex items-center gap-1.5">
                {isOverCeiling ? (
                  <span className="text-warning flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" /> Over ceiling (&gt;{tier.max}%)
                  </span>
                ) : isUnderFloor ? (
                  <span className="text-accent-brass flex items-center gap-1 font-medium">
                    <TrendingUp className="w-3.5 h-3.5" /> Under floor (&lt;{tier.min}%)
                  </span>
                ) : (
                  <span className="text-positive flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> Within safe corridor
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Concentration Alerts Section */}
      {concentrationAlerts && concentrationAlerts.length > 0 ? (
        <div className="mb-6 space-y-2.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            Active Institutional Risk Warnings ({concentrationAlerts.length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {concentrationAlerts.map((alert, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-warning/30 bg-warning/5 flex items-start gap-3"
              >
                <div className="p-1.5 rounded-lg bg-warning/10 text-warning shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-xs font-semibold text-text-primary">{alert.title}</h5>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-warning/15 text-warning">
                      {alert.currentValue} / {alert.safeLimit}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary mt-1 leading-snug">
                    {alert.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6 p-3.5 rounded-xl border border-positive/30 bg-positive/5 flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-positive/10 text-positive shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-positive">
              Zero Concentration Breaches
            </div>
            <div className="text-[11px] text-text-secondary mt-0.5">
              All single-stock positions remain under the 10% ceiling, and no single sector exceeds 25%.
            </div>
          </div>
        </div>
      )}

      {/* Sector Breakdown */}
      {sectorBreakdown && sectorBreakdown.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2.5 flex items-center justify-between">
            <span>Portfolio Sector Exposure</span>
            <span className="text-[10px] font-normal text-text-faint">Ceiling: 25% per sector</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sectorBreakdown.map((sec) => (
              <div
                key={sec.sector}
                className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
                  sec.isBreached
                    ? 'border-warning/40 bg-warning/10 text-warning font-medium'
                    : 'border-border-default bg-bg-surface-2 text-text-secondary'
                }`}
              >
                <span>{sec.sector}</span>
                <span className="font-mono text-text-primary font-semibold">{sec.percent}%</span>
                {sec.isBreached && <AlertTriangle className="w-3 h-3 text-warning" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
