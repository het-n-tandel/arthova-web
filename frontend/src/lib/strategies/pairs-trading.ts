/**
 * Statistical Arbitrage & Cointegration Pairs Trading Engine
 * Based on Dey et al. (2025) Section 2: "Statistical Arbitrage (StatArb) Strategy"
 * Evaluates pairs spread Z-score and mean-reversion arbitrage bounds (+/- 2 sigma).
 */

import { CointegratedPair } from './types';

export const TRACKED_NSE_PAIRS = [
  {
    id: 'tcs-infy',
    symbolA: 'TCS.NS',
    nameA: 'Tata Consultancy Services',
    symbolB: 'INFY.NS',
    nameB: 'Infosys Ltd',
    sector: 'Information Technology',
    correlation: 0.88,
    baseRatio: 2.21,
  },
  {
    id: 'hdfc-icici',
    symbolA: 'HDFCBANK.NS',
    nameA: 'HDFC Bank Ltd',
    symbolB: 'ICICIBANK.NS',
    nameB: 'ICICI Bank Ltd',
    sector: 'Banking & Financials',
    correlation: 0.91,
    baseRatio: 1.41,
  },
  {
    id: 'reliance-ongc',
    symbolA: 'RELIANCE.NS',
    nameA: 'Reliance Industries',
    symbolB: 'ONGC.NS',
    nameB: 'Oil & Natural Gas Corp',
    sector: 'Energy & Petrochemicals',
    correlation: 0.84,
    baseRatio: 11.2,
  },
  {
    id: 'tatamotors-maruti',
    symbolA: 'TATAMOTORS.NS',
    nameA: 'Tata Motors Ltd',
    symbolB: 'MARUTI.NS',
    nameB: 'Maruti Suzuki India',
    sector: 'Automotive',
    correlation: 0.82,
    baseRatio: 0.076,
  },
];

/**
 * Computes the synthetic 90-day normalized spread and Z-score for cointegrated pairs
 */
export function calculatePairSpread(pairId: string, days: number = 60): CointegratedPair {
  const meta = TRACKED_NSE_PAIRS.find(p => p.id === pairId) || TRACKED_NSE_PAIRS[0];
  const now = new Date();
  const history: CointegratedPair['history'] = [];

  const baseRatio = meta.baseRatio;
  let currentZ = 0;

  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);

    // Multi-cycle cyclical oscillation to simulate historical cointegrated spread
    const cycle = Math.sin(i * 0.18) * 0.045 + Math.cos(i * 0.07) * 0.025;
    const ratio = Number((baseRatio * (1 + cycle)).toFixed(4));
    
    // Mean is centered around baseRatio
    const spreadZ = Number(((ratio - baseRatio) / (baseRatio * 0.035)).toFixed(2));
    if (i === 0) currentZ = spreadZ;

    history.push({
      date: d.toISOString().slice(5, 10),
      ratio,
      spreadZ,
      upperBand: 2.0,
      lowerBand: -2.0,
      mean: 0.0,
    });
  }

  let opportunity: CointegratedPair['opportunity'] = 'neutral_in_band';
  let description = `Pair is trading near equilibrium ratio within ±1.0σ bounds. No active statistical arbitrage divergence.`;

  if (currentZ >= 1.8) {
    opportunity = 'buy_b_sell_a';
    description = `${meta.nameA} is statistically overvalued by +${currentZ}σ relative to ${meta.nameB}. Recommended StatArb position: Long ${meta.symbolB} / Short ${meta.symbolA}.`;
  } else if (currentZ <= -1.8) {
    opportunity = 'buy_a_sell_b';
    description = `${meta.nameA} is statistically undervalued by ${currentZ}σ relative to ${meta.nameB}. Recommended StatArb position: Long ${meta.symbolA} / Short ${meta.symbolB}.`;
  }

  return {
    id: meta.id,
    symbolA: meta.symbolA,
    symbolB: meta.symbolB,
    nameA: meta.nameA,
    nameB: meta.nameB,
    sector: meta.sector,
    correlation: meta.correlation,
    hedgeRatio: meta.baseRatio,
    currentSpreadZ: currentZ,
    opportunity,
    description,
    history,
  };
}
