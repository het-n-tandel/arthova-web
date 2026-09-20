/**
 * QVM (Quality, Valuation, Momentum) Quantitative Scoring Engine
 * Institutional-grade factor scoring based on Fama-French, Piotroski (2000),
 * and MSCI Factor Investing Methodologies for Indian Equities.
 */

export type MarketCapCategory = 'Large Cap' | 'Mid Cap' | 'Small Cap';

export interface FactorBreakdown {
  qualityScore: number;       // 0 - 100 (ROE, ROCE, D/E, FCF)
  valuationScore: number;     // 0 - 100 (P/E vs 5Y Median, Earnings Yield, PEG)
  momentumScore: number;      // 0 - 100 (3M/6M Price Trend, 50DMA/200DMA)
  piotroskiFScore: number;    // 0 - 9 (Stanford Accounting Checkpoints)
  altmanZone: 'Safe' | 'Grey' | 'Distress';
  compositeQVM: number;       // 0 - 100 Weighted Factor Composite
  rating: 'Strong Buy / Quality Alpha' | 'Attractive Accumulate' | 'Fair Value / Neutral' | 'Caution / Overextended';
  ratingColor: string;
}

export interface StockFactorData {
  symbol: string;
  name: string;
  category: MarketCapCategory;
  sector: string;
  marketCapCr: number;
  pe: number;
  industryPE: number;
  roe: number;        // Return on Equity %
  roce: number;       // Return on Capital Employed %
  debtToEquity: number;
  piotroskiFScore: number; // 0-9
  altmanZScore: number;
  momentum3M: number; // 3-month return %
  momentum6M: number; // 6-month return %
  factorBreakdown: FactorBreakdown;
  analystSummary: string;
}

// Factor weights used by institutional PMS quant strategies:
// Quality: 40% (Foundation & Downside Protection)
// Valuation: 30% (Margin of Safety)
// Momentum: 30% (Trend & Relative Strength)
export function computeQVMScore(data: {
  roe: number;
  roce: number;
  debtToEquity: number;
  piotroskiFScore: number;
  altmanZScore: number;
  pe: number;
  industryPE: number;
  momentum3M: number;
  momentum6M: number;
}): FactorBreakdown {
  // 1. QUALITY SCORE (0 - 100)
  // Higher ROE/ROCE, lower D/E, high Piotroski, safe Altman
  let qScore = 0;
  // ROE component (max 25 pts)
  qScore += Math.min(25, Math.max(0, (data.roe / 20) * 25));
  // ROCE component (max 25 pts)
  qScore += Math.min(25, Math.max(0, (data.roce / 25) * 25));
  // Leverage safety (max 20 pts): D/E < 0.3 = 20 pts, D/E > 1.5 = 0 pts
  const deScore = Math.max(0, 20 * (1 - Math.min(1, data.debtToEquity / 1.5)));
  qScore += deScore;
  // Piotroski component (max 20 pts: 9 pts -> 20 pts)
  qScore += (data.piotroskiFScore / 9) * 20;
  // Altman Z component (max 10 pts: > 3 is safe)
  qScore += data.altmanZScore >= 3.0 ? 10 : data.altmanZScore >= 1.8 ? 5 : 0;
  const qualityScore = Math.round(Math.min(100, Math.max(0, qScore)));

  // 2. VALUATION SCORE (0 - 100)
  // Cheaper relative to industry PE & reasonable absolute PE
  let vScore = 50;
  if (data.industryPE > 0 && data.pe > 0) {
    const peRatio = data.pe / data.industryPE;
    if (peRatio <= 0.75) vScore = 90;       // Discount > 25%
    else if (peRatio <= 0.95) vScore = 75;  // Discount 5-25%
    else if (peRatio <= 1.15) vScore = 55;  // Fair value
    else if (peRatio <= 1.4) vScore = 35;   // Premium
    else vScore = 20;                       // Overvalued
  }
  // Absolute PE guardrail
  if (data.pe > 60) vScore = Math.min(vScore, 30);
  const valuationScore = Math.round(vScore);

  // 3. MOMENTUM SCORE (0 - 100)
  // Positive 3M and 6M returns vs benchmark (Nifty historical baseline ~3% per 3M)
  let mScore = 50;
  const avgMomentum = (data.momentum3M * 0.4) + (data.momentum6M * 0.6);
  if (avgMomentum >= 20) mScore = 95;
  else if (avgMomentum >= 10) mScore = 80;
  else if (avgMomentum >= 3) mScore = 65;
  else if (avgMomentum >= -5) mScore = 45;
  else mScore = 25;
  const momentumScore = Math.round(mScore);

  // 4. COMPOSITE QVM
  const compositeQVM = Math.round(
    qualityScore * 0.40 + valuationScore * 0.30 + momentumScore * 0.30
  );

  const altmanZone: 'Safe' | 'Grey' | 'Distress' = 
    data.altmanZScore >= 2.9 ? 'Safe' : data.altmanZScore >= 1.8 ? 'Grey' : 'Distress';

  let rating: 'Strong Buy / Quality Alpha' | 'Attractive Accumulate' | 'Fair Value / Neutral' | 'Caution / Overextended';
  let ratingColor: string;

  if (compositeQVM >= 80) {
    rating = 'Strong Buy / Quality Alpha';
    ratingColor = 'text-positive bg-positive/10 border-positive/30';
  } else if (compositeQVM >= 65) {
    rating = 'Attractive Accumulate';
    ratingColor = 'text-accent-brass bg-accent-brass/10 border-accent-brass/30';
  } else if (compositeQVM >= 50) {
    rating = 'Fair Value / Neutral';
    ratingColor = 'text-text-secondary bg-bg-surface-2 border-border-default';
  } else {
    rating = 'Caution / Overextended';
    ratingColor = 'text-warning bg-warning/10 border-warning/30';
  }

  return {
    qualityScore,
    valuationScore,
    momentumScore,
    piotroskiFScore: data.piotroskiFScore,
    altmanZone,
    compositeQVM,
    rating,
    ratingColor,
  };
}

// Curated database of prominent Indian stocks with institutional factor metrics
export const INDIAN_EQUITY_FACTOR_REGISTRY: Record<string, Omit<StockFactorData, 'factorBreakdown'> & { factorData: Parameters<typeof computeQVMScore>[0] }> = {
  // --- LARGE CAP (Top 100) ---
  'RELIANCE.NS': {
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries Ltd',
    category: 'Large Cap',
    sector: 'Energy & Retail',
    marketCapCr: 2020000,
    pe: 27.4,
    industryPE: 24.5,
    roe: 10.5,
    roce: 11.2,
    debtToEquity: 0.38,
    piotroskiFScore: 8,
    altmanZScore: 3.4,
    momentum3M: 4.8,
    momentum6M: 11.2,
    analystSummary: 'Dominant integrated cash engine; telecom ARPU surge and clean balance sheet.',
    factorData: { roe: 10.5, roce: 11.2, debtToEquity: 0.38, piotroskiFScore: 8, altmanZScore: 3.4, pe: 27.4, industryPE: 24.5, momentum3M: 4.8, momentum6M: 11.2 }
  },
  'TCS.NS': {
    symbol: 'TCS.NS',
    name: 'Tata Consultancy Services',
    category: 'Large Cap',
    sector: 'Information Technology',
    marketCapCr: 1540000,
    pe: 31.8,
    industryPE: 33.2,
    roe: 51.2,
    roce: 64.8,
    debtToEquity: 0.05,
    piotroskiFScore: 9,
    altmanZScore: 11.5,
    momentum3M: 2.1,
    momentum6M: 9.4,
    analystSummary: 'Pinnacle Quality factor with industry-leading 50%+ ROE and near zero debt.',
    factorData: { roe: 51.2, roce: 64.8, debtToEquity: 0.05, piotroskiFScore: 9, altmanZScore: 11.5, pe: 31.8, industryPE: 33.2, momentum3M: 2.1, momentum6M: 9.4 }
  },
  'HDFCBANK.NS': {
    symbol: 'HDFCBANK.NS',
    name: 'HDFC Bank Ltd',
    category: 'Large Cap',
    sector: 'Banking & Financials',
    marketCapCr: 1250000,
    pe: 18.9,
    industryPE: 19.5,
    roe: 16.8,
    roce: 18.1,
    debtToEquity: 0.85,
    piotroskiFScore: 8,
    altmanZScore: 3.1,
    momentum3M: 3.2,
    momentum6M: 8.5,
    analystSummary: 'Exceptional credit quality, low NPA ratio, and post-merger deposit expansion.',
    factorData: { roe: 16.8, roce: 18.1, debtToEquity: 0.85, piotroskiFScore: 8, altmanZScore: 3.1, pe: 18.9, industryPE: 19.5, momentum3M: 3.2, momentum6M: 8.5 }
  },
  'INFY.NS': {
    symbol: 'INFY.NS',
    name: 'Infosys Ltd',
    category: 'Large Cap',
    sector: 'Information Technology',
    marketCapCr: 760000,
    pe: 27.5,
    industryPE: 33.2,
    roe: 31.8,
    roce: 40.2,
    debtToEquity: 0.08,
    piotroskiFScore: 8,
    altmanZScore: 8.9,
    momentum3M: 5.6,
    momentum6M: 14.1,
    analystSummary: 'High free cash flow conversion and strong enterprise cloud/AI deal signings.',
    factorData: { roe: 31.8, roce: 40.2, debtToEquity: 0.08, piotroskiFScore: 8, altmanZScore: 8.9, pe: 27.5, industryPE: 33.2, momentum3M: 5.6, momentum6M: 14.1 }
  },
  'ICICIBANK.NS': {
    symbol: 'ICICIBANK.NS',
    name: 'ICICI Bank Ltd',
    category: 'Large Cap',
    sector: 'Banking & Financials',
    marketCapCr: 880000,
    pe: 17.6,
    industryPE: 19.5,
    roe: 18.4,
    roce: 19.8,
    debtToEquity: 0.78,
    piotroskiFScore: 9,
    altmanZScore: 3.2,
    momentum3M: 4.1,
    momentum6M: 12.8,
    analystSummary: 'Industry benchmark for Net Interest Margins (NIM) and pristine retail asset quality.',
    factorData: { roe: 18.4, roce: 19.8, debtToEquity: 0.78, piotroskiFScore: 9, altmanZScore: 3.2, pe: 17.6, industryPE: 19.5, momentum3M: 4.1, momentum6M: 12.8 }
  },
  'ITC.NS': {
    symbol: 'ITC.NS',
    name: 'ITC Ltd',
    category: 'Large Cap',
    sector: 'FMCG',
    marketCapCr: 620000,
    pe: 28.2,
    industryPE: 44.0,
    roe: 28.6,
    roce: 38.2,
    debtToEquity: 0.01,
    piotroskiFScore: 9,
    altmanZScore: 12.0,
    momentum3M: 1.8,
    momentum6M: 6.2,
    analystSummary: 'Impenetrable FMCG moat, debt-free fortress, and attractive 3.5% dividend yield.',
    factorData: { roe: 28.6, roce: 38.2, debtToEquity: 0.01, piotroskiFScore: 9, altmanZScore: 12.0, pe: 28.2, industryPE: 44.0, momentum3M: 1.8, momentum6M: 6.2 }
  },

  // --- MID CAP (101st - 250th) ---
  'TATAMOTORS.NS': {
    symbol: 'TATAMOTORS.NS',
    name: 'Tata Motors Ltd',
    category: 'Mid Cap',
    sector: 'Automobile',
    marketCapCr: 350000,
    pe: 14.2,
    industryPE: 26.5,
    roe: 29.5,
    roce: 22.1,
    debtToEquity: 0.55,
    piotroskiFScore: 8,
    altmanZScore: 3.8,
    momentum3M: 8.4,
    momentum6M: 26.5,
    analystSummary: 'High Momentum + Deep Value; market-leading EV share and JLR margin expansion.',
    factorData: { roe: 29.5, roce: 22.1, debtToEquity: 0.55, piotroskiFScore: 8, altmanZScore: 3.8, pe: 14.2, industryPE: 26.5, momentum3M: 8.4, momentum6M: 26.5 }
  },
  'POLYCAB.NS': {
    symbol: 'POLYCAB.NS',
    name: 'Polycab India Ltd',
    category: 'Mid Cap',
    sector: 'Capital Goods & Cables',
    marketCapCr: 98000,
    pe: 42.0,
    industryPE: 45.0,
    roe: 22.4,
    roce: 28.9,
    debtToEquity: 0.04,
    piotroskiFScore: 8,
    altmanZScore: 7.2,
    momentum3M: 6.5,
    momentum6M: 18.2,
    analystSummary: 'National infrastructure capex beneficiary with 25%+ market share in cables.',
    factorData: { roe: 22.4, roce: 28.9, debtToEquity: 0.04, piotroskiFScore: 8, altmanZScore: 7.2, pe: 42.0, industryPE: 45.0, momentum3M: 6.5, momentum6M: 18.2 }
  },
  'PERSISTENT.NS': {
    symbol: 'PERSISTENT.NS',
    name: 'Persistent Systems Ltd',
    category: 'Mid Cap',
    sector: 'Information Technology',
    marketCapCr: 78000,
    pe: 51.0,
    industryPE: 33.2,
    roe: 25.1,
    roce: 31.4,
    debtToEquity: 0.12,
    piotroskiFScore: 8,
    altmanZScore: 8.1,
    momentum3M: 9.8,
    momentum6M: 28.4,
    analystSummary: 'High-growth mid-cap tech with 18% dollar revenue CAGR; premium valuation.',
    factorData: { roe: 25.1, roce: 31.4, debtToEquity: 0.12, piotroskiFScore: 8, altmanZScore: 8.1, pe: 51.0, industryPE: 33.2, momentum3M: 9.8, momentum6M: 28.4 }
  },

  // --- SMALL CAP (251st & Below) ---
  'CDSL.NS': {
    symbol: 'CDSL.NS',
    name: 'Central Depository Services Ltd',
    category: 'Small Cap',
    sector: 'Financial Market Infrastructure',
    marketCapCr: 32000,
    pe: 48.0,
    industryPE: 42.0,
    roe: 32.5,
    roce: 41.2,
    debtToEquity: 0.0,
    piotroskiFScore: 9,
    altmanZScore: 14.5,
    momentum3M: 12.5,
    momentum6M: 38.0,
    analystSummary: 'Virtual monopoly on Indian demat account creation; zero debt and 60%+ operating margins.',
    factorData: { roe: 32.5, roce: 41.2, debtToEquity: 0.0, piotroskiFScore: 9, altmanZScore: 14.5, pe: 48.0, industryPE: 42.0, momentum3M: 12.5, momentum6M: 38.0 }
  },
  'ANGELONE.NS': {
    symbol: 'ANGELONE.NS',
    name: 'Angel One Ltd',
    category: 'Small Cap',
    sector: 'FinTech & Broking',
    marketCapCr: 26000,
    pe: 19.8,
    industryPE: 25.0,
    roe: 42.8,
    roce: 49.5,
    debtToEquity: 0.45,
    piotroskiFScore: 8,
    altmanZScore: 4.8,
    momentum3M: 7.2,
    momentum6M: 19.4,
    analystSummary: 'Fastest growing digital broker; strong cash return on equity at reasonable 20x PE.',
    factorData: { roe: 42.8, roce: 49.5, debtToEquity: 0.45, piotroskiFScore: 8, altmanZScore: 4.8, pe: 19.8, industryPE: 25.0, momentum3M: 7.2, momentum6M: 19.4 }
  },
};

/**
 * Retrieves the full factor profile for a symbol or returns a derived profile.
 */
export function getStockFactorProfile(symbol: string): StockFactorData {
  const cleanSym = symbol.toUpperCase().replace('.NS', '') + '.NS';
  const registered = INDIAN_EQUITY_FACTOR_REGISTRY[cleanSym] || INDIAN_EQUITY_FACTOR_REGISTRY[symbol.toUpperCase()];

  if (registered) {
    return {
      ...registered,
      factorBreakdown: computeQVMScore(registered.factorData),
    };
  }

  // Fallback heuristic for unlisted/unregistered stocks
  const isLarge = ['NIFTY', 'SENSEX', 'BANK', 'HDFC', 'TCS', 'RELIANCE', 'INFY', 'ICICI', 'SBIN', 'ITC', 'L&T', 'BHARTI'].some(k => symbol.toUpperCase().includes(k));
  const isSmall = ['SUZLON', 'CDSL', 'ANGEL', 'ZOMATO', 'PAYTM', 'IDEA'].some(k => symbol.toUpperCase().includes(k));
  const category: MarketCapCategory = isLarge ? 'Large Cap' : isSmall ? 'Small Cap' : 'Mid Cap';

  const factorData = {
    roe: isLarge ? 18.0 : isSmall ? 12.0 : 15.0,
    roce: isLarge ? 22.0 : isSmall ? 14.0 : 18.0,
    debtToEquity: isLarge ? 0.3 : isSmall ? 0.8 : 0.5,
    piotroskiFScore: isLarge ? 8 : isSmall ? 6 : 7,
    altmanZScore: isLarge ? 4.5 : isSmall ? 2.5 : 3.2,
    pe: 25.0,
    industryPE: 24.0,
    momentum3M: 4.0,
    momentum6M: 10.0,
  };

  return {
    symbol,
    name: symbol.replace('.NS', ''),
    category,
    sector: isLarge ? 'Bluechip Diversified' : 'Emerging Growth',
    marketCapCr: isLarge ? 500000 : isSmall ? 15000 : 80000,
    pe: 25.0,
    industryPE: 24.0,
    roe: factorData.roe,
    roce: factorData.roce,
    debtToEquity: factorData.debtToEquity,
    piotroskiFScore: factorData.piotroskiFScore,
    altmanZScore: factorData.altmanZScore,
    momentum3M: 4.0,
    momentum6M: 10.0,
    factorBreakdown: computeQVMScore(factorData),
    analystSummary: `Systematic factor analysis based on ${category} category benchmark standards.`,
  };
}
