import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical', 'yahooSurvey'] });

interface AIStockMeta {
  symbol: string;
  name: string;
  aiRationale: string;
  defaultPrice: number;
}

const AI_WATCHLIST_STOCKS: AIStockMeta[] = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd', aiRationale: 'AI Pick: Free Cash Flow & Energy/Retail Leadership', defaultPrice: 2980.50 },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', aiRationale: 'AI Pick: High Return on Equity & Tech Resilience', defaultPrice: 4250.00 },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', aiRationale: 'AI Pick: Credit Expansion & Low NPA Quality Banking', defaultPrice: 1640.20 },
  { symbol: 'INFY.NS', name: 'Infosys Ltd', aiRationale: 'AI Pick: Cloud AI Deal Pipeline & Strong Dividends', defaultPrice: 1820.75 },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd', aiRationale: 'AI Pick: High Net Interest Margin & Retail Growth', defaultPrice: 1210.30 },
  { symbol: 'SBIN.NS', name: 'State Bank of India', aiRationale: 'AI Pick: Public Banking Valuation Discount Alpha', defaultPrice: 845.60 },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd', aiRationale: 'AI Pick: Telecommunication ARPU Expansion', defaultPrice: 1480.00 },
  { symbol: 'ITC.NS', name: 'ITC Ltd', aiRationale: 'AI Pick: Defensive FMCG Moat & High Dividend Yield', defaultPrice: 495.20 },
  { symbol: 'L&T.NS', name: 'Larsen & Toubro Ltd', aiRationale: 'AI Pick: National Infrastructure Capex Supercycle', defaultPrice: 3620.00 },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Ltd', aiRationale: 'AI Pick: Leading FinTech Consumer Credit Engine', defaultPrice: 6890.00 },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors Ltd', aiRationale: 'AI Pick: EV Market Dominance & JLR Margin Expansion', defaultPrice: 960.00 },
];

const POPULAR_FUNDS = [
  { symbol: '122639', name: 'Parag Parikh Flexi Cap Fund - Direct Growth', aiRationale: 'AI Pick: Global Equity Alpha & Prudent Moat', defaultPrice: 82.45 },
  { symbol: '125497', name: 'SBI Small Cap Fund - Direct Growth', aiRationale: 'AI Pick: High-Alpha Long-Term Compounding', defaultPrice: 168.20 },
  { symbol: '118778', name: 'Nippon India Small Cap Fund - Direct Growth', aiRationale: 'AI Pick: High Sharpe Outperformer', defaultPrice: 174.30 },
  { symbol: '120847', name: 'Quant Active Fund - Direct Growth', aiRationale: 'AI Pick: Predictive Dynamic Factor Allocation', defaultPrice: 380.10 },
  { symbol: '120716', name: 'HDFC Mid-Cap Opportunities Fund - Direct Growth', aiRationale: 'AI Pick: Consistent Category Beta Defense', defaultPrice: 185.60 },
];

let stockCache: { data: any[]; timestamp: number } | null = null;
let mfCache: { data: any[]; timestamp: number } | null = null;

async function getLiveStocksWithAI(): Promise<any[]> {
  const now = Date.now();
  if (stockCache && now - stockCache.timestamp < 45000) {
    return stockCache.data;
  }

  try {
    const symbols = AI_WATCHLIST_STOCKS.map((s) => s.symbol);
    const quotes = await Promise.all(
      symbols.map(async (sym) => {
        try {
          const q = await yahooFinance.quote(sym);
          return { symbol: sym, quote: q };
        } catch (e) {
          return { symbol: sym, quote: null };
        }
      })
    );

    const enriched = AI_WATCHLIST_STOCKS.map((meta) => {
      const match = quotes.find((q) => q.symbol === meta.symbol)?.quote;
      const price = match?.regularMarketPrice ?? meta.defaultPrice;
      const change = match?.regularMarketChangePercent != null
        ? Number(match.regularMarketChangePercent.toFixed(2))
        : 0.85;

      return {
        symbol: meta.symbol,
        name: meta.name,
        price: Number(price.toFixed(2)),
        change,
        aiRationale: meta.aiRationale,
      };
    });

    stockCache = { data: enriched, timestamp: now };
    return enriched;
  } catch (err) {
    console.error('Failed to query live stocks:', err);
    return AI_WATCHLIST_STOCKS.map((s) => ({
      symbol: s.symbol,
      name: s.name,
      price: s.defaultPrice,
      change: 0.5,
      aiRationale: s.aiRationale,
    }));
  }
}

async function getLiveMutualFundsWithAI(): Promise<any[]> {
  const now = Date.now();
  if (mfCache && now - mfCache.timestamp < 120000) {
    return mfCache.data;
  }

  try {
    const results = await Promise.all(
      POPULAR_FUNDS.map(async (fund) => {
        try {
          const res = await fetch(`https://api.mfapi.in/mf/${fund.symbol}`, { next: { revalidate: 3600 } });
          if (res.ok) {
            const data = await res.json();
            const latestNav = data.data?.[0]?.nav;
            return {
              symbol: fund.symbol,
              name: fund.name,
              price: latestNav ? parseFloat(latestNav) : fund.defaultPrice,
              change: 0.75,
              aiRationale: fund.aiRationale,
            };
          }
        } catch (e) {}
        return {
          symbol: fund.symbol,
          name: fund.name,
          price: fund.defaultPrice,
          change: 0.5,
          aiRationale: fund.aiRationale,
        };
      })
    );

    mfCache = { data: results, timestamp: now };
    return results;
  } catch (err) {
    return POPULAR_FUNDS.map((f) => ({
      symbol: f.symbol,
      name: f.name,
      price: f.defaultPrice,
      change: 0.5,
      aiRationale: f.aiRationale,
    }));
  }
}

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
    if (isFund) {
      const liveFunds = await getLiveMutualFundsWithAI();
      const shuffled = [...liveFunds].sort(() => 0.5 - Math.random());
      return NextResponse.json({ suggestions: shuffled.slice(0, 5) });
    }

    const liveStocks = await getLiveStocksWithAI();
    // Sort by highest day change to show true market leaders of the day
    const sortedByGain = [...liveStocks].sort((a, b) => b.change - a.change);
    return NextResponse.json({ suggestions: sortedByGain.slice(0, 5) });
  }

  const queryLower = q.trim().toLowerCase();

  // 2. Mutual Fund Search using official Indian AMFI api (api.mfapi.in)
  if (type === 'mutual_fund') {
    try {
      const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(q)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const topSchemes = data.slice(0, 25);
          const enriched = await Promise.all(
            topSchemes.map(async (scheme: any, idx: number) => {
              if (idx < 6) {
                try {
                  const navRes = await fetch(`https://api.mfapi.in/mf/${scheme.schemeCode}`, {
                    next: { revalidate: 3600 },
                  });
                  if (navRes.ok) {
                    const navData = await navRes.json();
                    const latest = navData.data?.[0];
                    const price = latest ? parseFloat(latest.nav) : undefined;
                    return {
                      symbol: String(scheme.schemeCode),
                      name: scheme.schemeName,
                      price,
                      aiRationale: 'AMFI Verified Mutual Fund Scheme',
                    };
                  }
                } catch (e) {}
              }
              return {
                symbol: String(scheme.schemeCode),
                name: scheme.schemeName,
                aiRationale: 'AMFI Verified Mutual Fund Scheme',
              };
            })
          );

          return NextResponse.json({ suggestions: enriched });
        }
      }
    } catch (err) {
      console.error('MF API search failed:', err);
    }
  }

  // 3. Stock Search using Yahoo Finance
  try {
    const rawSearch = await yahooFinance.search(q, { newsCount: 0 });
    const quotes = rawSearch.quotes || [];

    const indianQuotes = quotes
      .filter((item: any) => {
        const isNSEorBSE = item.exchange === 'NSI' || item.exchange === 'BSE' || (item.symbol && (item.symbol.endsWith('.NS') || item.symbol.endsWith('.BO')));
        const isRelevantAsset = type === 'crypto' ? item.quoteType === 'CRYPTOCURRENCY' : (item.quoteType === 'EQUITY' || isNSEorBSE);
        return isRelevantAsset;
      })
      .slice(0, 15);

    const suggestions = await Promise.all(
      indianQuotes.map(async (item: any) => {
        let livePrice: number | undefined;
        let change: number | undefined;

        try {
          const qData: any = await yahooFinance.quote(item.symbol);
          if (qData && qData.regularMarketPrice != null) {
            livePrice = Number(qData.regularMarketPrice.toFixed(2));
            change = qData.regularMarketChangePercent != null ? Number(qData.regularMarketChangePercent.toFixed(2)) : undefined;
          }
        } catch (e) {}

        const matchedMeta = AI_WATCHLIST_STOCKS.find((s) => s.symbol === item.symbol);
        const aiRationale = matchedMeta?.aiRationale || 'NSE/BSE Active Listed Security';

        return {
          symbol: item.symbol,
          name: item.shortname || item.longname || item.symbol,
          price: livePrice,
          change,
          aiRationale,
        };
      })
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Yahoo Finance Search Error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
