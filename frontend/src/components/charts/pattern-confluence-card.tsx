'use client';

import { useState } from 'react';
import {
  Layers,
  ShieldCheck,
  Zap,
  Target,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Cpu,
  BarChart2,
  Info,
  ChevronRight,
  Crosshair,
} from 'lucide-react';
import { cn, formatINR } from '@/lib/formatters';
import { DisclosureCard } from '@/components/ui/disclosure-card';
import {
  calculateConfluenceMatrix,
  type ConfluenceMatrixResult,
  type CandleBar,
} from '@/lib/strategies/pattern-confluence-engine';

interface PatternConfluenceCardProps {
  symbol: string;
  bars: CandleBar[];
  currentPrice: number;
  className?: string;
}

export function PatternConfluenceCard({
  symbol,
  bars,
  currentPrice,
  className = '',
}: PatternConfluenceCardProps) {
  const result: ConfluenceMatrixResult = calculateConfluenceMatrix(symbol, bars);

  const [activeTab, setActiveTab] = useState<'matrix' | 'plan' | 'theory'>('matrix');

  const getVerdictBadge = () => {
    switch (result.verdict) {
      case 'High-Conviction Buy':
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-400',
        };
      case 'Strong Buy':
        return {
          bg: 'bg-green-500/15 border-green-500/30 text-green-400',
          dot: 'bg-green-400',
        };
      case 'Speculative Buy':
        return {
          bg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
          dot: 'bg-cyan-400',
        };
      case 'False Breakout Trap':
        return {
          bg: 'bg-rose-500/20 border-rose-500/40 text-rose-400',
          dot: 'bg-rose-400',
        };
      default:
        return {
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-400',
        };
    }
  };

  const badgeStyle = getVerdictBadge();

  return (
    <div
      className={cn(
        'bg-bg-surface border border-border-default rounded-[14px] overflow-hidden shadow-xs',
        className
      )}
    >
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-border-default gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-text-primary leading-tight">
                Pattern Confluence Matrix
              </h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                3-Layer Engine
              </span>
            </div>
            <p className="text-[11.5px] text-text-faint mt-0.5">
              Classical Structure · Custom VCP Model · Institutional Volume Shield
            </p>
          </div>
        </div>

        {/* Verdict Badge */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1 rounded-full border text-[12px] font-mono font-bold',
              badgeStyle.bg
            )}
          >
            <span className={cn('w-2 h-2 rounded-full animate-pulse', badgeStyle.dot)} />
            <span>{result.verdict}</span>
            <span className="text-text-faint">·</span>
            <span>{result.confluenceScore}%</span>
          </div>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex items-center gap-1 px-5 pt-4 border-b border-border-default bg-bg-surface-2/40">
        {[
          { id: 'matrix', label: '3-Layer Confluence Matrix' },
          { id: 'plan', label: 'Quantitative Trade Setup' },
          { id: 'theory', label: 'Strategy Architecture' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'px-3 py-2 text-[12px] font-medium border-b-2 transition-all cursor-pointer -mb-[1px]',
              activeTab === tab.id
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-text-faint hover:text-text-primary'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4">
        {/* ── TAB 1: 3-Layer Confluence Matrix ── */}
        {activeTab === 'matrix' && (
          <div className="space-y-4">
            {/* Confluence Score Bar */}
            <div className="bg-bg-surface-2 p-3.5 rounded-[10px] border border-border-default space-y-2">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-text-faint font-mono uppercase text-[11px]">
                  Ensemble Confluence Score
                </span>
                <span className="font-mono font-bold text-text-primary">
                  {result.confluenceScore} / 100
                </span>
              </div>
              <div className="w-full h-2.5 bg-bg-surface-3 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    result.confluenceScore >= 75
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                      : result.confluenceScore >= 55
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  )}
                  style={{ width: `${result.confluenceScore}%` }}
                />
              </div>
              <p className="text-[11.5px] text-text-secondary leading-relaxed">
                {result.summary}
              </p>
            </div>

            {/* The 3 Layers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Layer 1 */}
              <div className="bg-bg-surface-2/70 p-4 rounded-[10px] border border-border-default space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                      <Target className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <span className="text-[11px] font-mono uppercase font-bold text-blue-400">
                      Layer 1
                    </span>
                  </div>
                  <span
                    className={cn(
                      'text-[10.5px] font-mono px-2 py-0.5 rounded-full border',
                      result.layer1.patterns.length > 0
                        ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                        : 'bg-bg-surface-3 text-text-faint border-border-default'
                    )}
                  >
                    {result.layer1.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-[13px] font-semibold text-text-primary">
                    Pre-Defined Formations
                  </h4>
                  <p className="text-[11px] text-text-faint mt-0.5">
                    Classical structural support/resistance
                  </p>
                </div>

                <div className="border-t border-border-default/60 pt-2 space-y-2">
                  {result.layer1.patterns.length > 0 ? (
                    result.layer1.patterns.map((p) => (
                      <div key={p.id} className="space-y-1">
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="text-text-primary font-medium">{p.name}</span>
                          <span className="font-mono text-blue-400 font-bold">{p.confidence}%</span>
                        </div>
                        <p className="text-[11px] text-text-secondary leading-tight">{p.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11.5px] text-text-faint italic py-2">
                      No classic reversal pattern triggered at current candle.
                    </div>
                  )}
                </div>
              </div>

              {/* Layer 2 */}
              <div className="bg-bg-surface-2/70 p-4 rounded-[10px] border border-border-default space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-md bg-violet-500/10 flex items-center justify-center">
                      <Cpu className="w-3.5 h-3.5 text-violet-400" />
                    </div>
                    <span className="text-[11px] font-mono uppercase font-bold text-violet-400">
                      Layer 2
                    </span>
                  </div>
                  <span
                    className={cn(
                      'text-[10.5px] font-mono px-2 py-0.5 rounded-full border',
                      result.layer2.status === 'Triggered'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-violet-500/10 text-violet-300 border-violet-500/20'
                    )}
                  >
                    {result.layer2.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-[13px] font-semibold text-text-primary">
                    Custom Trained Model
                  </h4>
                  <p className="text-[11px] text-text-faint mt-0.5">
                    Volatility contraction &amp; volume footprint
                  </p>
                </div>

                <div className="border-t border-border-default/60 pt-2 space-y-2">
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-text-faint">Model Win Rate:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {result.layer2.customPattern.winProbability}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-text-faint">Volume Surge:</span>
                    <span className="font-mono text-text-primary">
                      {result.layer2.customPattern.volumeExpansionRatio}x 20-SMA
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-text-faint">Range Compression:</span>
                    <span className="font-mono text-text-primary">
                      {result.layer2.customPattern.volatilityCompressionRatio}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-tight pt-1">
                    {result.layer2.customPattern.description}
                  </p>
                </div>
              </div>

              {/* Layer 3 */}
              <div className="bg-bg-surface-2/70 p-4 rounded-[10px] border border-border-default space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-[11px] font-mono uppercase font-bold text-emerald-400">
                      Layer 3
                    </span>
                  </div>
                  <span
                    className={cn(
                      'text-[10.5px] font-mono px-2 py-0.5 rounded-full border',
                      result.layer3.status === 'Confirmed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : result.layer3.status === 'Blocked'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    )}
                  >
                    {result.layer3.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-[13px] font-semibold text-text-primary">
                    Ensemble Filter Shield
                  </h4>
                  <p className="text-[11px] text-text-faint mt-0.5">
                    False breakout elimination &amp; trend alignment
                  </p>
                </div>

                <div className="border-t border-border-default/60 pt-2 space-y-2">
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-text-faint">Volume Anomaly:</span>
                    <span
                      className={cn(
                        'font-mono font-bold',
                        result.layer3.filter.volumeConfirmed ? 'text-emerald-400' : 'text-rose-400'
                      )}
                    >
                      {result.layer3.filter.volumeRatio20}x (Req &gt; 1.4x)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-text-faint">Trend Alignment:</span>
                    <span
                      className={cn(
                        'font-mono font-medium',
                        result.layer3.filter.trendConfirmed ? 'text-emerald-400' : 'text-amber-400'
                      )}
                    >
                      {result.layer3.filter.trendAlignment}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-text-faint">Trap Risk:</span>
                    <span
                      className={cn(
                        'font-mono font-bold',
                        result.layer3.filter.falseBreakoutRisk === 'Low'
                          ? 'text-emerald-400'
                          : result.layer3.filter.falseBreakoutRisk === 'Moderate'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      )}
                    >
                      {result.layer3.filter.falseBreakoutRisk}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-tight pt-1">
                    {result.layer3.filter.filterReasoning}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: Quantitative Trade Setup ── */}
        {activeTab === 'plan' && (
          <div className="space-y-4">
            {/* Pattern Recognized Header Banner */}
            <div className="bg-cyan-500/10 border border-cyan-500/25 rounded-[10px] p-3.5 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block">
                    Recognized Setup Engine
                  </span>
                  <p className="text-[14px] font-semibold text-text-primary">
                    {result.tradePlan.recognizedPattern}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-cyan-300 bg-cyan-500/15 px-2.5 py-1 rounded-full border border-cyan-500/30">
                {result.tradePlan.patternOrigin}
              </span>
            </div>

            {/* Target & Stop Loss Summary Card */}
            <div className="bg-bg-surface-2 p-4 rounded-[10px] border border-border-default space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase text-text-faint">
                    Execution Trigger (Entry)
                  </span>
                  <p className="text-[20px] font-mono font-bold text-text-primary">
                    {formatINR(result.tradePlan.entryPrice)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono uppercase text-text-faint">
                    Calculated Risk : Reward
                  </span>
                  <p className="text-[20px] font-mono font-bold text-emerald-400">
                    1 : {result.tradePlan.riskRewardRatio}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border-default">
                <div className="bg-rose-500/5 border border-rose-500/20 p-2.5 rounded-[8px]">
                  <span className="text-[10px] font-mono uppercase text-rose-400 block font-bold">
                    Stop Loss
                  </span>
                  <span className="text-[15px] font-mono font-bold text-text-primary">
                    {formatINR(result.tradePlan.stopLoss)}
                  </span>
                  <span className="text-[10.5px] font-mono text-rose-400 block mt-0.5">
                    -₹{result.tradePlan.riskPerShare} / sh
                  </span>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/20 p-2.5 rounded-[8px]">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 block font-bold">
                    Target 1 (Primary)
                  </span>
                  <span className="text-[15px] font-mono font-bold text-text-primary">
                    {formatINR(result.tradePlan.target1)}
                  </span>
                  <span className="text-[10.5px] font-mono text-emerald-400 block mt-0.5">
                    +₹{result.tradePlan.rewardPerShare} / sh
                  </span>
                </div>

                <div className="bg-cyan-500/5 border border-cyan-500/20 p-2.5 rounded-[8px]">
                  <span className="text-[10px] font-mono uppercase text-cyan-400 block font-bold">
                    Target 2 (Runner)
                  </span>
                  <span className="text-[15px] font-mono font-bold text-text-primary">
                    {formatINR(result.tradePlan.target2)}
                  </span>
                  <span className="text-[10.5px] font-mono text-cyan-400 block mt-0.5">
                    3.2R Multiple
                  </span>
                </div>
              </div>
            </div>

            {/* How These Levels Were Generated (User-Connected Explanations) */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase text-text-faint tracking-wide block">
                How These Levels Were Generated
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[12px]">
                {/* Entry Trigger Card */}
                <div className="bg-bg-surface-2/70 border border-border-default rounded-[8px] p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-text-primary font-semibold">
                    <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                    <span>Entry Trigger Calculation</span>
                  </div>
                  <p className="text-[11.5px] text-text-secondary leading-relaxed">
                    {result.tradePlan.entryReason}
                  </p>
                </div>

                {/* Stop Loss Card */}
                <div className="bg-bg-surface-2/70 border border-border-default rounded-[8px] p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-text-primary font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                    <span>Stop Loss Logic</span>
                  </div>
                  <p className="text-[11.5px] text-text-secondary leading-relaxed">
                    {result.tradePlan.stopLossReason}
                  </p>
                </div>

                {/* Target 1 Card */}
                <div className="bg-bg-surface-2/70 border border-border-default rounded-[8px] p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-text-primary font-semibold">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Target 1 Projection</span>
                  </div>
                  <p className="text-[11.5px] text-text-secondary leading-relaxed">
                    {result.tradePlan.target1Reason}
                  </p>
                </div>

                {/* Target 2 Card */}
                <div className="bg-bg-surface-2/70 border border-border-default rounded-[8px] p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-text-primary font-semibold">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Target 2 Trend Runner</span>
                  </div>
                  <p className="text-[11.5px] text-text-secondary leading-relaxed">
                    {result.tradePlan.target2Reason}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-bg-surface-2 border border-border-default rounded-[10px] p-3 text-[11.5px] text-text-secondary leading-relaxed">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Execution Discipline</strong>: Never move your stop loss lower once entered. If price drops below <strong>{formatINR(result.tradePlan.stopLoss)}</strong>, the pattern premise is invalid and capital preservation takes priority.
              </span>
            </div>
          </div>
        )}

        {/* ── TAB 3: Strategy Architecture & Theory ── */}
        {activeTab === 'theory' && (
          <div className="space-y-3">
            <DisclosureCard
              title="Layer 1: Classical Geometric Formations"
              subtitle="Double Bottoms, Reversal Candles, and Pivot Extraction"
              badge="Deterministic"
              icon={<Target className="w-4 h-4 text-blue-400" />}
              variant="subtle"
            >
              <p className="text-[12px] text-text-secondary leading-relaxed pt-1">
                Classical patterns are identified via local swing extrema detection. A Double Bottom
                requires two troughs within a 2.5% price tolerance separated by a distinct peak
                neckline. Hammer candles require lower wicks exceeding 2.0x body height with minimal
                upper shadow, confirming buyer absorption.
              </p>
            </DisclosureCard>

            <DisclosureCard
              title="Layer 2: Custom Volatility Contraction Pattern (VCP)"
              subtitle="Mark Minervini / Institutional Liquidity Footprint"
              badge="Proprietary Model"
              icon={<Cpu className="w-4 h-4 text-violet-400" />}
              variant="subtle"
            >
              <p className="text-[12px] text-text-secondary leading-relaxed pt-1">
                Institutional buyers accumulate shares without driving prices up prematurely. This
                creates successively smaller price contractions (e.g., 12% → 6% → 2%) as floating
                supply is removed from the market. When volume subsequently expands on breakout, the
                probability of sustainable upside continuation exceeds 80%.
              </p>
            </DisclosureCard>

            <DisclosureCard
              title="Layer 3: Ensemble False Breakout Filter"
              subtitle="Volume Anomalies and Trap Prevention"
              badge="Risk Shield"
              icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
              variant="subtle"
            >
              <p className="text-[12px] text-text-secondary leading-relaxed pt-1">
                Over 60% of retail breakouts fail because they occur on low volume (lack of
                institutional sponsorship) or counter to higher-timeframe trend alignment. Layer 3
                enforces a strict requirement: volume must exceed 1.4x 20-day SMA, price must be
                aligned with EMA-20/50, and RSI must not be overextended (&gt;78).
              </p>
            </DisclosureCard>
          </div>
        )}
      </div>
    </div>
  );
}
