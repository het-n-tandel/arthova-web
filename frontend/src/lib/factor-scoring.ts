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
  'ZOMATO.NS': {
    symbol: 'ZOMATO.NS',
    name: 'Zomato Ltd',
    category: 'Mid Cap',
    sector: 'Consumer Tech',
    marketCapCr: 245000,
    pe: 95.0,
    industryPE: 45.0,
    roe: 8.5,
    roce: 9.2,
    debtToEquity: 0.02,
    piotroskiFScore: 7,
    altmanZScore: 6.8,
    momentum3M: 18.5,
    momentum6M: 42.0,
    analystSummary: 'Explosive Blinkit quick-commerce dominance and profitable EBITDA turnaround; trades at growth premium.',
    factorData: { roe: 8.5, roce: 9.2, debtToEquity: 0.02, piotroskiFScore: 7, altmanZScore: 6.8, pe: 95.0, industryPE: 45.0, momentum3M: 18.5, momentum6M: 42.0 }
  },
  'HAL.NS': {
    symbol: 'HAL.NS',
    name: 'Hindustan Aeronautics Ltd',
    category: 'Large Cap',
    sector: 'Defense & Aerospace',
    marketCapCr: 310000,
    pe: 38.5,
    industryPE: 42.0,
    roe: 26.2,
    roce: 34.5,
    debtToEquity: 0.0,
    piotroskiFScore: 9,
    altmanZScore: 7.5,
    momentum3M: 11.2,
    momentum6M: 32.5,
    analystSummary: 'Sovereign defense manufacturing monopoly with multi-year order backlog, zero debt, and 30%+ ROCE.',
    factorData: { roe: 26.2, roce: 34.5, debtToEquity: 0.0, piotroskiFScore: 9, altmanZScore: 7.5, pe: 38.5, industryPE: 42.0, momentum3M: 11.2, momentum6M: 32.5 }
  },
  'BEL.NS': {
    symbol: 'BEL.NS',
    name: 'Bharat Electronics Ltd',
    category: 'Large Cap',
    sector: 'Defense Electronics',
    marketCapCr: 215000,
    pe: 44.0,
    industryPE: 42.0,
    roe: 24.8,
    roce: 32.1,
    debtToEquity: 0.0,
    piotroskiFScore: 9,
    altmanZScore: 8.1,
    momentum3M: 9.5,
    momentum6M: 28.2,
    analystSummary: 'High-margin defense radar & electronic warfare leader with zero debt and expanding defense capex.',
    factorData: { roe: 24.8, roce: 32.1, debtToEquity: 0.0, piotroskiFScore: 9, altmanZScore: 8.1, pe: 44.0, industryPE: 42.0, momentum3M: 9.5, momentum6M: 28.2 }
  },
  'SBIN.NS': {
    symbol: 'SBIN.NS',
    name: 'State Bank of India',
    category: 'Large Cap',
    sector: 'Banking & Financials',
    marketCapCr: 720000,
    pe: 10.5,
    industryPE: 16.5,
    roe: 17.5,
    roce: 18.2,
    debtToEquity: 0.92,
    piotroskiFScore: 8,
    altmanZScore: 2.9,
    momentum3M: 4.8,
    momentum6M: 14.5,
    analystSummary: 'India\'s anchor PSU bank; sub-1% net NPA, strong credit expansion, and attractive single-digit P/E valuation.',
    factorData: { roe: 17.5, roce: 18.2, debtToEquity: 0.92, piotroskiFScore: 8, altmanZScore: 2.9, pe: 10.5, industryPE: 16.5, momentum3M: 4.8, momentum6M: 14.5 }
  },
  'LT.NS': {
    symbol: 'LT.NS',
    name: 'Larsen & Toubro Ltd',
    category: 'Large Cap',
    sector: 'Infrastructure',
    marketCapCr: 490000,
    pe: 31.0,
    industryPE: 35.0,
    roe: 15.2,
    roce: 17.8,
    debtToEquity: 0.72,
    piotroskiFScore: 8,
    altmanZScore: 3.5,
    momentum3M: 3.8,
    momentum6M: 12.0,
    analystSummary: 'Primary corporate beneficiary of national infrastructure capex and international hydrocarbon orders.',
    factorData: { roe: 15.2, roce: 17.8, debtToEquity: 0.72, piotroskiFScore: 8, altmanZScore: 3.5, pe: 31.0, industryPE: 35.0, momentum3M: 3.8, momentum6M: 12.0 }
  },
  'BAJFINANCE.NS': {
    symbol: 'BAJFINANCE.NS',
    name: 'Bajaj Finance Ltd',
    category: 'Large Cap',
    sector: 'Banking & Financials',
    marketCapCr: 430000,
    pe: 28.5,
    industryPE: 26.0,
    roe: 22.1,
    roce: 24.5,
    debtToEquity: 1.1,
    piotroskiFScore: 8,
    altmanZScore: 3.4,
    momentum3M: 2.5,
    momentum6M: 8.4,
    analystSummary: 'Consumer lending franchise with dominant market share, 22%+ ROE, and omnichannel customer acquisition.',
    factorData: { roe: 22.1, roce: 24.5, debtToEquity: 1.1, piotroskiFScore: 8, altmanZScore: 3.4, pe: 28.5, industryPE: 26.0, momentum3M: 2.5, momentum6M: 8.4 }
  },
  'TITAN.NS': {
    symbol: 'TITAN.NS',
    name: 'Titan Company Ltd',
    category: 'Large Cap',
    sector: 'Consumer Discretionary',
    marketCapCr: 315000,
    pe: 72.0,
    industryPE: 48.0,
    roe: 31.2,
    roce: 38.5,
    debtToEquity: 0.28,
    piotroskiFScore: 8,
    altmanZScore: 6.8,
    momentum3M: 5.2,
    momentum6M: 15.8,
    analystSummary: 'Tata group flagship with unmatched consumer loyalty, high ROCE, and market share gains in jewellery.',
    factorData: { roe: 31.2, roce: 38.5, debtToEquity: 0.28, piotroskiFScore: 8, altmanZScore: 6.8, pe: 72.0, industryPE: 48.0, momentum3M: 5.2, momentum6M: 15.8 }
  },
  'SUZLON.NS': {
    symbol: 'SUZLON.NS',
    name: 'Suzlon Energy Ltd',
    category: 'Small Cap',
    sector: 'Renewable Energy',
    marketCapCr: 75000,
    pe: 58.0,
    industryPE: 42.0,
    roe: 22.0,
    roce: 26.5,
    debtToEquity: 0.05,
    piotroskiFScore: 8,
    altmanZScore: 4.2,
    momentum3M: 15.4,
    momentum6M: 45.2,
    analystSummary: 'Turnaround wind energy equipment leader; net-debt-free balance sheet with multi-gigawatt order pipeline.',
    factorData: { roe: 22.0, roce: 26.5, debtToEquity: 0.05, piotroskiFScore: 8, altmanZScore: 4.2, pe: 58.0, industryPE: 42.0, momentum3M: 15.4, momentum6M: 45.2 }
  },
  'BSE.NS': {
    symbol: 'BSE.NS',
    name: 'BSE Ltd',
    category: 'Mid Cap',
    sector: 'Financial Market Infrastructure',
    marketCapCr: 68000,
    pe: 45.0,
    industryPE: 38.0,
    roe: 28.4,
    roce: 36.2,
    debtToEquity: 0.0,
    piotroskiFScore: 9,
    altmanZScore: 11.2,
    momentum3M: 14.8,
    momentum6M: 52.0,
    analystSummary: 'Explosive derivatives volume surge, zero debt, high cash generation, and rising financialization tailwinds.',
    factorData: { roe: 28.4, roce: 36.2, debtToEquity: 0.0, piotroskiFScore: 9, altmanZScore: 11.2, pe: 45.0, industryPE: 38.0, momentum3M: 14.8, momentum6M: 52.0 }
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

/**
 * Returns all registered stocks in a market cap category, scored and sorted by QVM descending.
 */
export function getTopPicksByCategory(category: MarketCapCategory, minScore = 50): StockFactorData[] {
  return Object.values(INDIAN_EQUITY_FACTOR_REGISTRY)
    .filter(item => item.category === category)
    .map(item => ({
      ...item,
      factorBreakdown: computeQVMScore(item.factorData),
    }))
    .filter(item => item.factorBreakdown.compositeQVM >= minScore)
    .sort((a, b) => b.factorBreakdown.compositeQVM - a.factorBreakdown.compositeQVM);
}

/**
 * Returns the highest-scoring QVM stock for a given market cap category.
 */
export function getBestPickForMarketCap(category: MarketCapCategory): StockFactorData {
  const picks = getTopPicksByCategory(category, 0);
  if (picks.length > 0) return picks[0];
  return getStockFactorProfile(category === 'Large Cap' ? 'TCS.NS' : category === 'Mid Cap' ? 'POLYCAB.NS' : 'CDSL.NS');
}

/**
 * Returns all top QVM picks grouped by Large Cap, Mid Cap, and Small Cap.
 */
export function getAllPicksWithScores(): Record<MarketCapCategory, StockFactorData[]> {
  return {
    'Large Cap': getTopPicksByCategory('Large Cap', 0),
    'Mid Cap': getTopPicksByCategory('Mid Cap', 0),
    'Small Cap': getTopPicksByCategory('Small Cap', 0),
  };
}

// ============================================================
// INSTITUTIONAL MUTUAL FUNDS FACTOR REGISTRY
// ============================================================

export interface MutualFundFactorData {
  schemeCode: string;
  name: string;
  category: MarketCapCategory;
  fundHouse: string;
  aumCr: number;
  nav: number;
  expenseRatio: number; // % TER
  cagr3Y: number;       // % 3-Year Annualized Return
  cagr5Y: number;       // % 5-Year Annualized Return
  sharpeRatio: number;  // Risk-adjusted alpha
  alpha: number;        // Excess return vs Nifty
  beta: number;         // Relative volatility
  topHoldings: string[];
  factorBreakdown: FactorBreakdown;
  analystSummary: string;
}

export const INDIAN_MUTUAL_FUND_REGISTRY: Record<string, Omit<MutualFundFactorData, 'factorBreakdown'>> = {
  // --- LARGE CAP & FLEXI CAP MUTUAL FUNDS ---
  '122639': {
    schemeCode: '122639',
    name: 'Parag Parikh Flexi Cap Fund - Direct Growth',
    category: 'Large Cap',
    fundHouse: 'PPFAS Mutual Fund',
    aumCr: 68500,
    nav: 84.5,
    expenseRatio: 0.61,
    cagr3Y: 22.4,
    cagr5Y: 20.8,
    sharpeRatio: 1.58,
    alpha: 5.2,
    beta: 0.76,
    topHoldings: ['HDFC Bank', 'ITC Ltd', 'Alphabet Inc', 'Bajaj Holdings', 'TCS'],
    analystSummary: 'Pinnacle institutional stewardship with conservative cash allocation and global diversification.',
  },
  '120716': {
    schemeCode: '120716',
    name: 'UTI Nifty 50 Index Fund - Direct Growth',
    category: 'Large Cap',
    fundHouse: 'UTI Mutual Fund',
    aumCr: 19800,
    nav: 172.4,
    expenseRatio: 0.18,
    cagr3Y: 15.6,
    cagr5Y: 16.2,
    sharpeRatio: 1.18,
    alpha: 0.05,
    beta: 1.0,
    topHoldings: ['Reliance Industries', 'HDFC Bank', 'ICICI Bank', 'Infosys', 'TCS'],
    analystSummary: 'Ultra-low cost passive indexing capturing pure Indian GDP & bluechip expansion at 0.18% TER.',
  },
  '118834': {
    schemeCode: '118834',
    name: 'Mirae Asset Large Cap Fund - Direct Growth',
    category: 'Large Cap',
    fundHouse: 'Mirae Asset Mutual Fund',
    aumCr: 38200,
    nav: 114.2,
    expenseRatio: 0.54,
    cagr3Y: 16.9,
    cagr5Y: 17.4,
    sharpeRatio: 1.28,
    alpha: 2.1,
    beta: 0.92,
    topHoldings: ['ICICI Bank', 'Larsen & Toubro', 'Bharti Airtel', 'HDFC Bank', 'State Bank of India'],
    analystSummary: 'Consistent top-quartile active large cap fund with strict liquidity risk filters.',
  },

  // --- MID CAP MUTUAL FUNDS ---
  '118989': {
    schemeCode: '118989',
    name: 'Motilal Oswal Midcap Fund - Direct Growth',
    category: 'Mid Cap',
    fundHouse: 'Motilal Oswal AMC',
    aumCr: 15200,
    nav: 98.6,
    expenseRatio: 0.68,
    cagr3Y: 32.4,
    cagr5Y: 25.8,
    sharpeRatio: 1.88,
    alpha: 9.1,
    beta: 0.88,
    topHoldings: ['Polycab India', 'Trent Ltd', 'Persistent Systems', 'Coforge', 'Kalyan Jewellers'],
    analystSummary: 'High-conviction, QGLP (Quality, Growth, Longevity, Price) portfolio delivering 32% 3Y CAGR.',
  },
  '118955': {
    schemeCode: '118955',
    name: 'HDFC Mid-Cap Opportunities Fund - Direct Growth',
    category: 'Mid Cap',
    fundHouse: 'HDFC Mutual Fund',
    aumCr: 66400,
    nav: 184.2,
    expenseRatio: 0.75,
    cagr3Y: 27.2,
    cagr5Y: 23.4,
    sharpeRatio: 1.65,
    alpha: 5.6,
    beta: 0.89,
    topHoldings: ['Tata Motors', 'Federal Bank', 'Indian Hotels', 'Apollo Tyres', 'Bharat Electronics'],
    analystSummary: 'Largest and most resilient mid-cap fund in India with deep bottom-up industrial diversification.',
  },

  // --- SMALL CAP MUTUAL FUNDS ---
  '118778': {
    schemeCode: '118778',
    name: 'Nippon India Small Cap Fund - Direct Growth',
    category: 'Small Cap',
    fundHouse: 'Nippon India AMC',
    aumCr: 54000,
    nav: 168.9,
    expenseRatio: 0.68,
    cagr3Y: 29.8,
    cagr5Y: 27.2,
    sharpeRatio: 1.76,
    alpha: 7.2,
    beta: 0.84,
    topHoldings: ['Tube Investments', 'CDSL', 'Apar Industries', 'Karur Vysya Bank', 'Multi Commodity Exchange'],
    analystSummary: 'Market leader in small-cap alpha generation with high portfolio liquidity across 150+ holdings.',
  },
  '120828': {
    schemeCode: '120828',
    name: 'Quant Small Cap Fund - Direct Growth',
    category: 'Small Cap',
    fundHouse: 'Quant Mutual Fund',
    aumCr: 23500,
    nav: 242.0,
    expenseRatio: 0.74,
    cagr3Y: 34.6,
    cagr5Y: 32.1,
    sharpeRatio: 1.92,
    alpha: 10.8,
    beta: 1.05,
    topHoldings: ['Reliance Industries', 'Jio Financial', 'IRB Infrastructure', 'Adani Power', 'Bikaji Foods'],
    analystSummary: 'Proprietary Predictive Analytics (VLRT) engine capturing rapid sector rotation and momentum.',
  },
};

export function computeMFScore(data: Omit<MutualFundFactorData, 'factorBreakdown'>): FactorBreakdown {
  // 1. Quality (0-100): Sharpe Ratio (max 40 pts) + Alpha (max 30 pts) + Low Beta buffer (max 30 pts)
  const qScore = Math.min(100, Math.round(
    Math.min(40, (data.sharpeRatio / 1.8) * 40) +
    Math.min(30, (Math.max(0, data.alpha) / 8) * 30) +
    Math.min(30, Math.max(0, (1.2 - data.beta) / 0.5) * 30)
  ));

  // 2. Valuation / Cost Efficiency (0-100): Low Expense Ratio = High Score
  let vScore = 50;
  if (data.expenseRatio <= 0.25) vScore = 95;      // Index Funds (e.g. 0.18%)
  else if (data.expenseRatio <= 0.65) vScore = 82; // Low-cost active
  else if (data.expenseRatio <= 0.85) vScore = 70; // Standard active
  else vScore = 50;

  // 3. Momentum (0-100): 3Y and 5Y CAGR
  let mScore = 50;
  const avgCagr = (data.cagr3Y * 0.6) + (data.cagr5Y * 0.4);
  if (avgCagr >= 28) mScore = 95;
  else if (avgCagr >= 20) mScore = 85;
  else if (avgCagr >= 15) mScore = 72;
  else mScore = 55;

  const compositeQVM = Math.round(qScore * 0.40 + vScore * 0.30 + mScore * 0.30);
  const rating = compositeQVM >= 82 ? 'Strong Buy / Quality Alpha' : 'Attractive Accumulate';
  const ratingColor = compositeQVM >= 82 ? 'text-positive bg-positive/10 border-positive/30' : 'text-accent-brass bg-accent-brass/10 border-accent-brass/30';

  return {
    qualityScore: qScore,
    valuationScore: vScore,
    momentumScore: mScore,
    piotroskiFScore: 9, // Institutional proxy
    altmanZone: 'Safe',
    compositeQVM,
    rating,
    ratingColor,
  };
}

export function getTopMutualFundsByCategory(category: MarketCapCategory): MutualFundFactorData[] {
  return Object.values(INDIAN_MUTUAL_FUND_REGISTRY)
    .filter(item => item.category === category)
    .map(item => ({
      ...item,
      factorBreakdown: computeMFScore(item),
    }))
    .sort((a, b) => b.factorBreakdown.compositeQVM - a.factorBreakdown.compositeQVM);
}

export function getBestMutualFundForMarketCap(category: MarketCapCategory): MutualFundFactorData {
  const funds = getTopMutualFundsByCategory(category);
  return funds[0];
}

// ============================================================
// PERSONAL STOCK SUITABILITY CHECKER ENGINE
// ============================================================

export interface SuitabilityCheck {
  passed: boolean;
  status: 'passed' | 'warning' | 'alert';
  label: string;
  detail: string;
}

export interface StockSuitabilityResult {
  symbol: string;
  stockName: string;
  overallScore: number; // 0 - 100
  verdict: 'Highly Suitable' | 'Suitable with Caution' | 'High Risk / Unsuitable';
  verdictColor: string;
  verdictBadgeBg: string;
  checks: {
    riskProfile: SuitabilityCheck;
    concentration: SuitabilityCheck;
    horizon: SuitabilityCheck;
    quantQuality: SuitabilityCheck;
  };
  recommendation: string;
}

export function evaluateStockSuitability(
  stock: StockFactorData,
  profile?: {
    riskAppetite?: 'Low' | 'Medium' | 'High' | string;
    horizonYears?: number;
    primaryGoal?: string;
  },
  currentHoldings?: Array<{ symbol: string; quantity: number; avgCost: number; cmp?: number; assetType?: string }>
): StockSuitabilityResult {
  const risk = (profile?.riskAppetite || 'Medium').toLowerCase();
  const horizon = profile?.horizonYears || 10;
  const isConservative = risk.includes('low') || risk.includes('conservative');
  const isModerate = risk.includes('med') || risk.includes('mod');
  const isAggressive = risk.includes('high') || risk.includes('aggr');

  let suitabilityPoints = 0; // out of 100

  // 1. RISK APPETITE CHECK
  let riskCheck: SuitabilityCheck;
  if (stock.category === 'Large Cap') {
    suitabilityPoints += 30;
    riskCheck = {
      passed: true,
      status: 'passed',
      label: 'Risk Appetite Alignment',
      detail: `Bluechip Large-Cap profile provides foundational stability well-suited for ${isConservative ? 'Conservative' : isModerate ? 'Moderate' : 'Aggressive'} risk profiles.`
    };
  } else if (stock.category === 'Mid Cap') {
    if (isConservative) {
      suitabilityPoints += 15;
      riskCheck = {
        passed: false,
        status: 'warning',
        label: 'Risk Appetite Alignment',
        detail: `Mid-Cap volatility is moderately elevated compared to your Conservative risk profile; recommend limiting to max 15% satellite allocation.`
      };
    } else {
      suitabilityPoints += 30;
      riskCheck = {
        passed: true,
        status: 'passed',
        label: 'Risk Appetite Alignment',
        detail: `High-alpha Mid-Cap growth profile aligns with your ${isModerate ? 'Moderate' : 'Aggressive'} growth target.`
      };
    }
  } else {
    // Small Cap
    if (isConservative) {
      suitabilityPoints += 5;
      riskCheck = {
        passed: false,
        status: 'alert',
        label: 'Risk Appetite Alignment',
        detail: `Small-Cap high beta and drawdown risks exceed Conservative guardrails.`
      };
    } else if (isModerate) {
      suitabilityPoints += 20;
      riskCheck = {
        passed: true,
        status: 'warning',
        label: 'Risk Appetite Alignment',
        detail: `Small-Cap high beta is acceptable in small tactical allocations for Moderate profiles.`
      };
    } else {
      suitabilityPoints += 30;
      riskCheck = {
        passed: true,
        status: 'passed',
        label: 'Risk Appetite Alignment',
        detail: `High-conviction Small-Cap compounding perfectly matches an Aggressive risk profile.`
      };
    }
  }

  // 2. CONCENTRATION & SECTOR OVERLAP CHECK
  let concentrationCheck: SuitabilityCheck;
  const stockList = (currentHoldings || []).filter(h => (h.assetType === 'stock' || !h.assetType) && h.quantity > 0);
  const totalStockValue = stockList.reduce((acc, h) => acc + (h.cmp || h.avgCost || 0) * h.quantity, 0);
  const existingHolding = stockList.find(h => h.symbol.toUpperCase().replace('.NS', '') === stock.symbol.toUpperCase().replace('.NS', ''));

  if (existingHolding && totalStockValue > 0) {
    const existingVal = (existingHolding.cmp || existingHolding.avgCost || 0) * existingHolding.quantity;
    const currentPct = (existingVal / totalStockValue) * 100;
    if (currentPct > 10) {
      suitabilityPoints += 5;
      concentrationCheck = {
        passed: false,
        status: 'alert',
        label: 'Concentration Headroom',
        detail: `You already hold ${currentPct.toFixed(1)}% of your portfolio in this stock. Institutional limit is 10% per single equity.`
      };
    } else {
      suitabilityPoints += 25;
      concentrationCheck = {
        passed: true,
        status: 'passed',
        label: 'Concentration Headroom',
        detail: `Current exposure is ${currentPct.toFixed(1)}%. Substantial headroom remains under the 10% single-stock ceiling.`
      };
    }
  } else {
    suitabilityPoints += 25;
    concentrationCheck = {
      passed: true,
      status: 'passed',
      label: 'Concentration Headroom',
      detail: `Fresh diversification opportunity. You currently hold 0% direct exposure in this company.`
    };
  }

  // 3. GOAL HORIZON CHECK
  let horizonCheck: SuitabilityCheck;
  if (horizon < 3) {
    if (stock.category === 'Large Cap') {
      suitabilityPoints += 15;
      horizonCheck = {
        passed: true,
        status: 'warning',
        label: 'Goal Horizon Compatibility',
        detail: `Short horizon (< 3 yrs). Bluechip Large-Cap is acceptable, but consider prioritizing fixed income or debt for capital safety.`
      };
    } else {
      suitabilityPoints += 5;
      horizonCheck = {
        passed: false,
        status: 'alert',
        label: 'Goal Horizon Compatibility',
        detail: `Short horizon (< 3 yrs) is too brief to weather mid/small-cap drawdowns. Equities require a 5+ year runway.`
      };
    }
  } else if (horizon <= 7) {
    suitabilityPoints += 25;
    horizonCheck = {
      passed: true,
      status: 'passed',
      label: 'Goal Horizon Compatibility',
      detail: `Medium horizon (${horizon} yrs) allows sufficient time to capture multi-year business earnings compounding.`
    };
  } else {
    suitabilityPoints += 25;
    horizonCheck = {
      passed: true,
      status: 'passed',
      label: 'Goal Horizon Compatibility',
      detail: `Long-term compounding horizon (${horizon}+ yrs) is ideal for maximizing equity alpha and ignoring short-term drawdowns.`
    };
  }

  // 4. QUANTITATIVE FUNDAMENTAL QUALITY CHECK
  let qualityCheck: SuitabilityCheck;
  const qvm = stock.factorBreakdown.compositeQVM;
  const fScore = stock.piotroskiFScore;
  const isAltmanSafe = stock.factorBreakdown.altmanZone === 'Safe';

  if (qvm >= 70 && fScore >= 7 && isAltmanSafe) {
    suitabilityPoints += 20;
    qualityCheck = {
      passed: true,
      status: 'passed',
      label: 'Fundamental Quality & Safety',
      detail: `Pristine institutional fundamentals: Composite QVM ${qvm}/100, F-Score ${fScore}/9, and Altman Z Safe Zone.`
    };
  } else if (qvm >= 50 && isAltmanSafe) {
    suitabilityPoints += 12;
    qualityCheck = {
      passed: true,
      status: 'warning',
      label: 'Fundamental Quality & Safety',
      detail: `Acceptable factor profile (QVM: ${qvm}/100, F-Score: ${fScore}/9), but check valuation or momentum headwinds.`
    };
  } else {
    suitabilityPoints += 5;
    qualityCheck = {
      passed: false,
      status: 'alert',
      label: 'Fundamental Quality & Safety',
      detail: `Higher financial leverage or sub-par factor rating (QVM: ${qvm}/100, Altman: ${stock.factorBreakdown.altmanZone}).`
    };
  }

  const finalScore = Math.min(100, Math.max(10, suitabilityPoints));

  let verdict: 'Highly Suitable' | 'Suitable with Caution' | 'High Risk / Unsuitable';
  let verdictColor: string;
  let verdictBadgeBg: string;

  if (finalScore >= 80) {
    verdict = 'Highly Suitable';
    verdictColor = 'text-positive';
    verdictBadgeBg = 'bg-positive/10 border-positive/30 text-positive';
  } else if (finalScore >= 60) {
    verdict = 'Suitable with Caution';
    verdictColor = 'text-accent-brass';
    verdictBadgeBg = 'bg-accent-brass/10 border-accent-brass/30 text-accent-brass';
  } else {
    verdict = 'High Risk / Unsuitable';
    verdictColor = 'text-rose-400';
    verdictBadgeBg = 'bg-rose-500/10 border-rose-500/30 text-rose-400';
  }

  let summaryRecommendation = '';
  if (verdict === 'Highly Suitable') {
    summaryRecommendation = `${stock.name} is strongly aligned with your ${risk.toUpperCase()} risk profile and ${horizon}-year investment timeline. Its institutional QVM score of ${qvm}/100 and clean balance sheet provide superior risk-adjusted compounding.`;
  } else if (verdict === 'Suitable with Caution') {
    summaryRecommendation = `${stock.name} offers growth potential, but warrants a controlled position size. Monitor portfolio concentration and ensure it does not exceed 5–8% of total equity.`;
  } else {
    summaryRecommendation = `${stock.name} carries risk parameters (volatility, leverage, or concentration) that conflict with your current profile. We recommend reallocating towards large-cap compounders or diversified index funds.`;
  }

  return {
    symbol: stock.symbol,
    stockName: stock.name,
    overallScore: finalScore,
    verdict,
    verdictColor,
    verdictBadgeBg,
    checks: {
      riskProfile: riskCheck,
      concentration: concentrationCheck,
      horizon: horizonCheck,
      quantQuality: qualityCheck,
    },
    recommendation: summaryRecommendation,
  };
}
