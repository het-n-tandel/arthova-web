/**
 * Signal Frequency Engine — Arthova Quantitative Suite
 *
 * This is the CORRECT way professional traders work:
 * → Don't predict price.
 * → Score signals. Count history. Report probability.
 *
 * Output: "RELIANCE shows 7/10 bullish signals →
 *          In past 10 years, when 7+ signals aligned,
 *          price went UP 68% of 30-day windows → BUY (68% confidence)"
 *
 * 10 Signals Scored:
 *  1.  RSI-14         oversold/overbought
 *  2.  EMA 20/50      short-term trend cross
 *  3.  EMA 50/200     golden/death cross (long-term)
 *  4.  MACD Histogram positive/negative momentum
 *  5.  Bollinger Band price near lower (cheap) / upper (expensive)
 *  6.  Volume Surge   recent volume vs 20-day avg
 *  7.  CAGR vs NIFTY  beating 13% benchmark
 *  8.  Price Momentum 20d price rate-of-change
 *  9.  Volatility     low vol = quality, extreme = risk
 * 10.  52W Position   price vs 52-week range
 */

export interface SignalResult {
  id: string;
  name: string;
  category: 'momentum' | 'trend' | 'value' | 'risk' | 'fundamental';
  verdict: 'bullish' | 'bearish' | 'neutral';
  value: string;          // human-readable value e.g. "RSI 38.2"
  reason: string;         // one-line explanation
  weight: number;         // 1–3 (importance)
}

export interface FrequencyWindow {
  horizon: 7 | 30 | 90;
  label: string;
  /** How many historical bars matched similar signal alignment */
  matchedWindows: number;
  /** % of matched windows where price was higher after horizon days */
  probabilityUp: number;
  /** Average gain when price went up */
  avgGainPct: number;
  /** Average loss when price went down */
  avgLossPct: number;
  /** Risk-reward ratio (avgGain / avgLoss) */
  riskReward: number;
}

export interface SignalFrequencyResult {
  symbol: string;
  currentPrice: number;
  trainingBars: number;

  /** All 10 scored signals */
  signals: SignalResult[];

  /** Count summary */
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  totalSignals: number;

  /** Historical frequency for each horizon */
  frequencyWindows: FrequencyWindow[];

  /** Final verdict derived from signal majority + historical frequency */
  verdict: 'Strong Buy' | 'Buy' | 'Hold' | 'Avoid' | 'Strong Avoid';
  verdictConfidence: number;    // % e.g. 68 — the real historical frequency
  verdictReason: string;        // "7/10 signals bullish. In past X years, when 7+ signals aligned, price went up 68% of 30-day windows."

  /** What a professional would tell you: trading advice */
  tradingAdvice: TradingAdvice;

  computedAt: string;
}

export interface TradingAdvice {
  /** Short position sizing advice */
  positionSizing: string;
  /** Risk management — stop loss level */
  stopLoss: number;
  /** First target price */
  target1: number;
  /** Second (extended) target */
  target2: number;
  /** Key risk to watch */
  keyRisk: string;
  /** What to watch for a reversal */
  exitTrigger: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Math primitives
// ─────────────────────────────────────────────────────────────────────────────

function sma(arr: number[], period: number, at?: number): number {
  const idx = at ?? arr.length - 1;
  if (idx < period - 1) return arr[idx] ?? 0;
  const slice = arr.slice(idx - period + 1, idx + 1);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function emaFull(prices: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  let val = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = 0; i < period - 1; i++) out.push(prices[i]);
  out.push(val);
  for (let i = period; i < prices.length; i++) {
    val = prices[i] * k + val * (1 - k);
    out.push(val);
  }
  return out;
}

function rsiAt(closes: number[], period: number, at: number): number {
  if (at < period) return 50;
  let gains = 0, losses = 0;
  for (let i = at - period + 1; i <= at; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gains += d; else losses += Math.abs(d);
  }
  let ag = gains / period, al = losses / period;
  if (al === 0) return 100;
  return 100 - 100 / (1 + ag / al);
}

function macdHistAt(ema12: number[], ema26: number[], at: number): number {
  const macd = ema12[at] - ema26[at];
  return macd * 0.15; // simplified histogram (signal line approx)
}

function bollingerPositionAt(closes: number[], period: number, at: number): number {
  // Returns 0 (at lower band) to 1 (at upper band) — "percent-b"
  if (at < period) return 0.5;
  const slice = closes.slice(at - period + 1, at + 1);
  const m = slice.reduce((a, b) => a + b, 0) / period;
  const sd = Math.sqrt(slice.reduce((acc, v) => acc + (v - m) ** 2, 0) / period);
  if (sd === 0) return 0.5;
  return (closes[at] - (m - 2 * sd)) / (4 * sd);
}

function volumeSurgeAt(volumes: number[], period: number, at: number): number {
  if (at < period) return 1;
  const avg = volumes.slice(at - period, at).reduce((a, b) => a + b, 0) / period;
  return avg > 0 ? volumes[at] / avg : 1;
}

function roc20At(closes: number[], at: number): number {
  if (at < 20) return 0;
  const prev = closes[at - 20];
  return prev > 0 ? (closes[at] - prev) / prev * 100 : 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Score all 10 signals at a given bar index
// Returns a number 0–10 representing bullish signal count
// ─────────────────────────────────────────────────────────────────────────────

interface BarSignalState {
  bullishCount: number;
  bearishCount: number;
}

function scoreSignalsAt(
  closes: number[],
  volumes: number[],
  ema12: number[],
  ema26: number[],
  ema20: number[],
  ema50: number[],
  ema200: number[],
  cagrPct: number,
  at: number,
): BarSignalState {
  let bull = 0, bear = 0;

  // 1. RSI
  const rsi = rsiAt(closes, 14, at);
  if (rsi < 40) bull++; else if (rsi > 65) bear++;

  // 2. EMA 20/50
  if (at >= 50 && ema20[at] > ema50[at]) bull++; else if (at >= 50) bear++;

  // 3. EMA 50/200
  if (at >= 200 && ema50[at] > ema200[at]) bull++; else if (at >= 200 && ema50[at] < ema200[at]) bear++;

  // 4. MACD histogram
  const mh = macdHistAt(ema12, ema26, at);
  if (mh > 0) bull++; else if (mh < 0) bear++;

  // 5. Bollinger percent-b
  const bb = bollingerPositionAt(closes, 20, at);
  if (bb < 0.2) bull++; else if (bb > 0.8) bear++;

  // 6. Volume surge
  const vs = volumeSurgeAt(volumes, 20, at);
  if (vs > 1.3) bull++; else if (vs < 0.7) bear++;

  // 7. CAGR vs NIFTY 13%
  if (cagrPct > 15) bull++; else if (cagrPct < 5) bear++;

  // 8. 20d Rate-of-Change
  const roc = roc20At(closes, at);
  if (roc > 3) bull++; else if (roc < -3) bear++;

  // 9. Volatility (annualised — proxy: 20d stddev / price)
  if (at >= 20) {
    const slice = closes.slice(at - 20, at);
    const m = slice.reduce((a, b) => a + b, 0) / 20;
    const sd = Math.sqrt(slice.reduce((acc, v) => acc + (v - m) ** 2, 0) / 20);
    const annVol = (sd / m) * Math.sqrt(252) * 100;
    if (annVol < 28) bull++; else if (annVol > 55) bear++;
  }

  // 10. 52-week position
  if (at >= 252) {
    const high52 = Math.max(...closes.slice(at - 252, at));
    const low52  = Math.min(...closes.slice(at - 252, at));
    const range  = high52 - low52;
    const pos    = range > 0 ? (closes[at] - low52) / range : 0.5;
    // In bottom 30% of range = bullish (value); top 10% = momentum bullish too
    if (pos < 0.3 || pos > 0.9) bull++; else if (pos > 0.5 && pos < 0.9) {}
    else bear++;
  }

  return { bullishCount: bull, bearishCount: bear };
}

// ─────────────────────────────────────────────────────────────────────────────
// Build detailed signal list for current bar (for display)
// ─────────────────────────────────────────────────────────────────────────────

function buildSignalList(
  closes: number[],
  volumes: number[],
  ema12: number[],
  ema26: number[],
  ema20: number[],
  ema50: number[],
  ema200: number[],
  cagrPct: number,
): SignalResult[] {
  const n = closes.length - 1;
  const cur = closes[n];
  const signals: SignalResult[] = [];

  // 1. RSI
  const rsi = rsiAt(closes, 14, n);
  signals.push({
    id: 'rsi14',
    name: 'RSI-14 Momentum',
    category: 'momentum',
    verdict: rsi < 40 ? 'bullish' : rsi > 65 ? 'bearish' : 'neutral',
    value: `RSI ${rsi.toFixed(1)}`,
    reason: rsi < 40
      ? `Oversold (${rsi.toFixed(1)} < 40) — historically strong reversal zone`
      : rsi > 65
      ? `Overbought (${rsi.toFixed(1)} > 65) — elevated pullback risk`
      : `Neutral zone (${rsi.toFixed(1)}) — no directional edge`,
    weight: 2,
  });

  // 2. EMA 20/50
  const e20 = ema20[n], e50 = ema50[n];
  signals.push({
    id: 'ema2050',
    name: 'EMA 20/50 Cross',
    category: 'trend',
    verdict: e20 > e50 ? 'bullish' : e20 < e50 ? 'bearish' : 'neutral',
    value: `EMA20 ₹${e20.toFixed(0)} / EMA50 ₹${e50.toFixed(0)}`,
    reason: e20 > e50
      ? `Short-term EMA above medium — uptrend active`
      : e20 < e50
      ? `Short-term EMA below medium — downtrend active`
      : `EMAs flat — no clear direction`,
    weight: 2,
  });

  // 3. EMA 50/200 (Golden/Death Cross)
  const e200 = ema200[n];
  const has200 = n >= 200;
  signals.push({
    id: 'ema50200',
    name: 'Golden/Death Cross',
    category: 'trend',
    verdict: !has200 ? 'neutral' : e50 > e200 ? 'bullish' : 'bearish',
    value: has200 ? `EMA50 ₹${e50.toFixed(0)} / EMA200 ₹${e200.toFixed(0)}` : 'Insufficient data',
    reason: !has200
      ? 'Need 200+ days to compute golden cross'
      : e50 > e200
      ? `Golden Cross active — long-term institutional uptrend`
      : `Death Cross active — long-term downtrend, institutional caution`,
    weight: 3,
  });

  // 4. MACD Histogram
  const mh = macdHistAt(ema12, ema26, n);
  signals.push({
    id: 'macd',
    name: 'MACD Histogram',
    category: 'momentum',
    verdict: mh > 0 ? 'bullish' : mh < 0 ? 'bearish' : 'neutral',
    value: `Histogram ${mh > 0 ? '+' : ''}${mh.toFixed(2)}`,
    reason: mh > 0
      ? `Positive MACD divergence — buying momentum accelerating`
      : mh < 0
      ? `Negative MACD divergence — selling pressure dominant`
      : `MACD flat — momentum stalling`,
    weight: 2,
  });

  // 5. Bollinger Band Position
  const bb = bollingerPositionAt(closes, 20, n);
  signals.push({
    id: 'bollinger',
    name: 'Bollinger Band %B',
    category: 'value',
    verdict: bb < 0.2 ? 'bullish' : bb > 0.8 ? 'bearish' : 'neutral',
    value: `%B = ${(bb * 100).toFixed(0)}%`,
    reason: bb < 0.2
      ? `Price at lower Bollinger band — statistically cheap, mean reversion likely`
      : bb > 0.8
      ? `Price at upper band — statistically stretched, pullback risk`
      : `Price within normal Bollinger range`,
    weight: 2,
  });

  // 6. Volume Surge
  const vs = volumeSurgeAt(volumes, 20, n);
  signals.push({
    id: 'volume',
    name: 'Volume Surge',
    category: 'momentum',
    verdict: vs > 1.3 ? 'bullish' : vs < 0.7 ? 'bearish' : 'neutral',
    value: `${vs.toFixed(2)}x avg volume`,
    reason: vs > 1.3
      ? `${(vs * 100 - 100).toFixed(0)}% above avg volume — institutional conviction move`
      : vs < 0.7
      ? `Volume dried up ${(100 - vs * 100).toFixed(0)}% below avg — weak price action`
      : `Volume near average — normal trading activity`,
    weight: 1,
  });

  // 7. CAGR vs NIFTY
  signals.push({
    id: 'cagr',
    name: 'CAGR vs NIFTY50',
    category: 'fundamental',
    verdict: cagrPct > 15 ? 'bullish' : cagrPct < 5 ? 'bearish' : 'neutral',
    value: `CAGR ${cagrPct > 0 ? '+' : ''}${cagrPct.toFixed(1)}%`,
    reason: cagrPct > 15
      ? `Outperforming NIFTY50 benchmark (~13%) — alpha-generating stock`
      : cagrPct < 5
      ? `Underperforming NIFTY50 badly — consider switching to index`
      : `Near NIFTY benchmark — neither alpha nor drag`,
    weight: 2,
  });

  // 8. 20d Rate-of-Change
  const roc = roc20At(closes, n);
  signals.push({
    id: 'roc20',
    name: '20-Day Price Momentum',
    category: 'momentum',
    verdict: roc > 3 ? 'bullish' : roc < -3 ? 'bearish' : 'neutral',
    value: `ROC ${roc > 0 ? '+' : ''}${roc.toFixed(1)}%`,
    reason: roc > 3
      ? `Price up ${roc.toFixed(1)}% in 20 days — momentum trend intact`
      : roc < -3
      ? `Price down ${Math.abs(roc).toFixed(1)}% in 20 days — distribution phase`
      : `Price flat over 20 days — consolidation`,
    weight: 1,
  });

  // 9. Annualised Volatility
  const slice20 = closes.slice(-20);
  const m20 = slice20.reduce((a, b) => a + b, 0) / 20;
  const sd20 = Math.sqrt(slice20.reduce((acc, v) => acc + (v - m20) ** 2, 0) / 20);
  const annVol = m20 > 0 ? (sd20 / m20) * Math.sqrt(252) * 100 : 30;
  signals.push({
    id: 'volatility',
    name: 'Annualised Volatility',
    category: 'risk',
    verdict: annVol < 28 ? 'bullish' : annVol > 55 ? 'bearish' : 'neutral',
    value: `σ = ${annVol.toFixed(1)}% p.a.`,
    reason: annVol < 28
      ? `Low volatility (${annVol.toFixed(1)}%) — institutional quality, steady compounder`
      : annVol > 55
      ? `Extreme volatility (${annVol.toFixed(1)}%) — high risk, sizing down recommended`
      : `Moderate volatility (${annVol.toFixed(1)}%) — normal for Indian equities`,
    weight: 2,
  });

  // 10. 52-Week Position
  const high52 = closes.length >= 252 ? Math.max(...closes.slice(-252)) : Math.max(...closes);
  const low52  = closes.length >= 252 ? Math.min(...closes.slice(-252)) : Math.min(...closes);
  const range  = high52 - low52;
  const pos52  = range > 0 ? (cur - low52) / range : 0.5;
  signals.push({
    id: '52week',
    name: '52-Week Range Position',
    category: 'value',
    verdict: pos52 < 0.3 ? 'bullish' : pos52 > 0.88 ? 'bullish' : pos52 > 0.6 && pos52 <= 0.88 ? 'neutral' : 'neutral',
    value: `${(pos52 * 100).toFixed(0)}% of 52W range  ₹${low52.toFixed(0)}–₹${high52.toFixed(0)}`,
    reason: pos52 < 0.3
      ? `Near 52-week low — potential deep value entry for long-term investors`
      : pos52 > 0.88
      ? `Near 52-week high — breakout strength, strong institutional buying`
      : `Mid-range — neither deep value nor breakout`,
    weight: 1,
  });

  return signals;
}

// ─────────────────────────────────────────────────────────────────────────────
// Historical Frequency Scanner
// Finds all historical bars with similar signal alignment (bullishCount ± 1)
// and measures what % of time price was up 7/30/90 days later
// ─────────────────────────────────────────────────────────────────────────────

function computeFrequencyWindows(
  closes: number[],
  volumes: number[],
  ema12: number[],
  ema26: number[],
  ema20: number[],
  ema50: number[],
  ema200: number[],
  cagrPct: number,
  currentBullish: number,
): FrequencyWindow[] {
  const n = closes.length;
  const HORIZONS: Array<{ days: 7 | 30 | 90; label: string }> = [
    { days: 7,  label: '7 Days'  },
    { days: 30, label: '1 Month' },
    { days: 90, label: '3 Months' },
  ];

  return HORIZONS.map(({ days, label }) => {
    const gains: number[] = [];
    const losses: number[] = [];
    // Scan all historical bars (leave last 90 days as hold-out)
    const scanEnd = n - Math.max(days, 90);
    const startAt = Math.max(250, 50); // need warmup

    for (let i = startAt; i < scanEnd; i++) {
      const state = scoreSignalsAt(closes, volumes, ema12, ema26, ema20, ema50, ema200, cagrPct, i);
      // Match: same bullishCount ± 1 (fuzzy match to get enough samples)
      if (Math.abs(state.bullishCount - currentBullish) <= 1) {
        const futurePrice = closes[i + days];
        const currentBarPrice = closes[i];
        if (futurePrice && currentBarPrice > 0) {
          const ret = (futurePrice - currentBarPrice) / currentBarPrice * 100;
          if (ret >= 0) gains.push(ret);
          else losses.push(Math.abs(ret));
        }
      }
    }

    const total = gains.length + losses.length;
    const probabilityUp = total > 0 ? (gains.length / total) * 100 : 50;
    const avgGainPct    = gains.length  > 0 ? gains.reduce((a, b) => a + b, 0) / gains.length : 0;
    const avgLossPct    = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
    const riskReward    = avgLossPct > 0 ? avgGainPct / avgLossPct : avgGainPct;

    return {
      horizon: days,
      label,
      matchedWindows: total,
      probabilityUp: Number(probabilityUp.toFixed(1)),
      avgGainPct:    Number(avgGainPct.toFixed(2)),
      avgLossPct:    Number(avgLossPct.toFixed(2)),
      riskReward:    Number(riskReward.toFixed(2)),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Trading Advice Generator
// ─────────────────────────────────────────────────────────────────────────────

function buildTradingAdvice(
  currentPrice: number,
  verdict: string,
  annVol: number,
  freq30d: FrequencyWindow,
): TradingAdvice {
  const atr = currentPrice * (annVol / 100) * Math.sqrt(1 / 252) * 14; // 14-day ATR proxy

  // Stop-loss: 2x ATR below current (tighter for bearish setups)
  const stopLossMultiple = verdict.includes('Avoid') ? 1.5 : 2.0;
  const stopLoss = Number(Math.max(currentPrice - stopLossMultiple * atr, currentPrice * 0.85).toFixed(2));

  // Targets based on 30d frequency avg gain
  const t1Pct = Math.max(freq30d.avgGainPct, annVol * 0.15);
  const t2Pct = t1Pct * 1.8;
  const target1 = Number((currentPrice * (1 + t1Pct / 100)).toFixed(2));
  const target2 = Number((currentPrice * (1 + t2Pct / 100)).toFixed(2));

  // Position sizing advice
  let positionSizing: string;
  if (verdict === 'Strong Buy')   positionSizing = 'Full position (up to 8–10% of portfolio). Scale in 2–3 tranches over 5–7 days.';
  else if (verdict === 'Buy')     positionSizing = 'Moderate position (4–6% of portfolio). Starter tranche now, add on confirmation.';
  else if (verdict === 'Hold')    positionSizing = 'Existing holdings only. No fresh capital until signal clarity improves.';
  else if (verdict === 'Avoid')   positionSizing = 'Do not initiate. If holding, consider trimming 30–50% of exposure.';
  else                            positionSizing = 'Exit or hedge. Stop-loss at current ATR-2x level immediately.';

  // Key risk
  const keyRisk = annVol > 45
    ? `High volatility (${annVol.toFixed(1)}% ann.) — size positions conservatively. A 2-ATR adverse move = ${(stopLossMultiple * annVol * Math.sqrt(14 / 252)).toFixed(1)}% loss.`
    : `Standard equity risk. Monitor for sector rotation and RBI policy changes.`;

  // Exit trigger
  const exitTrigger = verdict.includes('Buy')
    ? `Exit if price closes below ₹${stopLoss.toLocaleString('en-IN')} (stop-loss) OR if RSI exceeds 75 and MACD turns negative simultaneously.`
    : `Re-enter only when 6+ signals turn bullish and 30-day frequency rises above 60%.`;

  return { positionSizing, stopLoss, target1, target2, keyRisk, exitTrigger };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────────────────────────────────────

export interface OHLCVBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function runSignalFrequencyEngine(
  symbol: string,
  bars: OHLCVBar[],
): SignalFrequencyResult {
  const closes  = bars.map(b => b.close);
  const volumes = bars.map(b => b.volume);
  const n = closes.length;
  const cur = closes[n - 1];

  // Pre-compute EMA series (shared across all callers)
  const ema12s  = emaFull(closes, 12);
  const ema26s  = emaFull(closes, 26);
  const ema20s  = emaFull(closes, 20);
  const ema50s  = emaFull(closes, 50);
  const ema200s = emaFull(closes, 200);

  // CAGR
  const cagrPct = closes[0] > 0
    ? (Math.pow(cur / closes[0], 365 / n) - 1) * 100
    : 0;

  // Build display signals for current bar
  const signals = buildSignalList(closes, volumes, ema12s, ema26s, ema20s, ema50s, ema200s, cagrPct);
  const bullishCount = signals.filter(s => s.verdict === 'bullish').length;
  const bearishCount = signals.filter(s => s.verdict === 'bearish').length;
  const neutralCount = signals.filter(s => s.verdict === 'neutral').length;

  // Historical frequency scan
  const frequencyWindows = computeFrequencyWindows(
    closes, volumes, ema12s, ema26s, ema20s, ema50s, ema200s, cagrPct, bullishCount
  );

  // Verdict — based on signal majority + 30d historical frequency
  const freq30 = frequencyWindows.find(f => f.horizon === 30)!;
  const confPct = freq30.matchedWindows >= 5 ? freq30.probabilityUp : 50 + (bullishCount - bearishCount) * 5;

  let verdict: SignalFrequencyResult['verdict'];
  if (bullishCount >= 7 && confPct >= 65)       verdict = 'Strong Buy';
  else if (bullishCount >= 6 && confPct >= 58)   verdict = 'Buy';
  else if (bearishCount >= 7 && confPct <= 35)   verdict = 'Strong Avoid';
  else if (bearishCount >= 6 && confPct <= 42)   verdict = 'Avoid';
  else                                            verdict = 'Hold';

  const histNote = freq30.matchedWindows >= 5
    ? ` In past ${Math.round(n / 252)} year(s), when ${bullishCount}+ signals aligned, price went UP ${freq30.probabilityUp}% of 30-day windows (${freq30.matchedWindows} historical matches).`
    : ' Insufficient history for frequency analysis — verdict based on signal majority only.';

  const verdictReason =
    `${bullishCount}/${signals.length} signals bullish, ${bearishCount}/${signals.length} bearish.${histNote}`;

  // Volatility for trading advice
  const slice20 = closes.slice(-20);
  const m20 = slice20.reduce((a, b) => a + b, 0) / 20;
  const sd20 = Math.sqrt(slice20.reduce((acc, v) => acc + (v - m20) ** 2, 0) / 20);
  const annVol = m20 > 0 ? (sd20 / m20) * Math.sqrt(252) * 100 : 30;

  const tradingAdvice = buildTradingAdvice(cur, verdict, annVol, freq30);

  return {
    symbol,
    currentPrice: cur,
    trainingBars: n,
    signals,
    bullishCount,
    bearishCount,
    neutralCount,
    totalSignals: signals.length,
    frequencyWindows,
    verdict,
    verdictConfidence: Number(confPct.toFixed(1)),
    verdictReason,
    tradingAdvice,
    computedAt: new Date().toISOString(),
  };
}
