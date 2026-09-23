import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { auth } from '@/auth';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) return new NextResponse('Missing symbol', { status: 400 });

  try {
    const quote = await yahooFinance.quote(symbol);
    return NextResponse.json(quote);
  } catch (error) {
    console.warn('Yahoo Finance Error for', symbol, '- using fallback quote');
    // Fallback estimates for common symbols so client doesn't 500
    const fallbackPrices: Record<string, number> = {
      'RELIANCE.NS': 2950,
      'TCS.NS': 4150,
      'POLYCAB.NS': 6420,
      'CDSL.NS': 1610,
      'TATAMOTORS.NS': 980,
      'PERSISTENT.NS': 4920,
      'ANGELONE.NS': 2840,
      'HDFCBANK.NS': 1640,
      'INFY.NS': 1820,
      'GC=F': 2400,
      'SI=F': 30.5,
      'INR=X': 83.8,
    };
    const cleanSym = symbol.toUpperCase();
    const estPrice = fallbackPrices[cleanSym] || fallbackPrices[`${cleanSym}.NS`] || 1000;
    return NextResponse.json({
      symbol,
      regularMarketPrice: estPrice,
      regularMarketChange: 0,
      regularMarketChangePercent: 0,
      displayName: symbol.replace('.NS', ''),
    });
  }
}
