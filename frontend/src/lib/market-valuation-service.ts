export interface MarketValuationInfo {
  niftyPE: number;
  historicalMedianPE: number;
  yieldGapPercent: number; // 10-Yr G-Sec (7.1%) - Earnings Yield
  stance: 'ATTRACTIVE_DIP' | 'FAIR_VALUE' | 'ELEVATED_RISK';
  equityAdjustmentPercent: number; // e.g., +10%, 0%, -10%
  headline: string;
  badgeLabel: string;
  badgeColor: string;
  rationale: string;
  actionGuidance: string;
}

/**
 * Evaluates Indian Market Valuation regime based on Nifty 50 P/E ratio
 * and the 10-Year Sovereign Bond Yield Gap.
 */
export function getMarketValuationInfo(customPE?: number): MarketValuationInfo {
  // Current Nifty 50 Trailing P/E benchmark (~21.8 as of current Indian market levels)
  const niftyPE = customPE && customPE > 0 ? customPE : 21.8;
  const historicalMedianPE = 21.5;
  const earningsYield = (1 / niftyPE) * 100; // ~4.58%
  const gSecYield = 7.08; // 10-year Indian G-Sec benchmark yield ~7.08%
  const yieldGapPercent = Number((gSecYield - earningsYield).toFixed(2));

  if (niftyPE < 19.0) {
    return {
      niftyPE,
      historicalMedianPE,
      yieldGapPercent,
      stance: 'ATTRACTIVE_DIP',
      equityAdjustmentPercent: 10,
      headline: 'Valuations Attractive (Market On Discount)',
      badgeLabel: 'Tactical Buy: Equity +10%',
      badgeColor: 'text-positive bg-positive/10 border-positive/30',
      rationale: `Nifty 50 P/E is at ${niftyPE.toFixed(1)}, well below its 10-year historical median of ${historicalMedianPE}. Equity risk premiums are in your favor.`,
      actionGuidance: 'Deploy additional monthly surplus aggressively into Equity Index and large-cap compounders before valuations re-rate higher.',
    };
  }

  if (niftyPE > 23.5) {
    return {
      niftyPE,
      historicalMedianPE,
      yieldGapPercent,
      stance: 'ELEVATED_RISK',
      equityAdjustmentPercent: -10,
      headline: 'Valuations Elevated (Market Overheated)',
      badgeLabel: 'Capital Protection: Equity -10%',
      badgeColor: 'text-warning bg-warning/10 border-warning/30',
      rationale: `Nifty 50 P/E of ${niftyPE.toFixed(1)} is above historical tolerance levels. The 10-Year G-Sec yield gap is ${yieldGapPercent}%, making bonds and arbitrage attractive.`,
      actionGuidance: 'Trim equity additions; shift 10% of monthly surplus into Fixed Income, Sovereign Gold, and Arbitrage to lock in profits and protect against drawdowns.',
    };
  }

  return {
    niftyPE,
    historicalMedianPE,
    yieldGapPercent,
    stance: 'FAIR_VALUE',
    equityAdjustmentPercent: 0,
    headline: 'Market in Fair Value Zone',
    badgeLabel: 'Neutral Allocation: Baseline',
    badgeColor: 'text-accent-brass bg-accent-brass/10 border-accent-brass/30',
    rationale: `Nifty 50 P/E of ${niftyPE.toFixed(1)} is oscillating near its historical average (${historicalMedianPE}). Earnings growth is keeping pace with market index prices.`,
    actionGuidance: 'Follow your baseline strategic asset allocation. Deploy monthly surplus proportionally across Equity, Gold, and Debt to eliminate negative drifts.',
  };
}
