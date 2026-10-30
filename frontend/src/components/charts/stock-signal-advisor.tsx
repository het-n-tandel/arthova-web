'use client';

/**
 * StockSignalAdvisor — Arthova Trader-Grade Advisory Card
 *
 * Exactly how professional traders work:
 * "RELIANCE shows 7/10 bullish signals →
 *  In past 10 years, when 7+ signals aligned,
 *  price went UP 68% of 30-day windows → BUY (68% confidence)"
 *
 * Also shows: position sizing, stop-loss, targets, exit triggers
 */

import { useState } from 'react';
import {
  Brain, TrendingUp, TrendingDown, Minus, RefreshCw,
  ChevronDown, AlertTriangle, CheckCircle2, ShieldAlert,
  Target, ShieldCheck, Info, Sparkles, BarChart2,
  BookOpen, ArrowUpRight, ArrowDownRight, Activity,
} from 'lucide-react';
import { cn, formatINR } from '@/lib/formatters';
import { DisclosureCard } from '@/components/ui/disclosure-card';
import type { SignalFrequencyResult, SignalResult, FrequencyWindow } from '@/lib/strategies/signal-frequency-engine';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface StockSignalAdvisorProps {
  symbol: string;
  currentPrice?: number;
  className?: string;
}

type Period = { value: string; label: string; sublabel: string };
const PERIODS: Period[] = [
  { value: '1y',  label: '1 Year',   sublabel: '~252 bars'   },
  { value: '2y',  label: '2 Years',  sublabel: '~504 bars'   },
  { value: '3y',  label: '3 Years',  sublabel: '~756 bars'   },
  { value: '5y',  label: '5 Years',  sublabel: '~1,260 bars' },
  { value: '10y', label: '10 Years', sublabel: '~2,520 bars' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function verdictStyle(verdict: string) {
  if (verdict === 'Strong Buy')   return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: CheckCircle2,  pill: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
  if (verdict === 'Buy')          return { bg: 'bg-green-500/10',   border: 'border-green-500/30',   text: 'text-green-400',   icon: TrendingUp,    pill: 'bg-green-500/15 text-green-400 border-green-500/30'       };
  if (verdict === 'Hold')         return { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   icon: Minus,         pill: 'bg-amber-500/15 text-amber-400 border-amber-500/30'       };
  if (verdict === 'Avoid')        return { bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    text: 'text-rose-400',    icon: AlertTriangle, pill: 'bg-rose-500/15 text-rose-400 border-rose-500/30'         };
  return                               { bg: 'bg-red-600/10',     border: 'border-red-600/30',     text: 'text-red-400',     icon: ShieldAlert,   pill: 'bg-red-600/15 text-red-400 border-red-600/30'            };
}

function signalDot(verdict: SignalResult['verdict']) {
  if (verdict === 'bullish') return <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />;
  if (verdict === 'bearish') return <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />;
  return <span className="w-2 h-2 rounded-full bg-amber-400/60 shrink-0" />;
}

function FreqCard({ fw }: { fw: FrequencyWindow }) {
  const color = fw.probabilityUp >= 65 ? 'text-emerald-400' : fw.probabilityUp >= 50 ? 'text-amber-400' : 'text-rose-400';
  const barColor = fw.probabilityUp >= 65 ? 'bg-emerald-500' : fw.probabilityUp >= 50 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-[10px] p-3.5 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-mono text-text-faint uppercase">{fw.label}</span>
        <span className={cn('text-[15px] font-mono font-bold', color)}>{fw.probabilityUp}%</span>
      </div>
      <div className="h-1.5 bg-bg-surface-3 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', barColor)} style={{ width: `${fw.probabilityUp}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-1 text-[10.5px] font-mono">
        <span className="text-emerald-400">↑ avg +{fw.avgGainPct}%</span>
        <span className="text-rose-400 text-right">↓ avg -{fw.avgLossPct}%</span>
      </div>
      <p className="text-[10px] text-text-faint">{fw.matchedWindows} historical matches · R/R {fw.riskReward}x</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function StockSignalAdvisor({ symbol, currentPrice, className = '' }: StockSignalAdvisorProps) {
  const [period, setPeriod]         = useState('5y');
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isRunning, setIsRunning]   = useState(false);
  const [result, setResult]         = useState<(SignalFrequencyResult & { geminiAdvice?: string }) | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState<'signals' | 'frequency' | 'advice'>('signals');

  const cleanSymbol = symbol.toUpperCase().replace('.NS', '').replace('.BO', '');
  const displaySymbol = `${cleanSymbol}.NS`;
  const selectedPeriod = PERIODS.find(p => p.value === period)!;

  const run = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);
    try {
      const res  = await fetch(`/api/ai/signal-analysis?symbol=${encodeURIComponent(cleanSymbol)}&period=${period}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
      setActiveTab('signals');
    } catch (e: any) {
      setError(e.message || 'Failed. Please try again.');
    } finally {
      setIsRunning(false);
    }
  };

  const vs = result ? verdictStyle(result.verdict) : null;
  const VerdictIcon = vs?.icon ?? CheckCircle2;

  return (
    <div className={cn('bg-bg-surface border border-border-default rounded-[14px] overflow-hidden', className)}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border-default">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-text-primary leading-tight">Signal Frequency Advisor</h3>
            <p className="text-[11px] text-text-faint font-mono">{displaySymbol} · 10-Signal Historical Scoring</p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hidden sm:block">
          How Traders Work
        </span>
      </div>

      <div className="p-5 space-y-4">

        {/* ── Controls ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1 space-y-1">
            <p className="text-[11px] text-text-faint uppercase font-mono">Historical Training Period</p>
            <div className="relative">
              <button
                onClick={() => setIsPeriodOpen(v => !v)}
                className="flex items-center gap-2 bg-bg-surface-2 border border-border-default hover:border-indigo-500/40 rounded-[8px] px-3 py-2 text-[13px] text-text-primary transition-all cursor-pointer w-full sm:w-auto"
              >
                <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-medium">{selectedPeriod.label}</span>
                <span className="text-text-faint text-[11px] font-mono">{selectedPeriod.sublabel}</span>
                <ChevronDown className={cn('w-3.5 h-3.5 text-text-faint ml-1 transition-transform', isPeriodOpen && 'rotate-180')} />
              </button>
              {isPeriodOpen && (
                <div className="absolute top-full left-0 mt-1 z-20 bg-bg-surface border border-border-default rounded-[10px] shadow-xl overflow-hidden min-w-[210px]">
                  {PERIODS.map(p => (
                    <button key={p.value}
                      onClick={() => { setPeriod(p.value); setIsPeriodOpen(false); setResult(null); }}
                      className={cn('flex items-center justify-between w-full px-3.5 py-2.5 text-[13px] transition-colors cursor-pointer hover:bg-bg-surface-2',
                        period === p.value ? 'text-indigo-400 font-semibold bg-indigo-500/5' : 'text-text-primary'
                      )}>
                      <span>{p.label}</span>
                      <span className="text-text-faint text-[11px] font-mono">{p.sublabel}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button onClick={run} disabled={isRunning}
            className={cn('flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-[13px] font-semibold transition-all cursor-pointer shadow-sm shrink-0',
              isRunning ? 'bg-indigo-500/20 text-indigo-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/25'
            )}>
            {isRunning
              ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Analysing...</>
              : <><Brain className="w-3.5 h-3.5" />Analyse Stock</>}
          </button>
        </div>

        {/* ── Info banner ── */}
        {!result && !isRunning && !error && (
          <div className="flex items-start gap-2.5 bg-indigo-500/5 border border-indigo-500/15 rounded-[10px] p-3.5">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[12px] text-text-secondary leading-relaxed">
              This is how professional traders work: Score <strong className="text-text-primary">10 independent signals</strong>,
              scan <strong className="text-text-primary">{selectedPeriod.label}</strong> of history, find every time those signals aligned,
              and count what % of the time price went up. That % <em>is</em> the confidence — no guesswork.
            </p>
          </div>
        )}

        {/* ── Loading ── */}
        {isRunning && (
          <div className="flex flex-col items-center py-10 gap-3 border border-border-default rounded-[12px] bg-bg-surface-2/40">
            <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <div className="text-center">
              <p className="text-[13px] text-text-primary font-medium">Scanning {selectedPeriod.label} of Signal History...</p>
              <p className="text-[11.5px] text-text-faint mt-1">
                Scoring 10 signals · Finding historical matches · Computing frequency probabilities
              </p>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="flex items-start gap-2.5 bg-rose-500/8 border border-rose-500/25 rounded-[10px] p-4">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-medium text-rose-400">Analysis Failed</p>
              <p className="text-[12px] text-text-secondary mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {result && vs && (
          <div className="space-y-4">

            {/* ── Hero: Signal Count + Verdict ── */}
            <div className={cn('rounded-[14px] p-5 border space-y-3', vs.bg, vs.border)}>
              {/* Signal score */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <VerdictIcon className={cn('w-5 h-5', vs.text)} />
                  <span className={cn('text-[18px] font-bold', vs.text)}>{result.verdict}</span>
                  <span className={cn('text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border', vs.pill)}>
                    {result.verdictConfidence}% confidence
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[12px] font-mono">
                  <span className="text-emerald-400 font-bold">{result.bullishCount} bullish</span>
                  <span className="text-text-faint">/</span>
                  <span className="text-text-secondary">{result.totalSignals} signals</span>
                  {result.bearishCount > 0 && <span className="text-rose-400">· {result.bearishCount} bearish</span>}
                </div>
              </div>

              {/* Signal bar */}
              <div>
                <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                  {Array.from({ length: result.totalSignals }, (_, i) => {
                    const sig = result.signals[i];
                    return (
                      <div key={i} className={cn('flex-1 rounded-sm',
                        sig?.verdict === 'bullish' ? 'bg-emerald-500' :
                        sig?.verdict === 'bearish' ? 'bg-rose-500' : 'bg-amber-400/40'
                      )} />
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] font-mono text-text-faint mt-1">
                  <span>0</span>
                  <span className="text-text-secondary">Signal Score: {result.bullishCount}/{result.totalSignals}</span>
                  <span>{result.totalSignals}</span>
                </div>
              </div>

              <p className="text-[12px] text-text-secondary leading-relaxed">{result.verdictReason}</p>
            </div>

            {/* ── Tab navigation ── */}
            <div className="flex gap-1 bg-bg-surface-2 rounded-[8px] p-1">
              {[
                { id: 'signals' as const,   label: `Signals (${result.bullishCount}🟢 ${result.bearishCount}🔴)`, icon: Activity },
                { id: 'frequency' as const, label: 'Historical Frequency',  icon: BarChart2 },
                { id: 'advice' as const,    label: 'Trading Advice',        icon: BookOpen  },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={cn('flex-1 flex items-center justify-center gap-1.5 text-[11.5px] py-1.5 rounded-[6px] font-medium transition-all cursor-pointer',
                    activeTab === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
                  )}>
                  <tab.icon className="w-3 h-3" />
                  <span className="hidden sm:block">{tab.label}</span>
                  <span className="sm:hidden">{tab.id === 'signals' ? 'Signals' : tab.id === 'frequency' ? 'Freq.' : 'Advice'}</span>
                </button>
              ))}
            </div>

            {/* ── Tab: 10 Signals ── */}
            {activeTab === 'signals' && (
              <div className="space-y-2">
                {result.signals.map(sig => (
                  <div key={sig.id}
                    className={cn('flex items-start gap-3 p-3 rounded-[8px] border',
                      sig.verdict === 'bullish' ? 'bg-emerald-500/5 border-emerald-500/15' :
                      sig.verdict === 'bearish' ? 'bg-rose-500/5 border-rose-500/15' :
                      'bg-bg-surface-2 border-border-default'
                    )}>
                    <div className="mt-1.5">{signalDot(sig.verdict)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="text-[12.5px] font-medium text-text-primary">{sig.name}</span>
                        <span className={cn('text-[11px] font-mono font-bold',
                          sig.verdict === 'bullish' ? 'text-emerald-400' :
                          sig.verdict === 'bearish' ? 'text-rose-400' : 'text-amber-400'
                        )}>{sig.value}</span>
                      </div>
                      <p className="text-[11.5px] text-text-secondary mt-0.5 leading-snug">{sig.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Tab: Historical Frequency ── */}
            {activeTab === 'frequency' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {result.frequencyWindows.map(fw => <FreqCard key={fw.horizon} fw={fw} />)}
                </div>

                <div className="bg-bg-surface-2 border border-border-default rounded-[10px] p-3.5 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[10.5px] font-mono text-text-faint uppercase">Bullish Signals</p>
                    <p className="text-[18px] font-mono font-bold text-emerald-400">{result.bullishCount}</p>
                  </div>
                  <div>
                    <p className="text-[10.5px] font-mono text-text-faint uppercase">Bearish Signals</p>
                    <p className="text-[18px] font-mono font-bold text-rose-400">{result.bearishCount}</p>
                  </div>
                  <div>
                    <p className="text-[10.5px] font-mono text-text-faint uppercase">Neutral</p>
                    <p className="text-[18px] font-mono font-bold text-amber-400">{result.neutralCount}</p>
                  </div>
                </div>

                <DisclosureCard
                  title="Frequency Engine Methodology & Historical Sampling"
                  subtitle={`Scanned ${result.trainingBars} trading sessions on ${displaySymbol}`}
                  badge="Empirical Backtest"
                  icon={<BookOpen className="w-4 h-4 text-emerald-400" />}
                >
                  <p className="text-[12px] text-text-secondary leading-relaxed mb-2">
                    We scanned <strong className="text-text-primary">{result.trainingBars} trading days</strong> of {displaySymbol} history.
                    Every historical date where at least <strong className="text-text-primary">{result.bullishCount} of 10 signals</strong> aligned simultaneously was isolated into a test sample, and price forward returns were tracked across 7, 30, and 90-day holding windows.
                  </p>
                  <p className="text-[11.5px] text-text-faint">
                    Directional probability indicates statistical tendency under identical market regimes, not a deterministic price guarantee.
                  </p>
                </DisclosureCard>
              </div>
            )}

            {/* ── Tab: Trading Advice ── */}
            {activeTab === 'advice' && (
              <div className="space-y-3">
                {/* Levels grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-rose-500/8 border border-rose-500/20 rounded-[10px] p-3 text-center">
                    <p className="text-[10px] font-mono text-rose-400 uppercase">Stop Loss</p>
                    <p className="text-[14px] font-mono font-bold text-rose-400">{formatINR(result.tradingAdvice.stopLoss)}</p>
                    <p className="text-[10px] text-text-faint">ATR Breach Exit</p>
                  </div>
                  <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-[10px] p-3 text-center">
                    <p className="text-[10px] font-mono text-emerald-400 uppercase">Target 1</p>
                    <p className="text-[14px] font-mono font-bold text-emerald-400">{formatINR(result.tradingAdvice.target1)}</p>
                    <p className="text-[10px] text-text-faint">Book 50% Profits</p>
                  </div>
                  <div className="bg-emerald-500/8 border border-emerald-500/15 rounded-[10px] p-3 text-center">
                    <p className="text-[10px] font-mono text-emerald-400 uppercase">Target 2</p>
                    <p className="text-[14px] font-mono font-bold text-emerald-400">{formatINR(result.tradingAdvice.target2)}</p>
                    <p className="text-[10px] text-text-faint">Trail Stop Extended</p>
                  </div>
                </div>

                {/* Position sizing */}
                <div className="bg-bg-surface-2 border border-border-default rounded-[10px] p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-[10.5px] font-mono text-text-faint uppercase block">Institutional Position Sizing</span>
                      <p className="text-[12.5px] text-text-primary font-medium">{result.tradingAdvice.positionSizing}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    Risk Controlled
                  </span>
                </div>

                {/* Risk & Exit Triggers Dropdown */}
                <DisclosureCard
                  title="Execution Guardrails, Risk & Exit Triggers"
                  subtitle="Key downside risk scenarios and disciplined exit condition"
                  badge="Risk Guard"
                  icon={<ShieldAlert className="w-4 h-4 text-amber-400" />}
                  variant="warning"
                >
                  <div className="space-y-2 pt-1">
                    <div>
                      <span className="text-[11px] font-mono text-amber-400 uppercase font-semibold block mb-0.5">Primary Risk Factor:</span>
                      <p className="text-[12px] text-text-secondary leading-relaxed">{result.tradingAdvice.keyRisk}</p>
                    </div>
                    <div className="pt-2 border-t border-border-subtle">
                      <span className="text-[11px] font-mono text-text-faint uppercase font-semibold block mb-0.5">Discipline Exit Trigger:</span>
                      <p className="text-[12px] text-text-secondary leading-relaxed">{result.tradingAdvice.exitTrigger}</p>
                    </div>
                  </div>
                </DisclosureCard>

                {/* Gemini narrative Dropdown */}
                {result.geminiAdvice && (
                  <DisclosureCard
                    title="SEBI-Compliant Quantitative Commentary"
                    subtitle="Multi-factor synthesised narrative by Gemini 2.5 Flash"
                    badge="AI Synthesis"
                    icon={<Sparkles className="w-4 h-4 text-emerald-400" />}
                    variant="accent"
                  >
                    <p className="text-[12.5px] text-text-secondary leading-relaxed">{result.geminiAdvice}</p>
                  </DisclosureCard>
                )}

                <p className="text-[10px] text-text-faint text-center font-mono pt-1">
                  ⚠️ Institutional quantitative model for educational purposes. Always consult a SEBI Registered Investment Advisor (RIA) before investing.
                </p>
              </div>
            )}

            {/* ── Footer ── */}
            <div className="flex items-center justify-between text-[10.5px] text-text-faint font-mono pt-1 border-t border-border-default">
              <span>{result.trainingBars} bars · {selectedPeriod.label} · 10-signal frequency engine</span>
              <span>{new Date(result.computedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
