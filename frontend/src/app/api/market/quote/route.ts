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
    console.error('Yahoo Finance Error:', error);
    return new NextResponse('Failed to fetch quote', { status: 500 });
  }
}
