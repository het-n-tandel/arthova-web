import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { auth } from '@/auth';

const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical', 'yahooSurvey'] });

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');
    const dateStr = searchParams.get('date'); // YYYY-MM-DD

    if (!symbol || !dateStr) {
      return NextResponse.json({ error: 'Missing symbol or date' }, { status: 400 });
    }

    const targetDate = new Date(dateStr);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 5); // 5-day window to catch weekends/holidays

    const querySymbol = symbol.includes('.') || symbol.includes('=') || symbol.includes('^')
      ? symbol
      : `${symbol}.NS`;

    const chart = await yahooFinance.chart(querySymbol, {
      period1: targetDate.toISOString().slice(0, 10),
      period2: nextDate.toISOString().slice(0, 10),
      interval: '1d',
    });

    if (chart?.quotes && chart.quotes.length > 0) {
      const firstValidQuote = chart.quotes.find((q: any) => q.close != null);
      if (firstValidQuote && firstValidQuote.close != null) {
        return NextResponse.json({
          symbol: querySymbol,
          date: firstValidQuote.date,
          close: Number(firstValidQuote.close.toFixed(2)),
          open: firstValidQuote.open ? Number(firstValidQuote.open.toFixed(2)) : undefined,
          high: firstValidQuote.high ? Number(firstValidQuote.high.toFixed(2)) : undefined,
          low: firstValidQuote.low ? Number(firstValidQuote.low.toFixed(2)) : undefined,
        });
      }
    }

    return NextResponse.json({ error: 'No price found for specified date range' }, { status: 404 });
  } catch (err: any) {
    console.error('Historical price fetch error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch historical price' }, { status: 500 });
  }
}
