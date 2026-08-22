import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const POPULAR_STOCKS = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd', price: 2980.50, change: 1.2 },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services Ltd', price: 4250.00, change: -0.4 },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', price: 1640.20, change: 0.8 },
  { symbol: 'INFY.NS', name: 'Infosys Ltd', price: 1820.75, change: 1.5 },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd', price: 1210.30, change: 0.3 },
  { symbol: 'SBIN.NS', name: 'State Bank of India', price: 845.60, change: -0.2 },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd', price: 1480.00, change: 2.1 },
  { symbol: 'ITC.NS', name: 'ITC Ltd', price: 495.20, change: 0.5 },
  { symbol: 'L&T.NS', name: 'Larsen & Toubro Ltd', price: 3620.00, change: -0.8 },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Ltd', price: 6890.00, change: 1.1 },
];

const POPULAR_FUNDS = [
  { symbol: '122639', name: 'Parag Parikh Flexi Cap Fund - Direct Growth', price: 82.45, change: 0.9 },
  { symbol: '125497', name: 'SBI Small Cap Fund - Direct Growth', price: 168.20, change: 1.4 },
  { symbol: '120503', name: 'Axis Bluechip Fund - Direct Growth', price: 64.80, change: 0.3 },
  { symbol: '118834', name: 'Mirae Asset Large Cap Fund - Direct Growth', price: 112.50, change: 0.6 },
  { symbol: '118778', name: 'Nippon India Small Cap Fund - Direct Growth', price: 174.30, change: 1.8 },
  { symbol: '120847', name: 'Quant Active Fund - Direct Growth', price: 380.10, change: 2.2 },
  { symbol: '120716', name: 'HDFC Mid-Cap Opportunities Fund - Direct Growth', price: 185.60, change: 1.1 },
  { symbol: '119828', name: 'Kotak Emerging Equity Fund - Direct Growth', price: 124.90, change: 0.7 },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || '';
  
  if (!q.trim()) {
    return NextResponse.json({ suggestions: [] });
  }

  // 1. Auto-suggest pool query (used for suggested discoveries on modal opening)
  if (q.includes('suggest 5 random')) {
    const isFund = q.includes('mutual funds') || type === 'mutual_fund';
    const pool = isFund ? POPULAR_FUNDS : POPULAR_STOCKS;
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return NextResponse.json({ suggestions: shuffled.slice(0, 5) });
  }

  const queryLower = q.trim().toLowerCase();

  // 2. Mutual Fund Search using official Indian AMFI api (api.mfapi.in)
  if (type === 'mutual_fund') {
    try {
      const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(q)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 3600 }
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Take top 6 matching schemes
          const topSchemes = data.slice(0, 6);

          // Fetch current NAV price for each scheme in parallel
          const enriched = await Promise.all(
            topSchemes.map(async (scheme: any) => {
              try {
                const navRes = await fetch(`https://api.mfapi.in/mf/${scheme.schemeCode}`, {
                  next: { revalidate: 3600 }
                });
                if (navRes.ok) {
                  const navData = await navRes.json();
                  const latest = navData.data?.[0];
                  const price = latest ? parseFloat(latest.nav) : undefined;
                  return {
                    symbol: String(scheme.schemeCode),
                    name: scheme.schemeName,
                    price: price
                  };
                }
              } catch (e) {
                // Ignore individual NAV fetch error
              }
              return {
                symbol: String(scheme.schemeCode),
                name: scheme.schemeName
              };
            })
          );

          return NextResponse.json({ suggestions: enriched });
        }
      }
    } catch (err) {
      console.error("MF API search failed, falling back to static pool:", err);
    }

    // Fallback static search over popular Indian Mutual Funds
    const matchedPopular = POPULAR_FUNDS.filter(f => 
      f.name.toLowerCase().includes(queryLower) || f.symbol.toLowerCase().includes(queryLower)
    );
    return NextResponse.json({ suggestions: matchedPopular });
  }

  // 3. Stock Search using Yahoo Finance
  try {
    const searchRes = await yahooFinance.search(q);
    
    let parsed = searchRes.quotes
      .filter((item: any) => {
        if (!item.symbol) return false;
        const symUpper = item.symbol.toUpperCase();
        // Prefer Indian NSE/BSE stocks
        if (symUpper.endsWith('.NS') || symUpper.endsWith('.BO')) return true;
        if (item.exchange === 'NSI' || item.exchange === 'BSE') return true;
        return false;
      })
      .slice(0, 7)
      .map((item: any) => ({
        symbol: item.symbol,
        name: item.shortname || item.longname || item.symbol
      }));

    // Global fallback if no NSE/BSE stock matches
    if (parsed.length === 0) {
      parsed = searchRes.quotes
        .filter((item: any) => item.symbol && item.quoteType === 'EQUITY')
        .slice(0, 7)
        .map((item: any) => ({
          symbol: item.symbol,
          name: item.shortname || item.longname || item.symbol
        }));
    }

    // Enrich stock search results with live price data
    const symbols = parsed.map((item: any) => item.symbol);
    if (symbols.length > 0) {
      try {
        const quotes = await yahooFinance.quote(symbols);
        const quoteArray = Array.isArray(quotes) ? quotes : [quotes];
        
        const enriched = parsed.map((item: any) => {
          const qData = quoteArray.find((qd: any) => qd.symbol === item.symbol);
          if (qData) {
            return {
              ...item,
              price: qData.regularMarketPrice,
              change: qData.regularMarketChangePercent
            };
          }
          return item;
        });

        return NextResponse.json({ suggestions: enriched });
      } catch (e) {
        return NextResponse.json({ suggestions: parsed });
      }
    }

    return NextResponse.json({ suggestions: parsed });
  } catch (err) {
    console.error("Stock search failed, falling back to static pool:", err);
    const matchedStocks = POPULAR_STOCKS.filter(s =>
      s.name.toLowerCase().includes(queryLower) || s.symbol.toLowerCase().includes(queryLower)
    );
    return NextResponse.json({ suggestions: matchedStocks });
  }
}
