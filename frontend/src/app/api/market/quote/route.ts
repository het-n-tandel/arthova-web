import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { getEquityMarketQuote } from '@/lib/stock-prices';

const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical', 'yahooSurvey'] });

// In-memory 15-second TTL cache to prevent rate-limiting
const quoteCache = new Map<string, { data: any; expiresAt: number }>();

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

  if (!rawSymbol) {
    return NextResponse.json({ error: 'Missing symbol parameter' }, { status: 400 });
  }

  const querySymbol = normalizeSymbol(rawSymbol);
  const cleanSym = querySymbol.replace('.NS', '').replace('.BO', '');

  // 1. Check in-memory cache
  const cached = quoteCache.get(querySymbol);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data);
  }

  try {
    const q: any = await yahooFinance.quote(querySymbol);

    if (q && q.regularMarketPrice != null) {
      const payload = {
        symbol: querySymbol,
        cleanSymbol: cleanSym,
        price: Number(q.regularMarketPrice.toFixed(2)),
        change: Number((q.regularMarketChange ?? 0).toFixed(2)),
        changePercent: Number((q.regularMarketChangePercent ?? 0).toFixed(2)),
        previousClose: q.regularMarketPreviousClose ? Number(q.regularMarketPreviousClose.toFixed(2)) : undefined,
        open: q.regularMarketOpen ? Number(q.regularMarketOpen.toFixed(2)) : undefined,
        high: q.regularMarketDayHigh ? Number(q.regularMarketDayHigh.toFixed(2)) : undefined,
        low: q.regularMarketDayLow ? Number(q.regularMarketDayLow.toFixed(2)) : undefined,
        volume: q.regularMarketVolume ?? 0,
        weekHigh52: q.fiftyTwoWeekHigh ? Number(q.fiftyTwoWeekHigh.toFixed(2)) : undefined,
        weekLow52: q.fiftyTwoWeekLow ? Number(q.fiftyTwoWeekLow.toFixed(2)) : undefined,
        marketCap: q.marketCap,
        marketCapCr: q.marketCap ? Math.round(q.marketCap / 10000000) : undefined,
        pe: q.trailingPE ? Number(q.trailingPE.toFixed(2)) : undefined,
        name: q.longName || q.shortName || cleanSym,
        currency: q.currency || 'INR',
        exchange: q.exchange || 'NSE',
        isRealTime: true,
        timestamp: q.regularMarketTime ? new Date(q.regularMarketTime).toISOString() : new Date().toISOString(),
      };

      quoteCache.set(querySymbol, {
        data: payload,
        expiresAt: Date.now() + 15000, // 15 seconds
      });

      return NextResponse.json(payload);
    }
  } catch (error: any) {
    console.warn(`Yahoo Finance live quote fetch failed for ${querySymbol}:`, error?.message || error);
  }

  // 2. Graceful Fallback if Yahoo Finance is rate-limited or offline
  const marketQuote = getEquityMarketQuote(cleanSym);
  const fallbackPayload = {
    symbol: querySymbol,
    cleanSymbol: cleanSym,
    price: marketQuote.cmp,
    change: marketQuote.dayChange,
    changePercent: marketQuote.dayChangePercent,
    weekHigh52: marketQuote.weekHigh52,
    weekLow52: marketQuote.weekLow52,
    marketCapCr: marketQuote.marketCapCr,
    pe: marketQuote.pe,
    name: cleanSym,
    currency: 'INR',
    exchange: 'NSE',
    isRealTime: false,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(fallbackPayload);
}
