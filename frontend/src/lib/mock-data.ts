/**
 * Ledger AI — Mock Data
 * Realistic Indian market data for all asset classes
 */

// ============================================================
// STOCKS
// ============================================================

export interface StockHolding {
  symbol: string;
  name: string;
  sector: string;
  quantity: number;
  avgCost: number;
  cmp: number;
  dayChange: number;
  dayChangePercent: number;
  pe: number;
  marketCap: number; // in crores
  weekHigh52: number;
  weekLow52: number;
  volume: number;
}

export const stockHoldings: StockHolding[] = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', sector: 'Energy', quantity: 50, avgCost: 2340, cmp: 2978.45, dayChange: 24.30, dayChangePercent: 0.82, pe: 28.5, marketCap: 2016000, weekHigh52: 3217, weekLow52: 2220, volume: 8542310 },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'IT', quantity: 30, avgCost: 3200, cmp: 4156.80, dayChange: -18.50, dayChangePercent: -0.44, pe: 32.1, marketCap: 1524000, weekHigh52: 4592, weekLow52: 3311, volume: 2145620 },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', sector: 'Banking', quantity: 100, avgCost: 1450, cmp: 1812.35, dayChange: 12.75, dayChangePercent: 0.71, pe: 20.4, marketCap: 1382000, weekHigh52: 1880, weekLow52: 1363, volume: 12450890 },
  { symbol: 'INFY.NS', name: 'Infosys', sector: 'IT', quantity: 75, avgCost: 1380, cmp: 1892.60, dayChange: -7.20, dayChangePercent: -0.38, pe: 29.8, marketCap: 786000, weekHigh52: 1997, weekLow52: 1358, volume: 6723450 },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', sector: 'Banking', quantity: 120, avgCost: 820, cmp: 1285.90, dayChange: 15.40, dayChangePercent: 1.21, pe: 18.7, marketCap: 904000, weekHigh52: 1362, weekLow52: 875, volume: 9876540 },
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever', sector: 'FMCG', quantity: 40, avgCost: 2180, cmp: 2534.15, dayChange: 8.60, dayChangePercent: 0.34, pe: 58.2, marketCap: 596000, weekHigh52: 2859, weekLow52: 2172, volume: 1342670 },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', sector: 'Telecom', quantity: 60, avgCost: 780, cmp: 1687.50, dayChange: 32.15, dayChangePercent: 1.94, pe: 76.3, marketCap: 1012000, weekHigh52: 1779, weekLow52: 887, volume: 4523890 },
  { symbol: 'ITC.NS', name: 'ITC Limited', sector: 'FMCG', quantity: 200, avgCost: 320, cmp: 468.25, dayChange: 3.80, dayChangePercent: 0.82, pe: 27.1, marketCap: 585000, weekHigh52: 499, weekLow52: 312, volume: 15678900 },
  { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking', quantity: 150, avgCost: 520, cmp: 832.40, dayChange: -5.60, dayChangePercent: -0.67, pe: 10.2, marketCap: 743000, weekHigh52: 912, weekLow52: 555, volume: 18945670 },
  { symbol: 'WIPRO.NS', name: 'Wipro', sector: 'IT', quantity: 90, avgCost: 390, cmp: 542.80, dayChange: 4.25, dayChangePercent: 0.79, pe: 24.6, marketCap: 284000, weekHigh52: 587, weekLow52: 371, volume: 5432100 },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance', sector: 'NBFC', quantity: 20, avgCost: 6200, cmp: 7845.30, dayChange: 65.20, dayChangePercent: 0.84, pe: 34.5, marketCap: 486000, weekHigh52: 8192, weekLow52: 5875, volume: 1987650 },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', sector: 'Auto', quantity: 80, avgCost: 610, cmp: 978.65, dayChange: -12.40, dayChangePercent: -1.25, pe: 8.9, marketCap: 362000, weekHigh52: 1085, weekLow52: 575, volume: 11234560 },
  { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical', sector: 'Pharma', quantity: 55, avgCost: 1020, cmp: 1734.20, dayChange: 22.80, dayChangePercent: 1.33, pe: 38.7, marketCap: 416000, weekHigh52: 1868, weekLow52: 1015, volume: 3456780 },
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki', sector: 'Auto', quantity: 10, avgCost: 9500, cmp: 12845.60, dayChange: 78.30, dayChangePercent: 0.61, pe: 32.8, marketCap: 402000, weekHigh52: 13420, weekLow52: 9180, volume: 876540 },
  { symbol: 'ASIANPAINT.NS', name: 'Asian Paints', sector: 'Paints', quantity: 35, avgCost: 2850, cmp: 2312.45, dayChange: -28.50, dayChangePercent: -1.22, pe: 52.4, marketCap: 222000, weekHigh52: 3395, weekLow52: 2174, volume: 2345670 },
];

// ============================================================
// MUTUAL FUNDS
// ============================================================

export interface MutualFund {
  id: string;
  name: string;
  category: string;
  amc: string;
  nav: number;
  navDate: string;
  investedAmount: number;
  currentValue: number;
  units: number;
  xirr: number;
  sipAmount: number | null;
  sipDate: number | null; // day of month
  startDate: string;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
  rating: number; // 1-5
}

export const mutualFunds: MutualFund[] = [
  { id: 'mf1', name: 'Axis Bluechip Fund', category: 'Large Cap', amc: 'Axis', nav: 52.34, navDate: '2026-07-18', investedAmount: 300000, currentValue: 412500, units: 7879.86, xirr: 14.2, sipAmount: 10000, sipDate: 5, startDate: '2023-04-05', riskLevel: 'Moderate', rating: 4 },
  { id: 'mf2', name: 'Mirae Asset Emerging Bluechip', category: 'Large & Mid Cap', amc: 'Mirae', nav: 118.67, navDate: '2026-07-18', investedAmount: 250000, currentValue: 385000, units: 3244.22, xirr: 18.7, sipAmount: 5000, sipDate: 10, startDate: '2022-10-10', riskLevel: 'High', rating: 5 },
  { id: 'mf3', name: 'Parag Parikh Flexi Cap Fund', category: 'Flexi Cap', amc: 'PPFAS', nav: 72.89, navDate: '2026-07-18', investedAmount: 500000, currentValue: 742000, units: 10179.72, xirr: 16.8, sipAmount: 15000, sipDate: 1, startDate: '2022-01-01', riskLevel: 'High', rating: 5 },
  { id: 'mf4', name: 'HDFC Mid-Cap Opportunities', category: 'Mid Cap', amc: 'HDFC', nav: 145.23, navDate: '2026-07-18', investedAmount: 200000, currentValue: 298000, units: 2052.07, xirr: 19.4, sipAmount: 5000, sipDate: 15, startDate: '2023-06-15', riskLevel: 'Very High', rating: 4 },
  { id: 'mf5', name: 'SBI Magnum Medium Duration', category: 'Debt', amc: 'SBI', nav: 45.12, navDate: '2026-07-18', investedAmount: 400000, currentValue: 432000, units: 9577.79, xirr: 7.2, sipAmount: null, sipDate: null, startDate: '2024-01-15', riskLevel: 'Low', rating: 3 },
  { id: 'mf6', name: 'Kotak Small Cap Fund', category: 'Small Cap', amc: 'Kotak', nav: 215.78, navDate: '2026-07-18', investedAmount: 150000, currentValue: 234000, units: 1084.44, xirr: 22.1, sipAmount: 3000, sipDate: 20, startDate: '2023-11-20', riskLevel: 'Very High', rating: 4 },
];

// ============================================================
// GOLD & SILVER
// ============================================================

export interface GoldSilverHolding {
  id: string;
  type: 'Digital Gold' | 'SGB' | 'Physical Gold' | 'Digital Silver' | 'Physical Silver';
  quantity: number; // grams
  avgCost: number; // per gram
  currentPrice: number; // per gram
  investedAmount: number;
  currentValue: number;
  purchaseDate: string;
}

export const goldSilverHoldings: GoldSilverHolding[] = [
  { id: 'gs1', type: 'Digital Gold', quantity: 10, avgCost: 5800, currentPrice: 7340, investedAmount: 58000, currentValue: 73400, purchaseDate: '2023-11-12' },
  { id: 'gs2', type: 'SGB', quantity: 8, avgCost: 5200, currentPrice: 7340, investedAmount: 41600, currentValue: 58720, purchaseDate: '2022-08-20' },
  { id: 'gs3', type: 'Physical Gold', quantity: 20, avgCost: 5500, currentPrice: 7340, investedAmount: 110000, currentValue: 146800, purchaseDate: '2021-04-15' },
  { id: 'gs4', type: 'Digital Silver', quantity: 500, avgCost: 68, currentPrice: 92, investedAmount: 34000, currentValue: 46000, purchaseDate: '2024-03-01' },
  { id: 'gs5', type: 'Physical Silver', quantity: 1000, avgCost: 62, currentPrice: 92, investedAmount: 62000, currentValue: 92000, purchaseDate: '2022-06-10' },
];

export const goldPrice = 7340; // per gram
export const silverPrice = 92; // per gram

// ============================================================
// FIXED DEPOSITS
// ============================================================

export interface FixedDeposit {
  id: string;
  bank: string;
  amount: number;
  ratePercent: number;
  tenureMonths: number;
  startDate: string;
  maturityDate: string;
  maturityAmount: number;
  interestEarned: number;
  status: 'Active' | 'Matured' | 'Premature Closed';
}

export const fixedDeposits: FixedDeposit[] = [
  { id: 'fd1', bank: 'SBI', amount: 500000, ratePercent: 7.10, tenureMonths: 24, startDate: '2025-01-15', maturityDate: '2027-01-15', maturityAmount: 573410, interestEarned: 73410, status: 'Active' },
  { id: 'fd2', bank: 'HDFC Bank', amount: 300000, ratePercent: 7.25, tenureMonths: 36, startDate: '2024-06-01', maturityDate: '2027-06-01', maturityAmount: 369534, interestEarned: 69534, status: 'Active' },
  { id: 'fd3', bank: 'ICICI Bank', amount: 200000, ratePercent: 6.90, tenureMonths: 12, startDate: '2025-09-10', maturityDate: '2026-09-10', maturityAmount: 213800, interestEarned: 13800, status: 'Active' },
  { id: 'fd4', bank: 'Axis Bank', amount: 400000, ratePercent: 7.40, tenureMonths: 60, startDate: '2023-03-20', maturityDate: '2028-03-20', maturityAmount: 573284, interestEarned: 173284, status: 'Active' },
  { id: 'fd5', bank: 'Kotak Mahindra', amount: 250000, ratePercent: 7.00, tenureMonths: 18, startDate: '2025-12-01', maturityDate: '2027-06-01', maturityAmount: 276522, interestEarned: 26522, status: 'Active' },
];

// ============================================================
// PROPERTY
// ============================================================

export interface Property {
  id: string;
  name: string;
  type: '2BHK Apartment' | '3BHK Apartment' | 'Villa' | 'Plot' | 'Commercial';
  location: string;
  city: string;
  acquisitionCost: number;
  currentValue: number;
  acquisitionDate: string;
  area: number; // sq ft
  rentalIncome: number | null; // monthly
  loanOutstanding: number | null;
}

export const properties: Property[] = [
  { id: 'prop1', name: 'Prestige Lakeside Habitat', type: '3BHK Apartment', location: 'Whitefield', city: 'Bangalore', acquisitionCost: 9500000, currentValue: 14200000, acquisitionDate: '2020-03-15', area: 1650, rentalIncome: 35000, loanOutstanding: 4200000 },
  { id: 'prop2', name: 'Godrej Garden City', type: '2BHK Apartment', location: 'SG Highway', city: 'Ahmedabad', acquisitionCost: 4500000, currentValue: 6800000, acquisitionDate: '2021-08-20', area: 1100, rentalIncome: 18000, loanOutstanding: null },
  { id: 'prop3', name: 'DLF Phase 5 Plot', type: 'Plot', location: 'Sector 53', city: 'Gurgaon', acquisitionCost: 12000000, currentValue: 21500000, acquisitionDate: '2019-01-10', area: 2400, rentalIncome: null, loanOutstanding: null },
];

// ============================================================
// PORTFOLIO SUMMARY
// ============================================================

export function getStockPortfolioValue(holdings: StockHolding[]): { invested: number; current: number } {
  return holdings.reduce(
    (acc, h) => ({
      invested: acc.invested + h.avgCost * h.quantity,
      current: acc.current + h.cmp * h.quantity,
    }),
    { invested: 0, current: 0 }
  );
}

export function getMFPortfolioValue(funds: MutualFund[]): { invested: number; current: number } {
  return funds.reduce(
    (acc, f) => ({
      invested: acc.invested + f.investedAmount,
      current: acc.current + f.currentValue,
    }),
    { invested: 0, current: 0 }
  );
}

export function getGoldSilverValue(holdings: GoldSilverHolding[]): { invested: number; current: number } {
  return holdings.reduce(
    (acc, h) => ({
      invested: acc.invested + h.investedAmount,
      current: acc.current + h.currentValue,
    }),
    { invested: 0, current: 0 }
  );
}

export function getFDValue(deposits: FixedDeposit[]): { invested: number; current: number } {
  const invested = deposits.reduce((s, fd) => s + fd.amount, 0);
  const interest = deposits.reduce((s, fd) => s + fd.interestEarned * 0.5, 0); // ~half earned so far
  return { invested, current: invested + interest };
}

export function getPropertyValue(props: Property[]): { invested: number; current: number } {
  return props.reduce(
    (acc, p) => ({
      invested: acc.invested + p.acquisitionCost,
      current: acc.current + p.currentValue,
    }),
    { invested: 0, current: 0 }
  );
}

// ============================================================
// CHART DATA
// ============================================================

export function generatePortfolioHistory(currentNetWorth: number = 0, months: number = 12): { date: string; value: number }[] {
  if (currentNetWorth <= 0) {
    currentNetWorth = 100000; // default fallback if portfolio is empty
  }
  
  const now = new Date();
  let value = currentNetWorth;
  const history: { date: string; value: number }[] = [];

  for (let i = 0; i <= months; i++) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    history.push({
      date: date.toISOString().slice(0, 10),
      value: Math.round(value),
    });
    // Step backwards with realistic market fluctuation relative to current net worth
    const prevMonthReturn = 0.008 + (Math.sin(i) * 0.012);
    value = value / (1 + prevMonthReturn);
  }

  return history.reverse();
}

export function generateCandlestickData(days: number = 90): {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}[] {
  const data = [];
  const now = new Date();
  let price = 2800;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const change = (Math.random() - 0.48) * 60;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 30;
    const low = Math.min(open, close) - Math.random() * 30;

    data.push({
      time: date.toISOString().slice(0, 10),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round(5000000 + Math.random() * 10000000),
    });

    price = close;
  }
  return data;
}

// ============================================================
// AI INSIGHTS
// ============================================================

export interface AIInsight {
  id: string;
  type: 'fraud' | 'strategy' | 'sentiment' | 'forecast' | 'score';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  relatedSymbol?: string;
  confidence: number; // 0-100
  timestamp: string;
}

export const aiInsights: AIInsight[] = [
  {
    id: 'ai1',
    type: 'fraud',
    severity: 'high',
    title: 'Unusual Volume Detected',
    description: 'TATAMOTORS showing 3.2x average volume with price decline. Pattern matches historical manipulation events with 78% similarity.',
    relatedSymbol: 'TATAMOTORS',
    confidence: 78,
    timestamp: '2026-07-19T14:30:00',
  },
  {
    id: 'ai2',
    type: 'strategy',
    severity: 'medium',
    title: 'Momentum Strategy Match',
    description: 'BHARTIARTL exhibits strong momentum characteristics — rising 52-week highs, increasing institutional holding, and sector tailwinds from 5G capex cycle.',
    relatedSymbol: 'BHARTIARTL',
    confidence: 85,
    timestamp: '2026-07-19T10:15:00',
  },
  {
    id: 'ai3',
    type: 'sentiment',
    severity: 'low',
    title: 'Positive Earnings Sentiment',
    description: 'NLP analysis of 142 analyst reports shows 82% bullish consensus on HDFCBANK ahead of Q1 results. Price target consensus: ₹1,950.',
    relatedSymbol: 'HDFCBANK',
    confidence: 82,
    timestamp: '2026-07-19T09:00:00',
  },
  {
    id: 'ai4',
    type: 'forecast',
    severity: 'medium',
    title: 'Portfolio Risk Alert',
    description: 'IT sector allocation at 28% exceeds recommended 20% threshold. Consider rebalancing — sector faces headwinds from AI disruption and rupee appreciation.',
    confidence: 72,
    timestamp: '2026-07-18T16:45:00',
  },
  {
    id: 'ai5',
    type: 'score',
    severity: 'low',
    title: 'Portfolio Health Score: 78/100',
    description: 'Diversification: 85/100 | Risk-adjusted returns: 72/100 | Tax efficiency: 68/100 | Liquidity: 88/100. Main drag: high concentration in IT stocks.',
    confidence: 90,
    timestamp: '2026-07-19T08:00:00',
  },
];

// ============================================================
// TAX DATA
// ============================================================

export interface TaxSummary {
  stcg: number;
  ltcg: number;
  dividendIncome: number;
  interestIncome: number;
  totalTaxable: number;
  estimatedTax: number;
  harvestingOpportunities: { symbol: string; loss: number; recommendation: string }[];
}

export const taxSummary: TaxSummary = {
  stcg: 42580,
  ltcg: 185420,
  dividendIncome: 32400,
  interestIncome: 98250,
  totalTaxable: 358650,
  estimatedTax: 67200,
  harvestingOpportunities: [
    { symbol: 'ASIANPAINT', loss: -18813, recommendation: 'Sell to offset STCG. Re-enter after 30 days to maintain position.' },
    { symbol: 'TATAMOTORS', loss: -6500, recommendation: 'Book short-term loss. Sector outlook negative for next quarter.' },
  ],
};

// ============================================================
// SECTOR ALLOCATION DATA
// ============================================================

export const sectorAllocation = [
  { sector: 'Banking & Finance', value: 28.4, color: '#3FA88A' },
  { sector: 'IT', value: 22.1, color: '#7C8AD4' },
  { sector: 'Energy', value: 12.8, color: '#C9A227' },
  { sector: 'FMCG', value: 10.2, color: '#D9705C' },
  { sector: 'Telecom', value: 8.7, color: '#E0B34C' },
  { sector: 'Auto', value: 8.3, color: '#6C756A' },
  { sector: 'Pharma', value: 5.8, color: '#9BA39A' },
  { sector: 'Others', value: 3.7, color: '#3A443B' },
];

// ============================================================
// RECENT ACTIVITY
// ============================================================

export interface Activity {
  id: string;
  type: 'buy' | 'sell' | 'sip' | 'dividend' | 'interest' | 'maturity';
  description: string;
  amount: number;
  date: string;
  symbol?: string;
}

export const recentActivity: Activity[] = [
  { id: 'act1', type: 'sip', description: 'SIP — Parag Parikh Flexi Cap', amount: -15000, date: '2026-07-01', symbol: 'PPFAS' },
  { id: 'act2', type: 'dividend', description: 'Dividend — ITC Limited', amount: 1600, date: '2026-06-28', symbol: 'ITC' },
  { id: 'act3', type: 'buy', description: 'Bought BHARTIARTL × 20', amount: -33750, date: '2026-06-25', symbol: 'BHARTIARTL' },
  { id: 'act4', type: 'interest', description: 'FD Interest — SBI', amount: 8925, date: '2026-06-15' },
  { id: 'act5', type: 'sell', description: 'Sold WIPRO × 10', amount: 5428, date: '2026-06-12', symbol: 'WIPRO' },
  { id: 'act6', type: 'sip', description: 'SIP — Axis Bluechip Fund', amount: -10000, date: '2026-06-05' },
  { id: 'act7', type: 'buy', description: 'Bought SUNPHARMA × 15', amount: -26013, date: '2026-06-02', symbol: 'SUNPHARMA' },
  { id: 'act8', type: 'dividend', description: 'Dividend — HDFCBANK', amount: 1900, date: '2026-05-30', symbol: 'HDFCBANK' },
];
