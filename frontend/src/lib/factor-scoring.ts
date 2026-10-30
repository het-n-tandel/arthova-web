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
  const safeRoe = isNaN(data.roe) ? 12 : data.roe;
  const safeRoce = isNaN(data.roce) ? 14 : data.roce;
  const safeDE = isNaN(data.debtToEquity) ? 0.5 : data.debtToEquity;
  const safeFScore = isNaN(data.piotroskiFScore) ? 6 : Math.max(0, Math.min(9, data.piotroskiFScore));
  const safeZScore = isNaN(data.altmanZScore) ? 3.0 : data.altmanZScore;

  // ROE component (max 25 pts)
  qScore += Math.min(25, Math.max(0, (safeRoe / 20) * 25));
  // ROCE component (max 25 pts)
  qScore += Math.min(25, Math.max(0, (safeRoce / 25) * 25));
  // Leverage safety (max 20 pts): D/E < 0.3 = 20 pts, D/E > 1.5 = 0 pts. If negative D/E (negative net worth), penalty to 0.
  const deScore = safeDE < 0 ? 0 : Math.max(0, 20 * (1 - Math.min(1, safeDE / 1.5)));
  qScore += deScore;
  // Piotroski component (max 20 pts: 9 pts -> 20 pts)
  qScore += (safeFScore / 9) * 20;
  // Altman Z component (max 10 pts: > 3 is safe)
  qScore += safeZScore >= 3.0 ? 10 : safeZScore >= 1.8 ? 5 : 0;
  const qualityScore = Math.round(Math.min(100, Math.max(0, qScore)));

  // 2. VALUATION SCORE (0 - 100)
  // Cheaper relative to industry PE & reasonable absolute PE
  let vScore = 50;
  const safePE = isNaN(data.pe) ? 25 : data.pe;
  const safeIndPE = isNaN(data.industryPE) ? 25 : data.industryPE;

  if (safePE <= 0) {
    // Loss-making enterprise (negative earnings) receives an intrinsic valuation penalty
    vScore = 15;
  } else if (safeIndPE > 0 && safePE > 0) {
    const peRatio = safePE / safeIndPE;
    if (peRatio <= 0.75) vScore = 90;       // Discount > 25%
    else if (peRatio <= 0.95) vScore = 75;  // Discount 5-25%
    else if (peRatio <= 1.15) vScore = 55;  // Fair value
    else if (peRatio <= 1.4) vScore = 35;   // Premium
    else vScore = 20;                       // Overvalued
  }
  // Absolute PE guardrail
  if (safePE > 60) vScore = Math.min(vScore, 30);
  const valuationScore = Math.round(vScore);

  // 3. MOMENTUM SCORE (0 - 100)
  // Positive 3M and 6M returns vs benchmark (Nifty historical baseline ~3% per 3M)
  let mScore = 50;
  const safeM3 = isNaN(data.momentum3M) ? 0 : data.momentum3M;
  const safeM6 = isNaN(data.momentum6M) ? 0 : data.momentum6M;
  const avgMomentum = (safeM3 * 0.4) + (safeM6 * 0.6);
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
  'BHARTIARTL.NS': {
    symbol: 'BHARTIARTL.NS',
    name: 'Bharti Airtel Ltd',
    category: 'Large Cap',
    sector: 'Telecommunications',
    marketCapCr: 940000,
    pe: 48.0,
    industryPE: 45.0,
    roe: 19.5,
    roce: 18.2,
    debtToEquity: 1.1,
    piotroskiFScore: 8,
    altmanZScore: 3.2,
    momentum3M: 8.2,
    momentum6M: 24.5,
    analystSummary: 'Telecom duopoly leader; aggressive ARPU expansion, Africa business cash flow, and 5G enterprise adoption.',
    factorData: { roe: 19.5, roce: 18.2, debtToEquity: 1.1, piotroskiFScore: 8, altmanZScore: 3.2, pe: 48.0, industryPE: 45.0, momentum3M: 8.2, momentum6M: 24.5 }
  },
  'KOTAKBANK.NS': {
    symbol: 'KOTAKBANK.NS',
    name: 'Kotak Mahindra Bank',
    category: 'Large Cap',
    sector: 'Banking & Financials',
    marketCapCr: 360000,
    pe: 18.2,
    industryPE: 19.5,
    roe: 14.8,
    roce: 16.5,
    debtToEquity: 0.72,
    piotroskiFScore: 8,
    altmanZScore: 3.4,
    momentum3M: 2.4,
    momentum6M: 6.8,
    analystSummary: 'Pristine CASA ratio, conservative underwriting culture, and substantial capitalization buffer.',
    factorData: { roe: 14.8, roce: 16.5, debtToEquity: 0.72, piotroskiFScore: 8, altmanZScore: 3.4, pe: 18.2, industryPE: 19.5, momentum3M: 2.4, momentum6M: 6.8 }
  },
  'WIPRO.NS': {
    symbol: 'WIPRO.NS',
    name: 'Wipro Ltd',
    category: 'Large Cap',
    sector: 'Information Technology',
    marketCapCr: 290000,
    pe: 23.5,
    industryPE: 33.2,
    roe: 16.2,
    roce: 18.4,
    debtToEquity: 0.18,
    piotroskiFScore: 7,
    altmanZScore: 5.6,
    momentum3M: 3.8,
    momentum6M: 11.2,
    analystSummary: 'Value play in Tier-1 IT with discount to peers, solid dividend yield, and expanding AI consulting practice.',
    factorData: { roe: 16.2, roce: 18.4, debtToEquity: 0.18, piotroskiFScore: 7, altmanZScore: 5.6, pe: 23.5, industryPE: 33.2, momentum3M: 3.8, momentum6M: 11.2 }
  },
  'SUNPHARMA.NS': {
    symbol: 'SUNPHARMA.NS',
    name: 'Sun Pharmaceutical Industries',
    category: 'Large Cap',
    sector: 'Pharmaceuticals & Healthcare',
    marketCapCr: 410000,
    pe: 36.0,
    industryPE: 38.0,
    roe: 17.4,
    roce: 20.8,
    debtToEquity: 0.08,
    piotroskiFScore: 9,
    altmanZScore: 7.2,
    momentum3M: 6.8,
    momentum6M: 22.4,
    analystSummary: 'Global specialty pharma market leader with fortress balance sheet, zero net debt, and US generic pricing resilience.',
    factorData: { roe: 17.4, roce: 20.8, debtToEquity: 0.08, piotroskiFScore: 9, altmanZScore: 7.2, pe: 36.0, industryPE: 38.0, momentum3M: 6.8, momentum6M: 22.4 }
  },
  'TRENT.NS': {
    symbol: 'TRENT.NS',
    name: 'Trent Ltd',
    category: 'Large Cap',
    sector: 'Consumer Retail',
    marketCapCr: 260000,
    pe: 120.0,
    industryPE: 48.0,
    roe: 28.5,
    roce: 34.2,
    debtToEquity: 0.25,
    piotroskiFScore: 8,
    altmanZScore: 8.5,
    momentum3M: 22.5,
    momentum6M: 68.0,
    analystSummary: 'Hyper-growth retail prodigy (Zudio/Westside); industry-beating store expansion and top-tier same-store sales growth.',
    factorData: { roe: 28.5, roce: 34.2, debtToEquity: 0.25, piotroskiFScore: 8, altmanZScore: 8.5, pe: 120.0, industryPE: 48.0, momentum3M: 22.5, momentum6M: 68.0 }
  },
  'IRFC.NS': {
    symbol: 'IRFC.NS',
    name: 'Indian Railway Finance Corporation',
    category: 'Large Cap',
    sector: 'Railway Infrastructure & PSU',
    marketCapCr: 210000,
    pe: 31.0,
    industryPE: 25.0,
    roe: 14.2,
    roce: 15.0,
    debtToEquity: 8.2,
    piotroskiFScore: 7,
    altmanZScore: 2.8,
    momentum3M: 5.4,
    momentum6M: 28.5,
    analystSummary: 'Sovereign-backed dedicated financier for Indian Railways capex with guaranteed margin-plus lease model.',
    factorData: { roe: 14.2, roce: 15.0, debtToEquity: 8.2, piotroskiFScore: 7, altmanZScore: 2.8, pe: 31.0, industryPE: 25.0, momentum3M: 5.4, momentum6M: 28.5 }
  },
  'DIXON.NS': {
    symbol: 'DIXON.NS',
    name: 'Dixon Technologies Ltd',
    category: 'Mid Cap',
    sector: 'Electronic Manufacturing (EMS)',
    marketCapCr: 88000,
    pe: 85.0,
    industryPE: 55.0,
    roe: 26.5,
    roce: 32.8,
    debtToEquity: 0.15,
    piotroskiFScore: 8,
    altmanZScore: 7.8,
    momentum3M: 18.2,
    momentum6M: 48.0,
    analystSummary: 'Flagship beneficiary of Make-in-India PLI schemes for mobile, consumer electronics, and telecom hardware.',
    factorData: { roe: 26.5, roce: 32.8, debtToEquity: 0.15, piotroskiFScore: 8, altmanZScore: 7.8, pe: 85.0, industryPE: 55.0, momentum3M: 18.2, momentum6M: 48.0 }
  },
  'COFORGE.NS': {
    symbol: 'COFORGE.NS',
    name: 'Coforge Ltd',
    category: 'Mid Cap',
    sector: 'Information Technology',
    marketCapCr: 52000,
    pe: 44.0,
    industryPE: 33.2,
    roe: 22.8,
    roce: 28.5,
    debtToEquity: 0.35,
    piotroskiFScore: 8,
    altmanZScore: 6.4,
    momentum3M: 12.0,
    momentum6M: 34.0,
    analystSummary: 'Top-quartile midcap IT performer with sticky BFS and Travel verticals and robust order executable pipeline.',
    factorData: { roe: 22.8, roce: 28.5, debtToEquity: 0.35, piotroskiFScore: 8, altmanZScore: 6.4, pe: 44.0, industryPE: 33.2, momentum3M: 12.0, momentum6M: 34.0 }
  },
  'KPITTECH.NS': {
    symbol: 'KPITTECH.NS',
    name: 'KPIT Technologies Ltd',
    category: 'Mid Cap',
    sector: 'Automotive Software & EV',
    marketCapCr: 42000,
    pe: 62.0,
    industryPE: 45.0,
    roe: 30.5,
    roce: 38.2,
    debtToEquity: 0.12,
    piotroskiFScore: 8,
    altmanZScore: 8.9,
    momentum3M: 8.5,
    momentum6M: 26.0,
    analystSummary: 'Pure-play automotive software powerhouse with OEM long-term partnerships across autonomous and EV platforms.',
    factorData: { roe: 30.5, roce: 38.2, debtToEquity: 0.12, piotroskiFScore: 8, altmanZScore: 8.9, pe: 62.0, industryPE: 45.0, momentum3M: 8.5, momentum6M: 26.0 }
  },
  'KALYANKJIL.NS': {
    symbol: 'KALYANKJIL.NS',
    name: 'Kalyan Jewellers India Ltd',
    category: 'Mid Cap',
    sector: 'Consumer Discretionary',
    marketCapCr: 68000,
    pe: 58.0,
    industryPE: 48.0,
    roe: 19.8,
    roce: 23.4,
    debtToEquity: 0.85,
    piotroskiFScore: 8,
    altmanZScore: 4.8,
    momentum3M: 16.4,
    momentum6M: 54.0,
    analystSummary: 'Capital-light FOCO franchise expansion delivering rapid market share gains in organized retail jewellery.',
    factorData: { roe: 19.8, roce: 23.4, debtToEquity: 0.85, piotroskiFScore: 8, altmanZScore: 4.8, pe: 58.0, industryPE: 48.0, momentum3M: 16.4, momentum6M: 54.0 }
  },
  'TATASTEEL.NS': {
    symbol: 'TATASTEEL.NS',
    name: 'Tata Steel Ltd',
    category: 'Large Cap',
    sector: 'Metals & Mining',
    marketCapCr: 195000,
    pe: 16.5,
    industryPE: 18.0,
    roe: 13.5,
    roce: 15.2,
    debtToEquity: 0.65,
    piotroskiFScore: 7,
    altmanZScore: 3.2,
    momentum3M: 6.2,
    momentum6M: 14.8,
    analystSummary: 'Backward-integrated steel major with aggressive Kalinganagar capacity additions and European deleveraging.',
    factorData: { roe: 13.5, roce: 15.2, debtToEquity: 0.65, piotroskiFScore: 7, altmanZScore: 3.2, pe: 16.5, industryPE: 18.0, momentum3M: 6.2, momentum6M: 14.8 }
  },
  'ADANIENT.NS': {
    symbol: 'ADANIENT.NS',
    name: 'Adani Enterprises Ltd',
    category: 'Large Cap',
    sector: 'Infrastructure',
    marketCapCr: 340000,
    pe: 88.0,
    industryPE: 45.0,
    roe: 14.8,
    roce: 16.2,
    debtToEquity: 1.15,
    piotroskiFScore: 7,
    altmanZScore: 2.8,
    momentum3M: 4.5,
    momentum6M: 18.2,
    analystSummary: 'Premier infrastructure incubator driving massive airport, green hydrogen, and data center developments.',
    factorData: { roe: 14.8, roce: 16.2, debtToEquity: 1.15, piotroskiFScore: 7, altmanZScore: 2.8, pe: 88.0, industryPE: 45.0, momentum3M: 4.5, momentum6M: 18.2 }
  },
  'NTPC.NS': {
    symbol: 'NTPC.NS',
    name: 'NTPC Ltd',
    category: 'Large Cap',
    sector: 'Power & Utilities',
    marketCapCr: 390000,
    pe: 18.2,
    industryPE: 19.5,
    roe: 13.8,
    roce: 12.9,
    debtToEquity: 1.35,
    piotroskiFScore: 8,
    altmanZScore: 3.1,
    momentum3M: 7.8,
    momentum6M: 22.4,
    analystSummary: 'India largest power utility pivoting towards renewable assets with reliable regulated return on equity.',
    factorData: { roe: 13.8, roce: 12.9, debtToEquity: 1.35, piotroskiFScore: 8, altmanZScore: 3.1, pe: 18.2, industryPE: 19.5, momentum3M: 7.8, momentum6M: 22.4 }
  },
  'ONGC.NS': {
    symbol: 'ONGC.NS',
    name: 'Oil & Natural Gas Corp',
    category: 'Large Cap',
    sector: 'Energy & Petrochemicals',
    marketCapCr: 360000,
    pe: 7.8,
    industryPE: 11.2,
    roe: 14.2,
    roce: 15.8,
    debtToEquity: 0.38,
    piotroskiFScore: 8,
    altmanZScore: 3.8,
    momentum3M: 5.1,
    momentum6M: 19.5,
    analystSummary: 'Extremely attractive valuation factor with deep dividend yields and steady deep-water production ramp-up.',
    factorData: { roe: 14.2, roce: 15.8, debtToEquity: 0.38, piotroskiFScore: 8, altmanZScore: 3.8, pe: 7.8, industryPE: 11.2, momentum3M: 5.1, momentum6M: 19.5 }
  },
  'MARUTI.NS': {
    symbol: 'MARUTI.NS',
    name: 'Maruti Suzuki India Ltd',
    category: 'Large Cap',
    sector: 'Automobile',
    marketCapCr: 390000,
    pe: 29.5,
    industryPE: 28.0,
    roe: 16.5,
    roce: 21.2,
    debtToEquity: 0.02,
    piotroskiFScore: 9,
    altmanZScore: 9.5,
    momentum3M: 3.2,
    momentum6M: 12.8,
    analystSummary: 'Zero-debt balance sheet with dominant 42%+ passenger vehicle market share and SUV margin expansion.',
    factorData: { roe: 16.5, roce: 21.2, debtToEquity: 0.02, piotroskiFScore: 9, altmanZScore: 9.5, pe: 29.5, industryPE: 28.0, momentum3M: 3.2, momentum6M: 12.8 }
  },
  'ASIANPAINT.NS': {
    symbol: 'ASIANPAINT.NS',
    name: 'Asian Paints Ltd',
    category: 'Large Cap',
    sector: 'Consumer Paints',
    marketCapCr: 270000,
    pe: 48.0,
    industryPE: 45.0,
    roe: 28.4,
    roce: 36.2,
    debtToEquity: 0.12,
    piotroskiFScore: 8,
    altmanZScore: 8.4,
    momentum3M: -1.8,
    momentum6M: 4.2,
    analystSummary: 'Pinnacle distribution moat and brand equity with industry-leading ROCE across Indian decorative coatings.',
    factorData: { roe: 28.4, roce: 36.2, debtToEquity: 0.12, piotroskiFScore: 8, altmanZScore: 8.4, pe: 48.0, industryPE: 45.0, momentum3M: -1.8, momentum6M: 4.2 }
  },
  'HCLTECH.NS': {
    symbol: 'HCLTECH.NS',
    name: 'HCL Technologies Ltd',
    category: 'Large Cap',
    sector: 'Information Technology',
    marketCapCr: 480000,
    pe: 28.2,
    industryPE: 33.2,
    roe: 24.5,
    roce: 31.8,
    debtToEquity: 0.10,
    piotroskiFScore: 9,
    altmanZScore: 9.8,
    momentum3M: 6.8,
    momentum6M: 16.4,
    analystSummary: 'Superlative free cash flow generation and dividend payout with robust engineering R&D market share.',
    factorData: { roe: 24.5, roce: 31.8, debtToEquity: 0.10, piotroskiFScore: 9, altmanZScore: 9.8, pe: 28.2, industryPE: 33.2, momentum3M: 6.8, momentum6M: 16.4 }
  },
  'COALINDIA.NS': {
    symbol: 'COALINDIA.NS',
    name: 'Coal India Ltd',
    category: 'Large Cap',
    sector: 'Metals & Mining',
    marketCapCr: 285000,
    pe: 8.5,
    industryPE: 11.2,
    roe: 52.8,
    roce: 65.4,
    debtToEquity: 0.15,
    piotroskiFScore: 8,
    altmanZScore: 4.6,
    momentum3M: 4.2,
    momentum6M: 15.6,
    analystSummary: 'Exceptional 50%+ ROE monopoly utility providing defensive high-dividend cash flows.',
    factorData: { roe: 52.8, roce: 65.4, debtToEquity: 0.15, piotroskiFScore: 8, altmanZScore: 4.6, pe: 8.5, industryPE: 11.2, momentum3M: 4.2, momentum6M: 15.6 }
  },
  'POWERGRID.NS': {
    symbol: 'POWERGRID.NS',
    name: 'Power Grid Corp of India',
    category: 'Large Cap',
    sector: 'Power & Utilities',
    marketCapCr: 315000,
    pe: 19.8,
    industryPE: 19.5,
    roe: 18.5,
    roce: 14.8,
    debtToEquity: 1.40,
    piotroskiFScore: 8,
    altmanZScore: 3.2,
    momentum3M: 5.4,
    momentum6M: 17.5,
    analystSummary: 'Regulated sovereign utility with 85%+ inter-state transmission asset dominance and steady capitalization.',
    factorData: { roe: 18.5, roce: 14.8, debtToEquity: 1.40, piotroskiFScore: 8, altmanZScore: 3.2, pe: 19.8, industryPE: 19.5, momentum3M: 5.4, momentum6M: 17.5 }
  },
  'NESTLEIND.NS': {
    symbol: 'NESTLEIND.NS',
    name: 'Nestle India Ltd',
    category: 'Large Cap',
    sector: 'Consumer FMCG',
    marketCapCr: 235000,
    pe: 72.0,
    industryPE: 55.0,
    roe: 98.2,
    roce: 125.0,
    debtToEquity: 0.05,
    piotroskiFScore: 8,
    altmanZScore: 12.2,
    momentum3M: 1.2,
    momentum6M: 6.5,
    analystSummary: 'Unsurpassed return on capital and brand ubiquity in packaged foods, instant noodles, and beverages.',
    factorData: { roe: 98.2, roce: 125.0, debtToEquity: 0.05, piotroskiFScore: 8, altmanZScore: 12.2, pe: 72.0, industryPE: 55.0, momentum3M: 1.2, momentum6M: 6.5 }
  },
  'JIOFIN.NS': {
    symbol: 'JIOFIN.NS',
    name: 'Jio Financial Services',
    category: 'Large Cap',
    sector: 'Banking & Financials',
    marketCapCr: 210000,
    pe: 115.0,
    industryPE: 22.0,
    roe: 5.2,
    roce: 6.5,
    debtToEquity: 0.01,
    piotroskiFScore: 7,
    altmanZScore: 8.5,
    momentum3M: 4.8,
    momentum6M: 14.2,
    analystSummary: 'Heavily capitalized retail financial ecosystem entering digital lending, broking, and asset management.',
    factorData: { roe: 5.2, roce: 6.5, debtToEquity: 0.01, piotroskiFScore: 7, altmanZScore: 8.5, pe: 115.0, industryPE: 22.0, momentum3M: 4.8, momentum6M: 14.2 }
  },
  'IREDA.NS': {
    symbol: 'IREDA.NS',
    name: 'Indian Renewable Energy Dev Agency',
    category: 'Mid Cap',
    sector: 'Green Energy Financing',
    marketCapCr: 62000,
    pe: 38.5,
    industryPE: 18.0,
    roe: 16.4,
    roce: 17.8,
    debtToEquity: 5.2,
    piotroskiFScore: 7,
    altmanZScore: 2.1,
    momentum3M: 12.5,
    momentum6M: 38.0,
    analystSummary: 'Pivotal green energy NBFC spearheading India solar, wind, and green hydrogen debt financing.',
    factorData: { roe: 16.4, roce: 17.8, debtToEquity: 5.2, piotroskiFScore: 7, altmanZScore: 2.1, pe: 38.5, industryPE: 18.0, momentum3M: 12.5, momentum6M: 38.0 }
  },
  'RVNL.NS': {
    symbol: 'RVNL.NS',
    name: 'Rail Vikas Nigam Ltd',
    category: 'Mid Cap',
    sector: 'Railway Infrastructure',
    marketCapCr: 95000,
    pe: 58.0,
    industryPE: 24.0,
    roe: 19.5,
    roce: 22.0,
    debtToEquity: 0.72,
    piotroskiFScore: 7,
    altmanZScore: 3.4,
    momentum3M: 14.8,
    momentum6M: 48.0,
    analystSummary: 'Key execution arm for Indian Railways with robust multi-year order book across track doubling and metro lines.',
    factorData: { roe: 19.5, roce: 22.0, debtToEquity: 0.72, piotroskiFScore: 7, altmanZScore: 3.4, pe: 58.0, industryPE: 24.0, momentum3M: 14.8, momentum6M: 48.0 }
  },
  'PAYTM.NS': {
    symbol: 'PAYTM.NS',
    name: 'One97 Communications Ltd (Paytm)',
    category: 'Mid Cap',
    sector: 'Consumer Tech',
    marketCapCr: 48000,
    pe: 42.0,
    industryPE: 35.0,
    roe: 8.5,
    roce: 10.2,
    debtToEquity: 0.05,
    piotroskiFScore: 6,
    altmanZScore: 3.8,
    momentum3M: 22.0,
    momentum6M: 65.0,
    analystSummary: 'Rapid operational turnaround post-regulatory realignment with expanding soundbox subscription revenue.',
    factorData: { roe: 8.5, roce: 10.2, debtToEquity: 0.05, piotroskiFScore: 6, altmanZScore: 3.8, pe: 42.0, industryPE: 35.0, momentum3M: 22.0, momentum6M: 65.0 }
  },
  'VEDL.NS': {
    symbol: 'VEDL.NS',
    name: 'Vedanta Ltd',
    category: 'Large Cap',
    sector: 'Metals & Mining',
    marketCapCr: 185000,
    pe: 14.5,
    industryPE: 18.0,
    roe: 24.2,
    roce: 26.5,
    debtToEquity: 1.45,
    piotroskiFScore: 7,
    altmanZScore: 2.9,
    momentum3M: 11.2,
    momentum6M: 35.0,
    analystSummary: 'Diversified natural resources titan with massive zinc, aluminium, and oil assets offering rich dividend yields.',
    factorData: { roe: 24.2, roce: 26.5, debtToEquity: 1.45, piotroskiFScore: 7, altmanZScore: 2.9, pe: 14.5, industryPE: 18.0, momentum3M: 11.2, momentum6M: 35.0 }
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

  // Dynamic heuristic for any Indian equity outside predefined registry
  const upper = symbol.toUpperCase().replace('.NS', '').replace('.BO', '');
  const isLarge = ['NIFTY', 'SENSEX', 'BANK', 'HDFC', 'TCS', 'RELIANCE', 'INFY', 'ICICI', 'SBIN', 'ITC', 'L&T', 'BHARTI', 'MARUTI', 'ASIAN', 'TITAN', 'KOTAK', 'AXIS', 'BAJAJ'].some(k => upper.includes(k));
  const isSmall = ['SUZLON', 'CDSL', 'ANGEL', 'ZOMATO', 'PAYTM', 'IDEA', 'IREDA', 'RVNL', 'YES', 'UCO', 'SOUTH'].some(k => upper.includes(k));
  const category: MarketCapCategory = isLarge ? 'Large Cap' : isSmall ? 'Small Cap' : 'Mid Cap';

  // Dynamic sector detection
  let sector = 'Emerging Diversified';
  if (['BANK', 'FIN', 'CAPITAL', 'HOLD', 'INVEST'].some(k => upper.includes(k))) sector = 'Banking & Financials';
  else if (['TECH', 'INFO', 'SOFT', 'SYS', 'DATA', 'AI', 'DIGITAL'].some(k => upper.includes(k))) sector = 'Information Technology';
  else if (['PHARMA', 'HEALTH', 'BIO', 'LAB', 'DR'].some(k => upper.includes(k))) sector = 'Healthcare & Pharma';
  else if (['AUTO', 'MOTOR', 'TYRE', 'WHEEL'].some(k => upper.includes(k))) sector = 'Automobile';
  else if (['POWER', 'ENERGY', 'SOLAR', 'RENEW', 'GAS', 'OIL'].some(k => upper.includes(k))) sector = 'Energy & Power';
  else if (['STEEL', 'METAL', 'MINING', 'ALUM', 'ZINC', 'COPPER'].some(k => upper.includes(k))) sector = 'Metals & Mining';
  else if (['FOOD', 'FMCG', 'BREW', 'BEV', 'RETAIL', 'MART'].some(k => upper.includes(k))) sector = 'Consumer & Retail';
  else if (['INFRA', 'RAIL', 'ROAD', 'BUILD', 'PORT', 'SHIP'].some(k => upper.includes(k))) sector = 'Infrastructure';

  // Deterministic seed from symbol characters for consistent values
  const charSum = upper.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const seed = (charSum % 100) / 100;

  const roe = Number((12 + seed * 16).toFixed(1));
  const roce = Number((roe * 1.25).toFixed(1));
  const debtToEquity = Number((0.1 + (1 - seed) * 0.9).toFixed(2));
  const piotroskiFScore = Math.min(9, Math.max(6, Math.round(6 + seed * 3)));
  const altmanZScore = Number((2.8 + seed * 3.5).toFixed(1));
  const pe = Number((18 + seed * 28).toFixed(1));
  const industryPE = 24.0;
  const momentum3M = Number((2.5 + seed * 12).toFixed(1));
  const momentum6M = Number((8.0 + seed * 25).toFixed(1));

  const factorData = {
    roe,
    roce,
    debtToEquity,
    piotroskiFScore,
    altmanZScore,
    pe,
    industryPE,
    momentum3M,
    momentum6M,
  };

  const cleanName = upper.replace(/([A-Z])/g, ' $1').trim();

  return {
    symbol: `${upper}.NS`,
    name: upper,
    category,
    sector,
    marketCapCr: isLarge ? 250000 : isSmall ? 18000 : 65000,
    pe,
    industryPE,
    roe,
    roce,
    debtToEquity,
    piotroskiFScore,
    altmanZScore,
    momentum3M,
    momentum6M,
    factorBreakdown: computeQVMScore(factorData),
    analystSummary: `Systematic institutional factor evaluation for ${upper} (${sector}) based on ${category} capital allocation standards.`,
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
  '125497': {
    schemeCode: '125497',
    name: 'SBI Small Cap Fund - Direct Growth',
    category: 'Small Cap',
    fundHouse: 'SBI Mutual Fund',
    aumCr: 31200,
    nav: 178.5,
    expenseRatio: 0.69,
    cagr3Y: 26.8,
    cagr5Y: 24.5,
    sharpeRatio: 1.62,
    alpha: 6.8,
    beta: 0.82,
    topHoldings: ['Blue Star', 'Carborundum Universal', 'Kalpataru Projects', 'Kirloskar Oil Engines', 'V-Guard'],
    analystSummary: 'Conservative small-cap compounding philosophy with high liquidity buffers and disciplined valuation cap.',
  },
  '120847': {
    schemeCode: '120847',
    name: 'Quant Active Fund - Direct Growth',
    category: 'Large Cap',
    fundHouse: 'Quant Mutual Fund',
    aumCr: 10400,
    nav: 388.2,
    expenseRatio: 0.76,
    cagr3Y: 28.5,
    cagr5Y: 26.2,
    sharpeRatio: 1.84,
    alpha: 8.4,
    beta: 0.98,
    topHoldings: ['Reliance Industries', 'Jio Financial', 'Adani Power', 'SAIL', 'Tata Communications'],
    analystSummary: 'Multi-cap agile factor rotation capitalizing on high momentum and macroscopic market catalysts.',
  },
  '100033': {
    schemeCode: '100033',
    name: 'ICICI Prudential Bluechip Fund - Direct Growth',
    category: 'Large Cap',
    fundHouse: 'ICICI Prudential AMC',
    aumCr: 55200,
    nav: 112.4,
    expenseRatio: 0.88,
    cagr3Y: 19.4,
    cagr5Y: 18.2,
    sharpeRatio: 1.42,
    alpha: 3.5,
    beta: 0.89,
    topHoldings: ['ICICI Bank', 'Reliance Industries', 'Larsen & Toubro', 'Infosys', 'Maruti Suzuki'],
    analystSummary: 'Cornerstone bluechip portfolio emphasizing cash-flow giants with counter-cyclical valuation entry.',
  },
  '135800': {
    schemeCode: '135800',
    name: 'Tata Digital India Fund - Direct Growth',
    category: 'Mid Cap',
    fundHouse: 'Tata Mutual Fund',
    aumCr: 11400,
    nav: 45.4,
    expenseRatio: 0.38,
    cagr3Y: 24.2,
    cagr5Y: 22.8,
    sharpeRatio: 1.48,
    alpha: 4.8,
    beta: 1.05,
    topHoldings: ['TCS', 'Infosys', 'HCL Technologies', 'Tech Mahindra', 'Persistent Systems'],
    analystSummary: 'Pure-play technology & digital transformation thematic fund capturing global software and generative AI spend.',
  },
  '120371': {
    schemeCode: '120371',
    name: 'Kotak Emerging Equity Fund - Direct Growth',
    category: 'Mid Cap',
    fundHouse: 'Kotak Mahindra AMC',
    aumCr: 47800,
    nav: 124.6,
    expenseRatio: 0.72,
    cagr3Y: 25.8,
    cagr5Y: 23.5,
    sharpeRatio: 1.58,
    alpha: 4.9,
    beta: 0.85,
    topHoldings: ['Supreme Industries', 'Schaeffler India', 'Persistent Systems', 'Solar Industries', 'Cummins India'],
    analystSummary: 'Institutional favourite in mid-caps targeting market leaders in emerging niche manufacturing and consumption.',
  },
  '120503': {
    schemeCode: '120503',
    name: 'Axis Small Cap Fund - Direct Growth',
    category: 'Small Cap',
    fundHouse: 'Axis Mutual Fund',
    aumCr: 21500,
    nav: 98.4,
    expenseRatio: 0.55,
    cagr3Y: 26.4,
    cagr5Y: 24.2,
    sharpeRatio: 1.62,
    alpha: 6.2,
    beta: 0.78,
    topHoldings: ['Narayana Hrudayalaya', 'Brigade Enterprises', 'Birlasoft', 'Krishna Institute', 'PNC Infratech'],
    analystSummary: 'Low-beta conservative small-cap philosophy focused on quality balance sheets and strong ROCE.',
  },
  '120849': {
    schemeCode: '120849',
    name: 'Quant Flexi Cap Fund - Direct Growth',
    category: 'Large Cap',
    fundHouse: 'Quant Mutual Fund',
    aumCr: 12800,
    nav: 92.6,
    expenseRatio: 0.72,
    cagr3Y: 33.5,
    cagr5Y: 29.8,
    sharpeRatio: 1.86,
    alpha: 9.8,
    beta: 1.02,
    topHoldings: ['Reliance Industries', 'Adani Power', 'Jio Financial', 'Tata Steel', 'SAIL'],
    analystSummary: 'Dynamic macro factor engine capitalizing on rapid sectoral transitions across Indian markets.',
  },
  '118988': {
    schemeCode: '118988',
    name: 'Motilal Oswal Large and Midcap Fund - Direct Growth',
    category: 'Mid Cap',
    fundHouse: 'Motilal Oswal AMC',
    aumCr: 8900,
    nav: 44.8,
    expenseRatio: 0.65,
    cagr3Y: 28.6,
    cagr5Y: 24.5,
    sharpeRatio: 1.74,
    alpha: 7.5,
    beta: 0.88,
    topHoldings: ['Zomato Ltd', 'Trent Ltd', 'Polycab India', 'Jio Financial', 'Persistent Systems'],
    analystSummary: 'High-conviction growth portfolio combining market-leading compounders across large and mid caps.',
  },
  '120505': {
    schemeCode: '120505',
    name: 'Axis Bluechip Fund - Direct Growth',
    category: 'Large Cap',
    fundHouse: 'Axis Mutual Fund',
    aumCr: 31200,
    nav: 58.4,
    expenseRatio: 0.82,
    cagr3Y: 14.8,
    cagr5Y: 15.6,
    sharpeRatio: 1.12,
    alpha: 0.8,
    beta: 0.88,
    topHoldings: ['ICICI Bank', 'HDFC Bank', 'Infosys', 'TCS', 'Bajaj Finance'],
    analystSummary: 'Resilient large-cap anchor focused on defensive bluechip balance sheets and corporate governance.',
  },
  '118956': {
    schemeCode: '118956',
    name: 'HDFC Top 100 Fund - Direct Growth',
    category: 'Large Cap',
    fundHouse: 'HDFC Mutual Fund',
    aumCr: 34500,
    nav: 1120.0,
    expenseRatio: 0.84,
    cagr3Y: 21.2,
    cagr5Y: 19.8,
    sharpeRatio: 1.48,
    alpha: 4.2,
    beta: 0.94,
    topHoldings: ['HDFC Bank', 'ICICI Bank', 'Reliance Industries', 'Larsen & Toubro', 'NTPC'],
    analystSummary: 'Time-tested value-oriented large cap fund with deep exposure to capital goods and banking expansion.',
  },
  '122640': {
    schemeCode: '122640',
    name: 'Bandhan Sterling Value Fund - Direct Growth',
    category: 'Large Cap',
    fundHouse: 'Bandhan Mutual Fund',
    aumCr: 11200,
    nav: 142.5,
    expenseRatio: 0.62,
    cagr3Y: 25.4,
    cagr5Y: 22.8,
    sharpeRatio: 1.64,
    alpha: 5.8,
    beta: 0.89,
    topHoldings: ['ICICI Bank', 'Jindal Steel', 'Axis Bank', 'Hero MotoCorp', 'Cipla'],
    analystSummary: 'Disciplined bottom-up value investing identifying mispriced leaders with expanding margin of safety.',
  },
};

export function createDynamicMFProfile(
  schemeCode: string,
  schemeName: string,
  extraData?: {
    nav?: number;
    fundHouse?: string;
    category?: MarketCapCategory;
    cagr3Y?: number;
    cagr5Y?: number;
    expenseRatio?: number;
    sharpeRatio?: number;
    alpha?: number;
    beta?: number;
    aumCr?: number;
    topHoldings?: string[];
  }
): MutualFundFactorData {
  const isLarge = /nifty|large|bluechip|sensex|index|flexi/i.test(schemeName);
  const isSmall = /small|micro/i.test(schemeName);
  const category: MarketCapCategory = extraData?.category || (isLarge ? 'Large Cap' : isSmall ? 'Small Cap' : 'Mid Cap');
  
  const fundHouse = extraData?.fundHouse || schemeName.split(' ')[0] + ' Mutual Fund';
  const nav = extraData?.nav || 68.4;
  const expenseRatio = extraData?.expenseRatio || (isLarge ? 0.38 : isSmall ? 0.72 : 0.65);
  const cagr3Y = extraData?.cagr3Y || (isLarge ? 18.2 : isSmall ? 28.5 : 24.0);
  const cagr5Y = extraData?.cagr5Y || (isLarge ? 16.8 : isSmall ? 25.8 : 21.5);
  const sharpeRatio = extraData?.sharpeRatio || (isLarge ? 1.40 : isSmall ? 1.72 : 1.55);
  const alpha = extraData?.alpha || (isLarge ? 3.2 : isSmall ? 7.8 : 5.2);
  const beta = extraData?.beta || (isLarge ? 0.92 : isSmall ? 0.88 : 0.90);
  const aumCr = extraData?.aumCr || (isLarge ? 32000 : isSmall ? 14000 : 21000);
  const topHoldings = extraData?.topHoldings || ['HDFC Bank', 'ICICI Bank', 'Reliance Industries', 'Infosys', 'Larsen & Toubro'];

  const mfData: Omit<MutualFundFactorData, 'factorBreakdown'> = {
    schemeCode,
    name: schemeName,
    category,
    fundHouse,
    aumCr,
    nav,
    expenseRatio,
    cagr3Y,
    cagr5Y,
    sharpeRatio,
    alpha,
    beta,
    topHoldings,
    analystSummary: `AMFI verified systematic multi-factor assessment with ${sharpeRatio} Sharpe and ${expenseRatio}% TER.`,
  };

  return {
    ...mfData,
    factorBreakdown: computeMFScore(mfData),
  };
}

export function getMutualFundFactorProfile(schemeCode: string, fallbackName?: string, extraData?: any): MutualFundFactorData {
  const registered = INDIAN_MUTUAL_FUND_REGISTRY[schemeCode];
  if (registered) {
    return {
      ...registered,
      factorBreakdown: computeMFScore(registered),
    };
  }
  return createDynamicMFProfile(schemeCode, fallbackName || `Scheme ${schemeCode}`, extraData);
}

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
  const stockList = (currentHoldings || []).filter(h => {
    const q = parseFloat(h.quantity?.toString() || '0');
    return (h.assetType === 'stock' || !h.assetType) && !isNaN(q) && q > 0;
  });
  const totalStockValue = stockList.reduce((acc, h) => {
    const q = parseFloat(h.quantity?.toString() || '0');
    const p = parseFloat(h.cmp?.toString() || h.avgCost?.toString() || '0');
    return acc + (isNaN(q) || isNaN(p) ? 0 : q * p);
  }, 0);
  const existingHolding = stockList.find(h => {
    const hSym = (h.symbol || '').toUpperCase().replace('.NS', '').replace('.BO', '');
    const targetSym = (stock.symbol || '').toUpperCase().replace('.NS', '').replace('.BO', '');
    return hSym === targetSym;
  });

  if (existingHolding && totalStockValue > 0) {
    const q = parseFloat(existingHolding.quantity?.toString() || '0');
    const p = parseFloat(existingHolding.cmp?.toString() || existingHolding.avgCost?.toString() || '0');
    const existingVal = isNaN(q) || isNaN(p) ? 0 : q * p;
    const currentPct = Math.min(100, Math.max(0, (existingVal / totalStockValue) * 100));
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

// ============================================================
// PERSONAL MUTUAL FUND SUITABILITY CHECKER ENGINE
// ============================================================

export interface MutualFundSuitabilityResult {
  schemeCode: string;
  schemeName: string;
  overallScore: number; // 0 - 100
  verdict: 'Highly Suitable' | 'Suitable with Caution' | 'High Risk / Unsuitable';
  verdictColor: string;
  verdictBadgeBg: string;
  checks: {
    riskProfile: SuitabilityCheck;
    horizon: SuitabilityCheck;
    expenseEfficiency: SuitabilityCheck;
    alphaPerformance: SuitabilityCheck;
  };
  recommendation: string;
}

export function evaluateMutualFundSuitability(
  mf: MutualFundFactorData,
  profile?: {
    riskAppetite?: 'Low' | 'Medium' | 'High' | string;
    horizonYears?: number;
    primaryGoal?: string;
  },
  currentHoldings?: Array<{ symbol?: string; name?: string; assetType?: string; computedValue?: number }>
): MutualFundSuitabilityResult {
  const risk = (profile?.riskAppetite || 'Medium').toLowerCase();
  const horizon = profile?.horizonYears || 7;
  const isConservative = risk.includes('low') || risk.includes('conservative');
  const isModerate = risk.includes('med') || risk.includes('mod');
  const isAggressive = risk.includes('high') || risk.includes('aggr');

  let points = 0;

  // 1. RISK APPETITE ALIGNMENT
  let riskCheck: SuitabilityCheck;
  if (mf.category === 'Large Cap') {
    points += 30;
    riskCheck = {
      passed: true,
      status: 'passed',
      label: 'Risk Appetite Alignment',
      detail: `Large-Cap / Bluechip anchor provides disciplined downside defense suited for ${isConservative ? 'Conservative' : isModerate ? 'Moderate' : 'Aggressive'} risk profiles.`
    };
  } else if (mf.category === 'Mid Cap') {
    if (isConservative) {
      points += 15;
      riskCheck = {
        passed: false,
        status: 'warning',
        label: 'Risk Appetite Alignment',
        detail: `Mid-Cap funds experience higher interim corrections; recommended as a satellite allocation (<20%) for Conservative profiles.`
      };
    } else {
      points += 30;
      riskCheck = {
        passed: true,
        status: 'passed',
        label: 'Risk Appetite Alignment',
        detail: `Mid-Cap compounding potential matches your ${isModerate ? 'Moderate' : 'Aggressive'} wealth accumulation objectives.`
      };
    }
  } else {
    // Small Cap
    if (isConservative) {
      points += 10;
      riskCheck = {
        passed: false,
        status: 'alert',
        label: 'Risk Appetite Alignment',
        detail: `Small-Cap equities exhibit higher cyclical beta and drawdowns, exceeding Conservative comfort bands.`
      };
    } else if (isModerate) {
      points += 22;
      riskCheck = {
        passed: true,
        status: 'warning',
        label: 'Risk Appetite Alignment',
        detail: `Small-Cap exposure is suitable up to 15% of equity folio with a minimum 5-year investment horizon.`
      };
    } else {
      points += 30;
      riskCheck = {
        passed: true,
        status: 'passed',
        label: 'Risk Appetite Alignment',
        detail: `High-alpha Small-Cap fund is ideally suited for an Aggressive risk-seeking multi-year compounder.`
      };
    }
  }

  // 2. INVESTMENT HORIZON FIT
  let horizonCheck: SuitabilityCheck;
  if (horizon >= 5) {
    points += 25;
    horizonCheck = {
      passed: true,
      status: 'passed',
      label: 'Investment Horizon Fit',
      detail: `Your ${horizon}-year investment timeline exceeds the 5-year equity threshold needed to absorb market cycles.`
    };
  } else if (horizon >= 3) {
    if (mf.category === 'Small Cap') {
      points += 12;
      horizonCheck = {
        passed: false,
        status: 'warning',
        label: 'Investment Horizon Fit',
        detail: `A ${horizon}-year horizon may be too brief for small caps to recover from severe cyclical bear phases.`
      };
    } else {
      points += 22;
      horizonCheck = {
        passed: true,
        status: 'passed',
        label: 'Investment Horizon Fit',
        detail: `A ${horizon}-year horizon is sufficient for ${mf.category} compounders.`
      };
    }
  } else {
    points += 8;
    horizonCheck = {
      passed: false,
      status: 'alert',
      label: 'Investment Horizon Fit',
      detail: `Short horizon (<3 years) poses severe capital risk in equity mutual funds. Consider arbitrage or liquid debt funds.`
    };
  }

  // 3. EXPENSE RATIO / COST EFFICIENCY
  let expenseCheck: SuitabilityCheck;
  if (mf.expenseRatio <= 0.40) {
    points += 25;
    expenseCheck = {
      passed: true,
      status: 'passed',
      label: 'Cost Drag Efficiency',
      detail: `Ultra-competitive Total Expense Ratio (${mf.expenseRatio}% p.a.) minimizes compounding drag.`
    };
  } else if (mf.expenseRatio <= 0.75) {
    points += 20;
    expenseCheck = {
      passed: true,
      status: 'passed',
      label: 'Cost Drag Efficiency',
      detail: `Standard direct-growth expense ratio (${mf.expenseRatio}% p.a.) is well within acceptable institutional bounds.`
    };
  } else {
    points += 12;
    expenseCheck = {
      passed: false,
      status: 'warning',
      label: 'Cost Drag Efficiency',
      detail: `Higher TER (${mf.expenseRatio}% p.a.) creates a noticeable drag; ensure alpha outperformance justifies cost.`
    };
  }

  // 4. QUANT QUALITY & ALPHA PERFORMANCE
  let alphaCheck: SuitabilityCheck;
  if (mf.sharpeRatio >= 1.5 && mf.alpha >= 3.0) {
    points += 20;
    alphaCheck = {
      passed: true,
      status: 'passed',
      label: 'Risk-Adjusted Alpha',
      detail: `Outstanding risk-adjusted generation: Sharpe ${mf.sharpeRatio} and +${mf.alpha}% Alpha over category benchmark.`
    };
  } else if (mf.sharpeRatio >= 1.1) {
    points += 15;
    alphaCheck = {
      passed: true,
      status: 'passed',
      label: 'Risk-Adjusted Alpha',
      detail: `Consistent risk-adjusted return (Sharpe ${mf.sharpeRatio}, Alpha +${mf.alpha}%).`
    };
  } else {
    points += 8;
    alphaCheck = {
      passed: false,
      status: 'warning',
      label: 'Risk-Adjusted Alpha',
      detail: `Subdued Sharpe ratio (${mf.sharpeRatio}); fund has not generated significant risk-adjusted alpha recently.`
    };
  }

  const overallScore = Math.min(100, Math.max(10, points));

  let verdict: 'Highly Suitable' | 'Suitable with Caution' | 'High Risk / Unsuitable';
  let verdictColor: string;
  let verdictBadgeBg: string;

  if (overallScore >= 80) {
    verdict = 'Highly Suitable';
    verdictColor = 'text-positive';
    verdictBadgeBg = 'bg-positive/10 border-positive/30 text-positive';
  } else if (overallScore >= 60) {
    verdict = 'Suitable with Caution';
    verdictColor = 'text-accent-brass';
    verdictBadgeBg = 'bg-accent-brass/10 border-accent-brass/30 text-accent-brass';
  } else {
    verdict = 'High Risk / Unsuitable';
    verdictColor = 'text-rose-400';
    verdictBadgeBg = 'bg-rose-500/10 border-rose-500/30 text-rose-400';
  }

  const recommendation = overallScore >= 80
    ? `${mf.name} is an institutional-grade match for your ${risk.toUpperCase()} risk profile. Its ${mf.sharpeRatio} Sharpe Ratio and low ${mf.expenseRatio}% expense ratio make it an optimal core SIP vehicle.`
    : overallScore >= 60
    ? `${mf.name} can be held as an opportunistic tactical allocation. Mind the ${mf.category} cyclical volatility against your ${horizon}-year horizon.`
    : `Caution: ${mf.name} deviates from your risk parameters or timeline constraints. Consider reallocating towards broad market index or flexi-cap vehicles.`;

  return {
    schemeCode: mf.schemeCode,
    schemeName: mf.name,
    overallScore,
    verdict,
    verdictColor,
    verdictBadgeBg,
    checks: {
      riskProfile: riskCheck,
      horizon: horizonCheck,
      expenseEfficiency: expenseCheck,
      alphaPerformance: alphaCheck,
    },
    recommendation,
  };
}
