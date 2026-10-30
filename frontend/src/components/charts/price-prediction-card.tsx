'use client';

/**
 * PricePredictionCard — Arthova ML Forecasting Widget
 *
 * Features:
 *  • Dynamic training period selector (1y / 2y / 3y / 5y / 10y)
 *  • Per-horizon price targets (7d / 1mo / 3mo) with confidence bands
 *  • Annualised volatility, CAGR, trend direction, model R²
 *  • Stock verdict (Strong Buy → Strong Avoid) with colour coding
 *  • Gemini-powered analyst narrative
 *  • "Train on this stock" CTA — fetches on demand, not on mount
 */

import { useState } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Coins,
  Activity,
  BarChart2,
  Sparkles,
  Info,
} from 'lucide-react';
import { cn, formatINR } from '@/lib/formatters';
import { DisclosureCard } from '@/components/ui/disclosure-card';
import {
  type PredictionResult,
  type TrainingPeriod,
  type PriceForecast,
  calculateDynamicForecast,
} from '@/lib/strategies/price-prediction';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PricePredictionCardProps {
  symbol: string;
  currentPrice?: number;
  className?: string;
}

type Period = { value: TrainingPeriod; label: string; sublabel: string };

const PERIODS: Period[] = [
  { value: '1y',  label: '1 Year',   sublabel: '~252 bars' },
  { value: '2y',  label: '2 Years',  sublabel: '~504 bars' },
  { value: '3y',  label: '3 Years',  sublabel: '~756 bars' },
  { value: '5y',  label: '5 Years',  sublabel: '~1,260 bars' },
  { value: '10y', label: '10 Years', sublabel: '~2,520 bars' },
];

// ---------------------------------------------------------------------------
// Verdict helpers
// ---------------------------------------------------------------------------
type VerdictStyle = { bg: string; border: string; text: string; icon: any; ring: string };

function verdictStyle(verdict: string): VerdictStyle {
  if (verdict === 'Strong Buy')
    return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: CheckCircle2, ring: 'ring-emerald-500/20' };
  if (verdict === 'Buy')
    return { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', icon: TrendingUp, ring: 'ring-green-500/20' };
  if (verdict === 'Hold')
    return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: Minus, ring: 'ring-amber-500/20' };
  if (verdict === 'Avoid')
    return { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', icon: AlertTriangle, ring: 'ring-rose-500/20' };
  // Strong Avoid
  return { bg: 'bg-red-600/10', border: 'border-red-600/30', text: 'text-red-400', icon: ShieldAlert, ring: 'ring-red-600/20' };
}

function trendIcon(direction: string) {
  if (direction === 'Uptrend')   return <TrendingUp  className="w-3.5 h-3.5 text-emerald-400" />;
  if (direction === 'Downtrend') return <TrendingDown className="w-3.5 h-3.5 text-rose-400" />;
  return <Minus className="w-3.5 h-3.5 text-amber-400" />;
}

function changeColor(pct: number) {
  if (pct > 0) return 'text-emerald-400';
  if (pct < 0) return 'text-rose-400';
  return 'text-text-secondary';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PricePredictionCard({ symbol, currentPrice, className = '' }: PricePredictionCardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TrainingPeriod>('5y');
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [result, setResult] = useState<(PredictionResult & { geminiNarrative?: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeHorizon, setActiveHorizon] = useState(0); // index into forecasts
  const [horizonFilter, setHorizonFilter] = useState<'all' | 'short' | 'long' | 'custom'>('all');
  const [customDays, setCustomDays] = useState<number>(180);

  const cleanSymbol = symbol.toUpperCase().replace('.NS', '').replace('.BO', '');
  const displaySymbol = `${cleanSymbol}.NS`;

  // --- Train on demand ---
  const handleTrain = async () => {
    setIsTraining(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        `/api/ai/prediction?symbol=${encodeURIComponent(cleanSymbol)}&period=${selectedPeriod}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Prediction failed');
      setResult(data);
      setActiveHorizon(0);
    } catch (err: any) {
      setError(err.message || 'Failed to run prediction. Please try again.');
    } finally {
      setIsTraining(false);
    }
  };

  const selectedPeriodObj = PERIODS.find((p) => p.value === selectedPeriod)!;
  const vs = result ? verdictStyle(result.verdict) : null;
  const VerdictIcon = vs?.icon ?? CheckCircle2;

  const filteredForecasts = result
    ? result.forecasts.filter((f) => {
        if (horizonFilter === 'short') return f.horizon.days <= 90;
        if (horizonFilter === 'long') return f.horizon.days > 90;
        return true;
      })
    : [];

  const dynamicForecast = result && horizonFilter === 'custom'
    ? calculateDynamicForecast(result, customDays)
    : null;

  const activeForecast = horizonFilter === 'custom'
    ? dynamicForecast
    : (filteredForecasts[activeHorizon] ?? filteredForecasts[0] ?? result?.forecasts[0]);

  return (
    <div className={cn('bg-bg-surface border border-border-default rounded-[14px] overflow-hidden', className)}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border-default">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-text-primary leading-tight">ML Price Forecast</h3>
            <p className="text-[11px] text-text-faint font-mono">{displaySymbol}</p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
          Regression Engine
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* ── Training period selector + CTA ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1 space-y-1">
            <p className="text-[11px] text-text-faint uppercase font-mono tracking-wide">Training Data Period</p>
            <div className="relative">
              <button
                onClick={() => setIsPeriodOpen((v) => !v)}
                className="flex items-center gap-2 bg-bg-surface-2 border border-border-default hover:border-violet-500/40 rounded-[8px] px-3 py-2 text-[13px] text-text-primary transition-all cursor-pointer w-full sm:w-auto"
              >
                <BarChart2 className="w-3.5 h-3.5 text-violet-400" />
                <span className="font-medium">{selectedPeriodObj.label}</span>
                <span className="text-text-faint text-[11px] font-mono">{selectedPeriodObj.sublabel}</span>
                <ChevronDown className={cn('w-3.5 h-3.5 text-text-faint ml-1 transition-transform', isPeriodOpen && 'rotate-180')} />
              </button>

              {isPeriodOpen && (
                <div className="absolute top-full left-0 mt-1 z-20 bg-bg-surface border border-border-default rounded-[10px] shadow-xl overflow-hidden min-w-[200px]">
                  {PERIODS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => { setSelectedPeriod(p.value); setIsPeriodOpen(false); setResult(null); }}
                      className={cn(
                        'flex items-center justify-between w-full px-3.5 py-2.5 text-[13px] transition-colors cursor-pointer hover:bg-bg-surface-2',
                        selectedPeriod === p.value ? 'text-violet-400 font-semibold bg-violet-500/5' : 'text-text-primary'
                      )}
                    >
                      <span>{p.label}</span>
                      <span className="text-text-faint text-[11px] font-mono">{p.sublabel}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleTrain}
            disabled={isTraining}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-[13px] font-semibold transition-all cursor-pointer shadow-sm shrink-0',
              isTraining
                ? 'bg-violet-500/20 text-violet-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-500/25'
            )}
          >
            {isTraining
              ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Training...</>
              : <><Brain className="w-3.5 h-3.5" />Train &amp; Predict</>
            }
          </button>
        </div>

        {/* ── Training info banner ── */}
        {!result && !isTraining && !error && (
          <div className="flex items-start gap-2.5 bg-violet-500/5 border border-violet-500/15 rounded-[10px] p-3.5">
            <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <p className="text-[12px] text-text-secondary leading-relaxed">
              Select a training period and click <strong className="text-text-primary">Train &amp; Predict</strong>.
              The engine will fetch <strong className="text-text-primary">{selectedPeriodObj.sublabel}</strong> of daily OHLCV data for{' '}
              <strong className="text-text-primary">{displaySymbol}</strong>, train a weighted regression model,
              and output 7-day, 1-month, and 3-month price targets with confidence bands.
            </p>
          </div>
        )}

        {/* ── Loading state ── */}
        {isTraining && (
          <div className="flex flex-col items-center py-10 gap-3 border border-border-default rounded-[12px] bg-bg-surface-2/40">
            <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            <div className="text-center">
              <p className="text-[13px] text-text-primary font-medium">Training Ensemble ML Model...</p>
              <p className="text-[11.5px] text-text-faint mt-1">
                Fetching {selectedPeriodObj.label} of OHLCV · Multi-Feature Regression + Holt-Winters ETS · Backtesting on last 90 days
              </p>
            </div>
          </div>
        )}

        {/* ── Error state ── */}
        {error && (
          <div className="flex items-start gap-2.5 bg-rose-500/8 border border-rose-500/25 rounded-[10px] p-4">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-medium text-rose-400">Prediction Failed</p>
              <p className="text-[12px] text-text-secondary mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {result && vs && activeForecast && (
          <div className="space-y-4">
            {/* Verdict banner */}
            <div className={cn('flex items-start gap-3 rounded-[12px] p-4 border', vs.bg, vs.border)}>
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', vs.bg, 'border', vs.border)}>
                <VerdictIcon className={cn('w-5 h-5', vs.text)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('text-[15px] font-bold', vs.text)}>{result.verdict}</span>
                  <span className="text-[11px] text-text-faint font-mono">·</span>
                  <span className="flex items-center gap-1 text-[12px] text-text-secondary font-mono">
                    {trendIcon(result.trendDirection)} {result.trendDirection}
                  </span>
                </div>
                <p className="text-[12px] text-text-secondary leading-relaxed mt-1">{result.verdictReason}</p>
              </div>
            </div>

            {/* Horizon Category Filters & Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-text-faint uppercase font-mono tracking-wide">
                  Forecast Horizon
                </span>
                <div className="flex items-center gap-1 bg-bg-surface-2 p-0.5 rounded-[8px] border border-border-default">
                  {(
                    [
                      { key: 'all', label: 'All' },
                      { key: 'short', label: 'Short-Term (7D-3M)' },
                      { key: 'long', label: 'Long-Term (6M-10Y)' },
                      { key: 'custom', label: 'Custom (Dynamic)' },
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => {
                        setHorizonFilter(cat.key);
                        setActiveHorizon(0);
                      }}
                      className={cn(
                        'px-2.5 py-1 text-[11px] rounded-[6px] font-medium transition-all cursor-pointer',
                        horizonFilter === cat.key
                          ? 'bg-violet-600 text-white shadow-xs'
                          : 'text-text-faint hover:text-text-primary'
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset Horizon Buttons */}
              {horizonFilter !== 'custom' && (
                <div className="flex flex-wrap gap-1 bg-bg-surface-2 rounded-[8px] p-1">
                  {filteredForecasts.map((f, i) => (
                    <button
                      key={f.horizon.days}
                      onClick={() => setActiveHorizon(i)}
                      className={cn(
                        'flex-1 min-w-[70px] text-[12px] py-1.5 px-2 rounded-[6px] font-medium transition-all cursor-pointer text-center',
                        activeHorizon === i
                          ? 'bg-violet-600 text-white shadow-sm font-semibold'
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface'
                      )}
                    >
                      {f.horizon.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Dynamic Custom Horizon Slider & Quick Jump Buttons */}
              {horizonFilter === 'custom' && (
                <div className="bg-bg-surface-2 border border-violet-500/20 rounded-[10px] p-3 space-y-2.5">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-text-faint font-mono uppercase text-[11px]">Dynamic Forecast Slider</span>
                    <span className="font-mono font-semibold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                      {customDays < 30 ? `${customDays} Days` : customDays < 365 ? `${Math.round(customDays / 30)} Months (${customDays}d)` : customDays === 3650 ? '10 Years (3,650d)' : `${(customDays / 365).toFixed(1)} Years (${customDays}d)`}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={7}
                    max={3650}
                    step={customDays > 365 ? 30 : customDays > 90 ? 15 : 1}
                    value={customDays}
                    onChange={(e) => setCustomDays(Number(e.target.value))}
                    className="w-full accent-violet-500 cursor-pointer"
                  />

                  {/* Preset Quick Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {[
                      { d: 15, l: '15D' },
                      { d: 45, l: '45D' },
                      { d: 180, l: '6M' },
                      { d: 365, l: '1Y' },
                      { d: 730, l: '2Y' },
                      { d: 1095, l: '3Y' },
                      { d: 1825, l: '5Y' },
                      { d: 3650, l: '10Y' },
                    ].map(({ d, l }) => (
                      <button
                        key={d}
                        onClick={() => setCustomDays(d)}
                        className={cn(
                          'text-[10.5px] font-mono px-2 py-0.5 rounded-[5px] border transition-all cursor-pointer',
                          customDays === d
                            ? 'bg-violet-600 text-white border-violet-500'
                            : 'bg-bg-surface text-text-faint border-border-default hover:text-text-primary hover:border-violet-500/40'
                        )}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Target price block */}
              <div className="bg-bg-surface-2/60 rounded-[10px] p-4 space-y-3 border border-border-default">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-[11px] text-text-faint uppercase font-mono">Target Price</p>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-bg-surface-3 text-text-secondary border border-border-default">
                        {activeForecast.horizon.days <= 90 ? '⚡ Tactical Momentum' : '📈 Compounding Horizon'}
                      </span>
                    </div>
                    <p className="text-[26px] font-semibold text-text-primary font-mono tracking-tight">
                      {formatINR(activeForecast.targetPrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-text-faint uppercase font-mono">Expected Change</p>
                    <p className={cn('text-[20px] font-mono font-semibold mt-0.5', changeColor(activeForecast.changePercent))}>
                      {activeForecast.changePercent >= 0 ? '+' : ''}{activeForecast.changePercent.toFixed(2)}%
                    </p>
                    {activeForecast.annualisedReturn !== undefined && (
                      <p className="text-[11px] font-mono text-emerald-400 mt-0.5">
                        {activeForecast.annualisedReturn >= 0 ? '+' : ''}{activeForecast.annualisedReturn.toFixed(1)}% p.a. CAGR
                      </p>
                    )}
                  </div>
                </div>

                {/* Confidence bands */}
                <div className="space-y-1.5 pt-1 border-t border-border-default">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-text-faint uppercase font-mono">Volatility Diffusion Confidence Bands</p>
                    <span className="text-[10px] text-text-faint font-mono">σ(h) = σ_daily × √h</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-[6px] px-3 py-2">
                      <span className="text-[10px] text-emerald-400 font-mono block">+1σ Upper Band</span>
                      <span className="text-[13px] font-mono text-text-primary">{formatINR(activeForecast.upperBand)}</span>
                    </div>
                    <div className="bg-rose-500/5 border border-rose-500/15 rounded-[6px] px-3 py-2">
                      <span className="text-[10px] text-rose-400 font-mono block">-1σ Lower Band</span>
                      <span className="text-[13px] font-mono text-text-primary">{formatINR(activeForecast.lowerBand)}</span>
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-[6px] px-3 py-2">
                      <span className="text-[10px] text-emerald-400 font-mono block">+2σ Bull Case</span>
                      <span className="text-[13px] font-mono text-text-primary">{formatINR(activeForecast.upperBand2)}</span>
                    </div>
                    <div className="bg-rose-500/5 border border-rose-500/15 rounded-[6px] px-3 py-2">
                      <span className="text-[10px] text-rose-400 font-mono block">-2σ Bear Case</span>
                      <span className="text-[13px] font-mono text-text-primary">{formatINR(activeForecast.lowerBand2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Backtest accuracy + probability bar */}
            {result.backtest.windowsTested > 0 && (
              <div className="bg-bg-surface-2 border border-border-default rounded-[10px] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-text-faint uppercase font-mono tracking-wide">Real Backtest Accuracy</p>
                  <span className="text-[10.5px] font-mono text-text-faint">{result.backtest.windowsTested} windows tested</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-bg-surface-3 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', result.backtest.directionalAccuracy >= 60 ? 'bg-emerald-500' : result.backtest.directionalAccuracy >= 50 ? 'bg-amber-500' : 'bg-rose-500')}
                      style={{ width: `${result.backtest.directionalAccuracy}%` }}
                    />
                  </div>
                  <span className={cn('text-[15px] font-mono font-bold shrink-0', result.backtest.directionalAccuracy >= 60 ? 'text-emerald-400' : result.backtest.directionalAccuracy >= 50 ? 'text-amber-400' : 'text-rose-400')}>
                    {result.backtest.directionalAccuracy}%
                  </span>
                </div>
                <p className="text-[11.5px] text-text-secondary">
                  Model correctly predicted price <strong className="text-text-primary">direction</strong> in {result.backtest.directionalAccuracy}% of 30-day windows.
                  Avg error: <span className="font-mono text-text-primary">{result.backtest.meanAbsoluteErrorPct}%</span> of price.
                  {result.backtest.modelVsBuyHold > 0
                    ? <span className="text-emerald-400"> Model outperforms buy-and-hold by {result.backtest.modelVsBuyHold}%.</span>
                    : <span className="text-amber-400"> Buy-and-hold outperforms by {Math.abs(result.backtest.modelVsBuyHold)}% — consider for trend stocks only.</span>
                  }
                </p>
              </div>
            )}

            {/* Probability of going up */}
            <div className="bg-bg-surface-2 border border-border-default rounded-[10px] p-3.5 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-[11px] text-text-faint font-mono uppercase mb-1">Probability Price Is Higher in {activeForecast.horizon.label}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-bg-surface-3 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500" style={{ width: '100%' }} />
                  </div>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-text-faint mt-0.5">
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
              </div>
              <div className="text-center shrink-0">
                <p className={cn('text-[22px] font-mono font-bold', activeForecast.probabilityUp >= 60 ? 'text-emerald-400' : activeForecast.probabilityUp >= 50 ? 'text-amber-400' : 'text-rose-400')}>
                  {activeForecast.probabilityUp}%
                </p>
                <p className="text-[10px] text-text-faint font-mono">prob. up</p>
              </div>
            </div>

            {/* Model stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'CAGR', value: `${result.cagr >= 0 ? '+' : ''}${result.cagr}%`, color: result.cagr >= 0 ? 'text-emerald-400' : 'text-rose-400' },
                { label: 'Ann. Volatility', value: `${result.annualisedVolatility}%`, color: result.annualisedVolatility > 40 ? 'text-amber-400' : 'text-text-primary' },
                { label: 'Ensemble R²', value: result.modelScore.toFixed(2), color: result.modelScore > 0.55 ? 'text-emerald-400' : 'text-amber-400' },
                { label: 'Training Bars', value: result.trainingBars.toLocaleString('en-IN'), color: 'text-text-primary' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-bg-surface-2 rounded-[8px] p-2.5 border border-border-default">
                  <span className="text-[10.5px] text-text-faint font-mono uppercase block">{label}</span>
                  <span className={cn('text-[14px] font-mono font-semibold', color)}>{value}</span>
                </div>
              ))}
            </div>

            {/* ── 10-Year Vision & Compounding Moat Showcase ── */}
            {result.longTermVision && (
              <div className="bg-gradient-to-b from-indigo-950/25 via-bg-surface-2 to-bg-surface-2 border border-indigo-500/30 rounded-[12px] p-4 space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-indigo-500/20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-[13px] font-semibold text-text-primary">10-Year Compounding Vision</h4>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          Fundamental Moat
                        </span>
                      </div>
                      <p className="text-[11px] text-text-faint">
                        Why this stock stands out from ordinary &amp; cyclical equities
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={cn('text-[11px] font-mono px-2.5 py-1 rounded-[6px] border font-semibold', result.longTermVision.tierColor)}>
                      {result.longTermVision.longTermTier}
                    </span>
                    <div className="bg-bg-surface px-2.5 py-1 rounded-[6px] border border-border-default text-right">
                      <span className="text-[10px] text-text-faint block uppercase font-mono">Moat Score</span>
                      <span className="text-[12px] font-mono font-bold text-text-primary">
                        {result.longTermVision.moatScore}<span className="text-text-faint text-[10px]">/100</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 10-Year Wealth Multiplier Simulation */}
                <div className="bg-bg-surface/80 rounded-[10px] p-3.5 border border-border-default space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase text-text-faint tracking-wider flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      10-Year Wealth Multiplier Simulation
                    </span>
                    <span className="text-[10.5px] font-mono text-emerald-400 font-semibold">
                      +{result.longTermVision.expected10YCAGR}% p.a. Projected CAGR
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center">
                    <div className="bg-bg-surface-2 p-2.5 rounded-[8px] border border-border-default">
                      <span className="text-[10px] text-text-faint font-mono block">Initial Investment</span>
                      <span className="text-[15px] font-mono font-bold text-text-primary">₹1,00,000</span>
                      <span className="text-[10px] text-text-faint block mt-0.5">Base capital</span>
                    </div>
                    <div className="bg-gradient-to-b from-emerald-500/10 to-bg-surface-2 p-2.5 rounded-[8px] border border-emerald-500/30">
                      <span className="text-[10px] text-emerald-400 font-mono block font-semibold">10Y Projected Value</span>
                      <span className="text-[16px] font-mono font-bold text-emerald-400">
                        {formatINR(result.longTermVision.wealth10YSimulation.projectedFinalCorpus)}
                      </span>
                      <span className="text-[10.5px] font-mono text-emerald-400/90 block font-bold mt-0.5">
                        {result.longTermVision.wealth10YSimulation.multiplier}× Multiplier
                      </span>
                    </div>
                    <div className="bg-bg-surface-2 p-2.5 rounded-[8px] border border-border-default">
                      <span className="text-[10px] text-text-faint font-mono block">vs 7% Bank FD Benchmark</span>
                      <span className="text-[14px] font-mono font-medium text-text-secondary">
                        {formatINR(result.longTermVision.wealth10YSimulation.fixedDepositCorpus)}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono block mt-0.5">
                        Alpha: +{formatINR(result.longTermVision.wealth10YSimulation.wealthAlphaVsFD)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4 Fundamental Moat Pillars */}
                <div className="space-y-1.5">
                  <span className="text-[10.5px] text-text-faint font-mono uppercase tracking-wider block">
                    Fundamental Durability Pillars (Moat Verification)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.longTermVision.pillars.map((pillar) => (
                      <div key={pillar.title} className="bg-bg-surface/80 rounded-[8px] p-3 border border-border-default space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11.5px] font-semibold text-text-primary">{pillar.title}</span>
                          <span className={cn(
                            'text-[9.5px] font-mono uppercase px-1.5 py-0.5 rounded-full border',
                            pillar.rating === 'Exceptional' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' :
                            pillar.rating === 'Strong' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25' :
                            pillar.rating === 'Watchlist Risk' ? 'bg-rose-500/10 text-rose-400 border-rose-500/25' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/25'
                          )}>
                            {pillar.rating}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-text-secondary">{pillar.metric}</p>
                        <p className="text-[11px] text-text-faint leading-relaxed">{pillar.assessment}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Why Different Narrative */}
                <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-[8px] p-3">
                  <p className="text-[11.5px] text-text-secondary leading-relaxed">
                    <strong className="text-text-primary">Why This Stock is Different: </strong>
                    {result.longTermVision.whyDifferentThanOthers}
                  </p>
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-indigo-500/15 text-[10.5px] font-mono text-text-faint">
                    <span>Sector: {result.longTermVision.sector} ({result.longTermVision.marketCapCategory})</span>
                    <span className="text-indigo-400 font-medium">Horizon: {result.longTermVision.recommendedHoldingHorizon}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Iterative Gradient Descent Epoch Convergence Dropdown */}
            {result.epochTraining && result.epochTraining.totalEpochs > 0 && (
              <DisclosureCard
                title="Iterative 100-Epoch Training & Loss Convergence"
                subtitle={`Adam Optimizer (α=${result.epochTraining.learningRate}) with L2 Regularization`}
                badge={`-${result.epochTraining.lossReductionPct}% Loss`}
                icon={<Brain className="w-4 h-4 text-violet-400" />}
                variant="subtle"
              >
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-bg-surface p-2 rounded-[6px] border border-border-default">
                      <span className="text-[10px] text-text-faint font-mono block">Initial Loss (Epoch 1)</span>
                      <span className="text-[13px] font-mono text-rose-400 font-bold">{result.epochTraining.initialLoss}</span>
                    </div>
                    <div className="bg-bg-surface p-2 rounded-[6px] border border-border-default">
                      <span className="text-[10px] text-text-faint font-mono block">Final Loss (Epoch {result.epochTraining.totalEpochs})</span>
                      <span className="text-[13px] font-mono text-emerald-400 font-bold">{result.epochTraining.finalLoss}</span>
                    </div>
                    <div className="bg-bg-surface p-2 rounded-[6px] border border-border-default">
                      <span className="text-[10px] text-text-faint font-mono block">Optimization Gain</span>
                      <span className="text-[13px] font-mono text-violet-400 font-bold">-{result.epochTraining.lossReductionPct}%</span>
                    </div>
                  </div>

                  {/* Visual Loss Convergence Bar Sparkline */}
                  {result.epochTraining.lossHistory.length > 1 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[10px] font-mono text-text-faint">
                        <span>Epoch 1 (Loss: {result.epochTraining.initialLoss})</span>
                        <span>Epoch {result.epochTraining.totalEpochs} (Loss: {result.epochTraining.finalLoss})</span>
                      </div>
                      <div className="flex items-end gap-1 h-12 bg-bg-surface p-1.5 rounded-[6px] border border-border-default">
                        {result.epochTraining.lossHistory.map((pt, idx) => {
                          const maxLoss = result.epochTraining.initialLoss || 1;
                          const minLoss = result.epochTraining.finalLoss || 0;
                          const normHeight = Math.max(12, Math.round(((pt.loss - minLoss) / (maxLoss - minLoss || 1)) * 100));
                          return (
                            <div
                              key={idx}
                              className="flex-1 bg-gradient-to-t from-violet-600/40 to-violet-500 rounded-t-sm hover:opacity-80 transition-all relative"
                              style={{ height: `${normHeight}%` }}
                              title={`Epoch ${pt.epoch}: Loss ${pt.loss}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-text-faint leading-relaxed">
                    Trained iteratively across {result.epochTraining.totalEpochs} epochs using backpropagation &amp; Adam gradient updates rather than static single-step formulas.
                  </p>
                </div>
              </DisclosureCard>
            )}

            {/* Model ensemble breakdown Dropdown */}
            <DisclosureCard
              title="Ensemble Architecture Weights"
              subtitle="Multi-Feature Regression (RSI, MACD, Volume) + Holt-Winters ETS"
              badge="Ensemble"
              icon={<BarChart2 className="w-4 h-4 text-emerald-400" />}
              variant="default"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-bg-surface-2 p-3 rounded-[8px] border border-border-default space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-text-secondary">Multi-Feature Regressor</span>
                    <span className="text-violet-400 font-bold">{(result.modelBreakdown.multiFeatureWeight * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1 bg-bg-surface-3 rounded-full">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${result.modelBreakdown.multiFeatureWeight * 100}%` }} />
                  </div>
                  <p className="text-[10.5px] text-text-faint font-mono">RSI · MACD · Bollinger · Volume Surge → {formatINR(result.modelBreakdown.multiFeatureTarget30d)}</p>
                </div>
                <div className="bg-bg-surface-2 p-3 rounded-[8px] border border-border-default space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-text-secondary">Holt-Winters Seasonal ETS</span>
                    <span className="text-emerald-400 font-bold">{(result.modelBreakdown.holtwIntersWeight * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1 bg-bg-surface-3 rounded-full">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${result.modelBreakdown.holtwIntersWeight * 100}%` }} />
                  </div>
                  <p className="text-[10.5px] text-text-faint font-mono">Trend · Seasonality Filter → {formatINR(result.modelBreakdown.holtwIntersTarget30d)}</p>
                </div>
              </div>
            </DisclosureCard>

            {/* Gemini narrative Dropdown */}
            {result.geminiNarrative && (
              <DisclosureCard
                title="SEBI-Compliant Analyst Commentary"
                subtitle="Synthesised by Gemini 2.5 Flash on historical regime patterns"
                badge="AI Analyst"
                icon={<Sparkles className="w-4 h-4 text-emerald-400" />}
                variant="accent"
              >
                <p className="text-[12.5px] text-text-secondary leading-relaxed pt-1">
                  {result.geminiNarrative}
                </p>
              </DisclosureCard>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-[10.5px] text-text-faint font-mono pt-1 border-t border-border-default">
              <span>Ensemble: MF-Regression + Holt-Winters · {result.trainingBars} bars · {selectedPeriodObj.label}</span>
              <span>{new Date(result.computedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
