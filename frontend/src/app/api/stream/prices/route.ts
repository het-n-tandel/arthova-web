import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  const { searchParams } = new URL(req.url);
  const symbolsParam = searchParams.get('symbols');
  let symbols: string[] = [];

  if (symbolsParam) {
    symbols = symbolsParam.split(',').filter(Boolean);
  } else {
    // Fetch user's actual database holdings to stream
    const userId = session.user.id;
    try {
      const res = await fetch(`http://localhost:8080/api/public/portfolio/${userId}`);
      if (res.ok) {
        const holdings = await res.json();
        const dbSymbols = holdings
            .filter((h: any) => h.assetType === 'stock' || h.assetType === 'mutual_fund')
            .map((h: any) => h.symbol);
        symbols = [...new Set([...dbSymbols, 'GC=F', 'SI=F', 'INR=X'])];
      }
    } catch (e) {
      console.error('Failed to fetch DB holdings for stream', e);
    }
  }

  if (symbols.length === 0) {
    symbols = ['RELIANCE.NS', 'TCS.NS', 'GC=F', 'SI=F', 'INR=X'];
  }

  let intervalId: NodeJS.Timeout;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      const sendEvent = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
          // Client disconnected
        }
      };

      // Initial fetch immediately
      const fetchPrices = async () => {
        try {
          const quotes = await yahooFinance.quote(symbols);
          const results = Array.isArray(quotes) ? quotes : [quotes];
          
          for (const q of results) {
            if (!q || !q.regularMarketPrice) continue;
            sendEvent({ 
              type: 'PRICE_UPDATE', 
              payload: { 
                symbol: q.symbol, 
                price: q.regularMarketPrice, 
                change: q.regularMarketChange,
                changePercent: q.regularMarketChangePercent,
                timestamp: new Date().toISOString() 
              } 
            });
          }
        } catch (err) {
          console.error("Stream polling error (skipping mock fallback):", err);
          // Removed mock fallback. If Yahoo fails, the frontend will just use avgCost.
        }
      };

      fetchPrices(); // Run once on connect
      // Poll Yahoo Finance every 10 seconds to avoid aggressive rate limiting
      intervalId = setInterval(fetchPrices, 10000);
    },
    cancel() {
      clearInterval(intervalId);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
