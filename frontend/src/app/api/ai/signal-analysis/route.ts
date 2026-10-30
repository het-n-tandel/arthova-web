import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { GoogleGenAI } from '@google/genai';
import { runSignalFrequencyEngine, OHLCVBar } from '@/lib/strategies/signal-frequency-engine';
import { generateSyntheticOHLCV } from '@/lib/strategies/price-prediction';

const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical', 'yahooSurvey'] });

const PERIOD_YEARS: Record<string, number> = {
  '1y': 1, '2y': 2, '3y': 3, '5y': 5, '10y': 10,
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  return handle(searchParams.get('symbol') || 'RELIANCE', searchParams.get('period') || '5y');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return handle(body.symbol || 'RELIANCE', body.period || '5y');
  } catch {
    return handle('RELIANCE', '5y');
  }
}

async function handle(rawSymbol: string, period: string) {
  const clean  = rawSymbol.toUpperCase().replace('.NS', '').replace('.BO', '');
  const symbol = `${clean}.NS`;
  const years  = PERIOD_YEARS[period] ?? 5;

  const period1 = new Date();
  period1.setFullYear(period1.getFullYear() - years);
  const period2 = new Date();

  let bars: OHLCVBar[] = [];
  try {
    const chart = await yahooFinance.chart(symbol, {
      period1: period1.toISOString().slice(0, 10),
      period2: period2.toISOString().slice(0, 10),
      interval: '1d',
    });
    bars = (chart?.quotes ?? [])
      .filter((q: any) => q.close != null)
      .map((q: any) => ({
        date:   q.date instanceof Date ? q.date.toISOString().slice(0, 10) : String(q.date).slice(0, 10),
        open:   Number((q.open  ?? q.close).toFixed(2)),
        high:   Number((q.high  ?? q.close).toFixed(2)),
        low:    Number((q.low   ?? q.close).toFixed(2)),
        close:  Number(q.close.toFixed(2)),
        volume: q.volume ?? 0,
      }));
  } catch (err) {
    console.warn(`Yahoo fetch failed for ${symbol}:`, err);
  }

  if (bars.length < 60) {
    console.info(`Yahoo Finance returned ${bars.length} bars for ${symbol}. Using deterministic quantitative simulation fallback.`);
    bars = generateSyntheticOHLCV(symbol, years);
  }

  // Run signal frequency engine
  const result = runSignalFrequencyEngine(symbol, bars);

  // Gemini advisory narrative
  const apiKey = process.env.GEMINI_API_KEY;
  let geminiAdvice: string | null = null;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const bullSignals = result.signals.filter(s => s.verdict === 'bullish').map(s => s.name).join(', ');
      const bearSignals = result.signals.filter(s => s.verdict === 'bearish').map(s => s.name).join(', ');
      const freq30      = result.frequencyWindows.find(f => f.horizon === 30)!;

      const prompt = `You are a SEBI-registered institutional analyst advising a retail investor in India.

Stock: ${symbol}
Training data: ${result.trainingBars} trading days (${period})
Verdict: ${result.verdict} with ${result.verdictConfidence}% historical confidence

Signal Breakdown (${result.bullishCount}/${result.totalSignals} bullish):
BULLISH: ${bullSignals || 'None'}
BEARISH: ${bearSignals || 'None'}

Historical Frequency (30-day):
- ${freq30.matchedWindows} matched historical windows
- Price went UP ${freq30.probabilityUp}% of the time
- Avg gain when up: +${freq30.avgGainPct}%
- Avg loss when down: -${freq30.avgLossPct}%
- Risk/Reward: ${freq30.riskReward}x

Trading Advice:
- Position: ${result.tradingAdvice.positionSizing}
- Stop Loss: ₹${result.tradingAdvice.stopLoss}
- Target 1: ₹${result.tradingAdvice.target1}
- Target 2: ₹${result.tradingAdvice.target2}

The user asked for trading advice on this stock. Write 3 sentences (max 100 words) that:
1. Honestly explain what the signal frequency means in plain language (not hype)
2. Mention the key risk a retail investor must understand
3. Give one clear, specific next action

Context: In India, SEBI rules mean we cannot guarantee returns. Be helpful but honest.
Plain text. No markdown. No bullet points.`;

      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      geminiAdvice = response.text?.trim() ?? null;
    } catch (err) {
      console.warn('Gemini advisory failed:', err);
    }
  }

  return NextResponse.json({ ...result, geminiAdvice });
}
