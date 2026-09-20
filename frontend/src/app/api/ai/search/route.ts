import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { getStockFactorProfile } from '@/lib/factor-scoring';

const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical', 'yahooSurvey'] });

interface AIStockMeta {
  symbol: string;
  name: string;
  aiRationale: string;
  defaultPrice: number;
  defaultChange: number;
}

const AI_WATCHLIST_STOCKS: AIStockMeta[] = [
  // Large Cap
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd', aiRationale: 'Large Cap: Free Cash Flow & Energy/Retail Leadership', defaultPrice: 2980.50, defaultChange: 1.45 },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', aiRationale: 'Large Cap: High Return on Equity (51%) & Pristine Quality', defaultPrice: 4250.00, defaultChange: 0.92 },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', aiRationale: 'Large Cap: Credit Expansion & Low NPA Quality Banking', defaultPrice: 1640.20, defaultChange: 0.78 },
  { symbol: 'INFY.NS', name: 'Infosys Ltd', aiRationale: 'Large Cap: Cloud AI Deal Pipeline & Strong Dividends', defaultPrice: 1820.75, defaultChange: 1.85 },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd', aiRationale: 'Large Cap: High Net Interest Margin & Retail Growth', defaultPrice: 1210.30, defaultChange: 1.20 },
  { symbol: 'ITC.NS', name: 'ITC Ltd', aiRationale: 'Large Cap: Defensive FMCG Moat & High Dividend Yield', defaultPrice: 495.20, defaultChange: 0.55 },
  // Mid Cap
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors Ltd', aiRationale: 'Mid Cap: High Momentum + JLR Margin Turnaround', defaultPrice: 960.00, defaultChange: 3.40 },
  { symbol: 'POLYCAB.NS', name: 'Polycab India Ltd', aiRationale: 'Mid Cap: Capex Beneficiary with 28% ROCE Leadership', defaultPrice: 6580.00, defaultChange: 1.75 },
  { symbol: 'PERSISTENT.NS', name: 'Persistent Systems Ltd', aiRationale: 'Mid Cap: High-Growth Mid-Cap Tech & Enterprise AI', defaultPrice: 5120.00, defaultChange: 2.10 },
  // Small Cap
  { symbol: 'CDSL.NS', name: 'Central Depository Services Ltd', aiRationale: 'Small Cap: Monopoly Demat Infrastructure & Zero Debt', defaultPrice: 1540.00, defaultChange: 2.80 },
  { symbol: 'ANGELONE.NS', name: 'Angel One Ltd', aiRationale: 'Small Cap: 42% ROE Digital FinTech at Fair 20x PE', defaultPrice: 2850.00, defaultChange: 1.90 },
];

const TOP_PERFORMERS_STOCKS = [
  { symbol: 'CDSL.NS', name: 'Central Depository Services Ltd', performerTag: '🚀 Small Cap Alpha (+2.80%) • 9/9 Piotroski', defaultPrice: 1540.00, defaultChange: 2.80 },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors Ltd', performerTag: '🔥 Mid Cap Leader (+3.40%) • High Momentum', defaultPrice: 960.00, defaultChange: 3.40 },
  { symbol: 'PERSISTENT.NS', name: 'Persistent Systems Ltd', performerTag: '⚡ Mid Cap Tech (+2.10%) • High Growth', defaultPrice: 5120.00, defaultChange: 2.10 },
  { symbol: 'INFY.NS', name: 'Infosys Ltd', performerTag: '💎 Large Cap AI Deal (+1.85%)', defaultPrice: 1820.75, defaultChange: 1.85 },
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd', performerTag: '🛡️ Large Cap Anchor (+1.45%)', defaultPrice: 2980.50, defaultChange: 1.45 },
  { symbol: 'ANGELONE.NS', name: 'Angel One Ltd', performerTag: '📈 Small Cap FinTech (+1.90%) • 42% ROE', defaultPrice: 2850.00, defaultChange: 1.90 },
];

const POPULAR_FUNDS = [
  { symbol: '122639', name: 'Parag Parikh Flexi Cap Fund - Direct Growth', aiRationale: 'AI Pick: Global Equity Alpha & Prudent Moat', defaultPrice: 82.45, defaultChange: 1.20 },
  { symbol: '125497', name: 'SBI Small Cap Fund - Direct Growth', aiRationale: 'AI Pick: High-Alpha Long-Term Compounding', defaultPrice: 168.20, defaultChange: 1.65 },
  { symbol: '118778', name: 'Nippon India Small Cap Fund - Direct Growth', aiRationale: 'AI Pick: High Sharpe Outperformer', defaultPrice: 174.30, defaultChange: 1.85 },
  { symbol: '120847', name: 'Quant Active Fund - Direct Growth', aiRationale: 'AI Pick: Predictive Dynamic Factor Allocation', defaultPrice: 380.10, defaultChange: 2.10 },
  { symbol: '120716', name: 'HDFC Mid-Cap Opportunities Fund - Direct Growth', aiRationale: 'AI Pick: Consistent Category Beta Defense', defaultPrice: 185.60, defaultChange: 1.40 },
];

const TOP_PERFORMERS_FUNDS = [
  { symbol: '118778', name: 'Nippon India Small Cap Fund - Direct Growth', performerTag: '🔥 1Y Return: 41.5% • Category Alpha', defaultPrice: 174.30, defaultChange: 1.85 },
  { symbol: '120847', name: 'Quant Active Fund - Direct Growth', performerTag: '🚀 1Y Return: 38.9% • High Momentum', defaultPrice: 380.10, defaultChange: 2.10 },
  { symbol: '125497', name: 'SBI Small Cap Fund - Direct Growth', performerTag: '📈 3Y Return: 26.8% • Low Volatility', defaultPrice: 168.20, defaultChange: 1.65 },
  { symbol: '120716', name: 'HDFC Mid-Cap Opportunities Fund - Direct Growth', performerTag: '🛡️ 3Y Return: 29.4% • Bluechip Quality', defaultPrice: 185.60, defaultChange: 1.40 },
  { symbol: '122639', name: 'Parag Parikh Flexi Cap Fund - Direct Growth', performerTag: '⭐ 1Y Return: 34.2% • 5-Star Value', defaultPrice: 82.45, defaultChange: 1.20 },
];

const CRYPTO_DATA = {
  suggestions: [
    { symbol: 'BTC-USD', name: 'Bitcoin (BTC)', aiRationale: 'AI Pick: Store of Value & Institutional ETF Inflows', price: 5850000.00, change: 3.45 },
    { symbol: 'ETH-USD', name: 'Ethereum (ETH)', aiRationale: 'AI Pick: Layer-1 Smart Contract Staking Dominance', price: 282000.00, change: 2.80 },
    { symbol: 'SOL-USD', name: 'Solana (SOL)', aiRationale: 'AI Pick: High-Speed DeFi & Retail Consumer Breakout', price: 13200.00, change: 5.60 },
  ],
  topPerformers: [
    { symbol: 'SOL-USD', name: 'Solana (SOL)', performerTag: '🔥 +5.6% 24h Top Performer • High DEX Volume', price: 13200.00, change: 5.60 },
    { symbol: 'BTC-USD', name: 'Bitcoin (BTC)', performerTag: '🚀 +3.45% • Institutional ETF Net Inflows', price: 5850000.00, change: 3.45 },
    { symbol: 'ETH-USD', name: 'Ethereum (ETH)', performerTag: '⚡ +2.80% • Staking Supply Squeeze', price: 282000.00, change: 2.80 },
    { symbol: 'BNB-USD', name: 'Binance Coin (BNB)', performerTag: '📈 +2.10% • Ecosystem Burn Support', price: 48500.00, change: 2.10 },
  ],
};

const BOND_DATA = {
  suggestions: [
    { symbol: 'GOI-7.18-2033', name: '7.18% Government of India 2033', aiRationale: 'AI Pick: Sovereign Risk-Free Long Duration Benchmark', price: 100.00, change: 0.15 },
    { symbol: 'REC-7.85-2028', name: 'REC Ltd 7.85% Secured NCD', aiRationale: 'AI Pick: AAA PSU High Coupon Fixed Income Shield', price: 1000.00, change: 0.25 },
  ],
  topPerformers: [
    { symbol: 'HDFC-8.05-2029', name: 'HDFC Bank Tier-2 8.05% Bond', performerTag: '🔥 8.05% Yield to Maturity • AAA Rated', price: 1000.00, change: 0.35 },
    { symbol: 'REC-7.85-2028', name: 'REC Ltd 7.85% PSU Bond', performerTag: '🚀 7.85% Semi-Annual Yield • AAA PSU', price: 1000.00, change: 0.25 },
    { symbol: 'NHAI-7.60-2030', name: 'NHAI Tax-Free 7.60% Bond', performerTag: '🛡️ 7.60% Sovereign Backed Infrastructure', price: 1000.00, change: 0.20 },
    { symbol: 'GOI-7.18-2033', name: '7.18% Benchmark Sovereign G-Sec', performerTag: '🏛️ 7.18% Risk-Free 10-Yr Benchmark', price: 100.00, change: 0.15 },
  ],
};

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
          const q: any = await yahooFinance.quote(sym);
          return { symbol: sym, quote: q };
        } catch (e) {
          return { symbol: sym, quote: null };
        }
      })
    );

    const enriched = AI_WATCHLIST_STOCKS.map((meta) => {
      const match: any = quotes.find((q) => q.symbol === meta.symbol)?.quote;
      const price = match?.regularMarketPrice ?? meta.defaultPrice;
      let change = meta.defaultChange;
      if (match) {
        if (match.regularMarketChangePercent != null) {
          change = Number(match.regularMarketChangePercent.toFixed(2));
        } else if (match.regularMarketPrice && match.regularMarketPreviousClose) {
          change = Number((((match.regularMarketPrice - match.regularMarketPreviousClose) / match.regularMarketPreviousClose) * 100).toFixed(2));
        }
      }

      const profile = getStockFactorProfile(meta.symbol);

      return {
        symbol: meta.symbol,
        name: meta.name,
        price: Number(price.toFixed(2)),
        change,
        aiRationale: meta.aiRationale,
        category: profile.category,
        sector: profile.sector,
        factorData: {
          compositeQVM: profile.factorBreakdown.compositeQVM,
          rating: profile.factorBreakdown.rating,
          ratingColor: profile.factorBreakdown.ratingColor,
          qualityScore: profile.factorBreakdown.qualityScore,
          valuationScore: profile.factorBreakdown.valuationScore,
          momentumScore: profile.factorBreakdown.momentumScore,
          piotroskiFScore: profile.factorBreakdown.piotroskiFScore,
          altmanZone: profile.factorBreakdown.altmanZone,
        },
      };
    });

    stockCache = { data: enriched, timestamp: now };
    return enriched;
  } catch (err) {
    console.error('Failed to query live stocks:', err);
    return AI_WATCHLIST_STOCKS.map((s) => {
      const profile = getStockFactorProfile(s.symbol);
      return {
        symbol: s.symbol,
        name: s.name,
        price: s.defaultPrice,
        change: s.defaultChange,
        aiRationale: s.aiRationale,
        category: profile.category,
        sector: profile.sector,
        factorData: {
          compositeQVM: profile.factorBreakdown.compositeQVM,
          rating: profile.factorBreakdown.rating,
          ratingColor: profile.factorBreakdown.ratingColor,
          qualityScore: profile.factorBreakdown.qualityScore,
          valuationScore: profile.factorBreakdown.valuationScore,
          momentumScore: profile.factorBreakdown.momentumScore,
          piotroskiFScore: profile.factorBreakdown.piotroskiFScore,
          altmanZone: profile.factorBreakdown.altmanZone,
        },
      };
    });
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
              change: fund.defaultChange,
              aiRationale: fund.aiRationale,
            };
          }
        } catch (e) {}
        return {
          symbol: fund.symbol,
          name: fund.name,
          price: fund.defaultPrice,
          change: fund.defaultChange,
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
      change: f.defaultChange,
      aiRationale: f.aiRationale,
    }));
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || '';

  if (!q.trim()) {
    return NextResponse.json({ suggestions: [], topPerformers: [] });
  }

  // 1. Auto-suggest pool query (used for suggested discoveries on modal opening)
  if (q.includes('suggest 5 random') || q.includes('suggest')) {
    if (type === 'crypto' || q.includes('cryptocurrencies')) {
      return NextResponse.json(CRYPTO_DATA);
    }
    if (type === 'bond' || q.includes('bonds')) {
      return NextResponse.json(BOND_DATA);
    }

    const isFund = q.includes('mutual funds') || type === 'mutual_fund';
    if (isFund) {
      const liveFunds = await getLiveMutualFundsWithAI();
      const suggestions = liveFunds.slice(0, 4);
      return NextResponse.json({
        suggestions,
        topPerformers: TOP_PERFORMERS_FUNDS,
      });
    }

    const liveStocks = await getLiveStocksWithAI();
    // 4 AI suggestions
    const suggestions = liveStocks.slice(0, 4);

    // Top performers with live quote prices
    const topPerformers = TOP_PERFORMERS_STOCKS.map((tp) => {
      const live = liveStocks.find((ls) => ls.symbol === tp.symbol);
      const profile = getStockFactorProfile(tp.symbol);
      return {
        ...tp,
        price: live?.price ?? tp.defaultPrice,
        change: live?.change ?? tp.defaultChange,
        category: profile.category,
        sector: profile.sector,
        factorData: {
          compositeQVM: profile.factorBreakdown.compositeQVM,
          rating: profile.factorBreakdown.rating,
          ratingColor: profile.factorBreakdown.ratingColor,
          qualityScore: profile.factorBreakdown.qualityScore,
          valuationScore: profile.factorBreakdown.valuationScore,
          momentumScore: profile.factorBreakdown.momentumScore,
          piotroskiFScore: profile.factorBreakdown.piotroskiFScore,
          altmanZone: profile.factorBreakdown.altmanZone,
        },
      };
    });

    return NextResponse.json({
      suggestions,
      topPerformers,
    });
  }

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

          return NextResponse.json({ suggestions: enriched, topPerformers: TOP_PERFORMERS_FUNDS });
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
      .slice(0, 8);

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
        const profile = type !== 'crypto' ? getStockFactorProfile(item.symbol) : null;

        return {
          symbol: item.symbol,
          name: item.shortname || item.longname || item.symbol,
          price: livePrice,
          change,
          aiRationale,
          ...(profile
            ? {
                category: profile.category,
                sector: profile.sector,
                factorData: {
                  compositeQVM: profile.factorBreakdown.compositeQVM,
                  rating: profile.factorBreakdown.rating,
                  ratingColor: profile.factorBreakdown.ratingColor,
                  qualityScore: profile.factorBreakdown.qualityScore,
                  valuationScore: profile.factorBreakdown.valuationScore,
                  momentumScore: profile.factorBreakdown.momentumScore,
                  piotroskiFScore: profile.factorBreakdown.piotroskiFScore,
                  altmanZone: profile.factorBreakdown.altmanZone,
                },
              }
            : {}),
        };
      })
    );

    return NextResponse.json({ suggestions, topPerformers: TOP_PERFORMERS_STOCKS });
  } catch (err) {
    console.error('Yahoo search error:', err);
    return NextResponse.json({ suggestions: [], topPerformers: [] });
  }
}
