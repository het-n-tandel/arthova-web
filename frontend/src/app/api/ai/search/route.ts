import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const POPULAR_STOCKS = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services Ltd' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd' },
  { symbol: 'INFY.NS', name: 'Infosys Ltd' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd' },
  { symbol: 'SBIN.NS', name: 'State Bank of India' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd' },
  { symbol: 'ITC.NS', name: 'ITC Ltd' },
  { symbol: 'L&T.NS', name: 'Larsen & Toubro Ltd' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Ltd' },
];

const POPULAR_FUNDS = [
  { symbol: '0P0000XVYE.BO', name: 'Parag Parikh Flexi Cap Fund' },
  { symbol: '0P0000XW8F.BO', name: 'SBI Small Cap Fund' },
  { symbol: '0P0000YWL1.BO', name: 'Axis Bluechip Fund' },
  { symbol: '0P0000YCQ2.BO', name: 'Mirae Asset Large Cap Fund' },
  { symbol: '0P0000XVUS.BO', name: 'Nippon India Small Cap Fund' },
  { symbol: '0P0001B6W1.BO', name: 'Quant Active Fund' },
  { symbol: '0P0000XVY9.BO', name: 'HDFC Mid-Cap Opportunities Fund' },
  { symbol: '0P0000XW1A.BO', name: 'Kotak Emerging Equity Fund' },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const type = searchParams.get('type');
  
  if (!q) {
    return NextResponse.json({ suggestions: [] });
  }
  
  try {
    let parsed: any[] = [];
    
    // Check if it's the auto-suggest query for random stocks/funds
    if (q.includes('suggest 5 random')) {
      const isFund = q.includes('mutual funds');
      const pool = isFund ? POPULAR_FUNDS : POPULAR_STOCKS;
      
      // Shuffle array
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      parsed = shuffled.slice(0, 5);
    } else {
      // It's a real user search, use Yahoo Finance directly
      const searchRes = await yahooFinance.search(q);
      
      // Filter for Indian exchanges first
      parsed = searchRes.quotes
        .filter((q: any) => {
          if (!q.isYahooFinance || !q.symbol) return false;
          if (q.exchange !== 'NSI' && q.exchange !== 'BSE') return false;
          if (type === 'stock' && q.quoteType !== 'EQUITY') return false;
          if (type === 'mutual_fund' && q.quoteType !== 'MUTUALFUND') return false;
          return true;
        })
        .slice(0, 7)
        .map((q: any) => ({
          symbol: q.symbol,
          name: q.shortname || q.longname || q.symbol
        }));
        
      // If we got nothing from Indian exchanges, fallback to global
      if (parsed.length === 0) {
        parsed = searchRes.quotes
          .filter((q: any) => {
            if (!q.isYahooFinance || !q.symbol) return false;
            if (type === 'stock' && q.quoteType !== 'EQUITY') return false;
            if (type === 'mutual_fund' && q.quoteType !== 'MUTUALFUND') return false;
            return true;
          })
          .slice(0, 7)
          .map((q: any) => ({
            symbol: q.symbol,
            name: q.shortname || q.longname || q.symbol
          }));
      }
    }
    
    // Enrich with Yahoo Finance Price Data
    const symbols = parsed.map((item: any) => item.symbol);
    if (symbols.length > 0) {
      try {
          const quotes = await yahooFinance.quote(symbols);
          const quoteArray = Array.isArray(quotes) ? quotes : [quotes];
          
          const enriched = parsed.map((item: any) => {
              const qData = quoteArray.find((q: any) => q.symbol === item.symbol);
              if (qData) {
                  return { ...item, price: qData.regularMarketPrice, change: qData.regularMarketChangePercent };
              }
              return item;
          });
          return NextResponse.json({ suggestions: enriched });
      } catch (err) {
          console.error("Yahoo finance error in price fetch", err);
          return NextResponse.json({ suggestions: parsed });
      }
    }
    
    return NextResponse.json({ suggestions: parsed });
  } catch (e) {
    console.error('Fast Search error', e);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
