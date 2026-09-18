import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical', 'yahooSurvey'] });

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbolsParam = searchParams.get('symbols') || '';
  const symbols = symbolsParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (symbols.length === 0) {
    return NextResponse.json([]);
  }

  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const seriesList = await Promise.all(
      symbols.map(async (symbol) => {
        const querySym = symbol.includes('.') || symbol.includes('=') || symbol.includes('^')
          ? symbol
          : `${symbol}.NS`;

        try {
          const chart = await yahooFinance.chart(querySym, {
            period1: oneYearAgo.toISOString().slice(0, 10),
            period2: new Date().toISOString().slice(0, 10),
            interval: '1wk',
          });

          if (!chart?.quotes || chart.quotes.length === 0) {
            return { symbol, data: [] };
          }

          const baseClose = chart.quotes[0].close || 1;
          const normalized = chart.quotes
            .filter((q: any) => q.close != null)
            .map((q: any) => ({
              date: new Date(q.date).toISOString().slice(0, 10),
              value: Number(((q.close / baseClose) * 100).toFixed(2)),
              price: Number(q.close.toFixed(2)),
            }));

          return { symbol, data: normalized };
        } catch (e) {
          console.warn(`Could not fetch compare chart for ${symbol}`, e);
          return { symbol, data: [] };
        }
      })
    );

    // Merge by date into single recharts dataset
    const dateMap = new Map<string, any>();
    seriesList.forEach(({ symbol, data }) => {
      data.forEach((point: any) => {
        if (!dateMap.has(point.date)) {
          dateMap.set(point.date, { date: point.date });
        }
        dateMap.get(point.date)[symbol] = point.value;
      });
    });

    const merged = Array.from(dateMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return NextResponse.json(merged);
  } catch (err: any) {
    console.error('Compare dynamic error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
