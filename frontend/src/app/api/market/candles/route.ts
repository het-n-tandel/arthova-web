import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { generateCandlestickData } from '@/lib/mock-data';
import { getEquityMarketQuote } from '@/lib/stock-prices';

const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical', 'yahooSurvey'] });

const candleCache = new Map<string, { data: any[]; expiresAt: number }>();

function normalizeSymbol(raw: string): string {
  const upper = raw.toUpperCase().trim();
  if (upper.includes('.') || upper.includes('=') || upper.includes('^') || upper.includes('-')) {
    return upper;
  }
  return `${upper}.NS`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawSymbol = searchParams.get('symbol');
  const range = searchParams.get('range') || '2005 - Present';

  if (!rawSymbol) {
    return NextResponse.json({ error: 'Missing symbol parameter' }, { status: 400 });
  }

  const querySymbol = normalizeSymbol(rawSymbol);
  const cleanSym = querySymbol.replace('.NS', '').replace('.BO', '');
  const cacheKey = `${querySymbol}_${range}`;

  // 1. Check in-memory cache
  const cached = candleCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({
      symbol: querySymbol,
      range,
      candles: cached.data,
      isRealData: true,
      count: cached.data.length,
    });
  }

  // 2. Determine period1 based on range
  const now = new Date();
  let period1 = new Date('2005-01-01');

  if (range === '1M') {
    period1 = new Date(now);
    period1.setMonth(now.getMonth() - 1);
  } else if (range === '3M') {
    period1 = new Date(now);
    period1.setMonth(now.getMonth() - 3);
  } else if (range === '6M') {
    period1 = new Date(now);
    period1.setMonth(now.getMonth() - 6);
  } else if (range === '1Y') {
    period1 = new Date(now);
    period1.setFullYear(now.getFullYear() - 1);
  } else if (range === '5Y') {
    period1 = new Date(now);
    period1.setFullYear(now.getFullYear() - 5);
  }

  try {
    const chart = await yahooFinance.chart(querySymbol, {
      period1: period1.toISOString().slice(0, 10),
      period2: now.toISOString().slice(0, 10),
      interval: '1d',
    });

    if (chart?.quotes && chart.quotes.length > 5) {
      const formattedCandles = chart.quotes
        .filter((q: any) => q.close != null && q.open != null)
        .map((q: any) => {
          const dateStr = q.date instanceof Date ? q.date.toISOString().slice(0, 10) : String(q.date).slice(0, 10);
          return {
            time: dateStr,
            open: Number((q.open ?? q.close).toFixed(2)),
            high: Number((q.high ?? q.close).toFixed(2)),
            low: Number((q.low ?? q.close).toFixed(2)),
            close: Number(q.close.toFixed(2)),
            volume: q.volume ?? 0,
          };
        });

      if (formattedCandles.length > 0) {
        candleCache.set(cacheKey, {
          data: formattedCandles,
          expiresAt: Date.now() + 60000, // 60 seconds
        });

        return NextResponse.json({
          symbol: querySymbol,
          range,
          candles: formattedCandles,
          isRealData: true,
          count: formattedCandles.length,
        });
      }
    }
  } catch (err: any) {
    console.warn(`Yahoo Finance chart fetch failed for ${querySymbol}:`, err?.message || err);
  }

  // 3. Fallback to realistic synthetic multi-decade generator if offline
  const marketQuote = getEquityMarketQuote(cleanSym);
  const fallbackCandles = generateCandlestickData(5500, marketQuote.cmp);

  return NextResponse.json({
    symbol: querySymbol,
    range,
    candles: fallbackCandles,
    isRealData: false,
    count: fallbackCandles.length,
  });
}
