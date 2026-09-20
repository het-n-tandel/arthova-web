import { getStockFactorProfile } from './factor-scoring';

export interface UserDemographics {
  age: number;
  targetRetirementAge: number;
  maritalStatus?: string;
  childrenCount?: number;
  dependentParents?: boolean;
}

export interface FinancialCashflow {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyEmis: number;
  taxBracketPercent: number;
}

export interface AssetBreakdownPercent {
  equity: number;
  fdDebt: number;
  gold: number;
  realEstate?: number;
  cash?: number;
}

export interface NetWorthBreakdown {
  totalCurrentAssets: number;
  assetBreakdownPercent: AssetBreakdownPercent;
  totalLiabilities: number;
  hasHighInterestDebt: boolean;
}

export interface RiskAndInsurance {
  riskAppetite: 'Low' | 'Medium' | 'High';
  hasHealthInsurance: boolean;
  hasLifeInsurance: boolean;
  hasEmergencyFund: boolean;
}

export interface FinancialGoalItem {
  type: string;
  targetAmount: number;
  horizonYears: number;
}

export interface UserProfilePayload {
  userDemographics: UserDemographics;
  financialCashflow: FinancialCashflow;
  netWorthBreakdown: NetWorthBreakdown;
  riskAndInsurance: RiskAndInsurance;
  financialGoals: FinancialGoalItem[];
  holdings?: Array<{
    symbol: string;
    name: string;
    assetType: string;
    quantity: number;
    avgCost: number;
    cmp?: number;
    metadata?: any;
  }>;
}

export interface RecommendedAllocation {
  equityPercent: number;
  debtPercent: number;
  goldPercent: number;
  cashPercent: number;
}

export interface AssetClassRecommendation {
  assetClass: string;
  recommendedPercent: number;
  whyRecommended: string;
  topInstruments: string[];
  expectedReturn: string;
  riskLevel: string;
  taxRule: string;
}

export interface GoalExecutionPlanItem {
  goal: string;
  originalTarget: number;
  inflationAdjustedTarget: number;
  horizonYears: number;
  suggestedAssetClass: string;
  requiredMonthlySip: number;
}

export interface AssetRecommendationReason {
  assetClass: string;
  goalType: string;
  horizonLabel: string;
  reasoning: string;
  taxAdvantage: string;
  riskProfile: string;
}

export interface NetWorthYearPoint {
  age: number;
  year: number;
  ageLabel: string;
  expectedNetWorth: number;
  pessimisticNetWorth: number;
  optimisticNetWorth: number;
  isGoalDip: boolean;
  goalDipName?: string;
  goalOutflowAmount?: number;
}

export interface MarketCapTarget {
  category: 'Large Cap' | 'Mid Cap' | 'Small Cap';
  targetPercent: number;
  minFloorPercent: number;
  maxCeilingPercent: number;
  rationale: string;
}

export interface ConcentrationRiskAlert {
  type: 'SINGLE_STOCK' | 'SECTOR' | 'SMALL_CAP_DRIFT';
  severity: 'HIGH' | 'MEDIUM' | 'SAFE';
  title: string;
  description: string;
  safeLimit: string;
  currentValue: string;
}

export interface MarketCapAllocationAnalysis {
  targets: {
    largeCap: MarketCapTarget;
    midCap: MarketCapTarget;
    smallCap: MarketCapTarget;
  };
  currentRatio: {
    largeCapPercent: number;
    midCapPercent: number;
    smallCapPercent: number;
  };
  concentrationAlerts: ConcentrationRiskAlert[];
  sectorBreakdown: Array<{ sector: string; percent: number; isBreached: boolean }>;
}

export function calculateMarketCapAllocation(
  age: number,
  riskAppetite: 'Low' | 'Medium' | 'High',
  horizonYears: number
): MarketCapAllocationAnalysis['targets'] {
  // Conservative profile: Age >= 50 or Low risk or horizon <= 3 years
  if (age >= 50 || riskAppetite === 'Low' || horizonYears <= 3) {
    return {
      largeCap: {
        category: 'Large Cap',
        targetPercent: 75,
        minFloorPercent: 65,
        maxCeilingPercent: 90,
        rationale: 'Capital preservation prioritized via bluechip Nifty 50 leaders with high balance sheet strength.',
      },
      midCap: {
        category: 'Mid Cap',
        targetPercent: 20,
        minFloorPercent: 10,
        maxCeilingPercent: 30,
        rationale: 'Controlled compounding through established market leaders with low default risk.',
      },
      smallCap: {
        category: 'Small Cap',
        targetPercent: 5,
        minFloorPercent: 0,
        maxCeilingPercent: 5,
        rationale: 'Strict institutional cap to prevent severe drawdown and illiquidity exposure.',
      },
    };
  }

  // Aggressive profile: Age < 32 and High risk and horizon >= 7 years
  if (age < 32 && riskAppetite === 'High' && horizonYears >= 7) {
    return {
      largeCap: {
        category: 'Large Cap',
        targetPercent: 40,
        minFloorPercent: 30,
        maxCeilingPercent: 55,
        rationale: 'Foundation anchor providing downside cushion and liquidity buffer during bear cycles.',
      },
      midCap: {
        category: 'Mid Cap',
        targetPercent: 35,
        minFloorPercent: 25,
        maxCeilingPercent: 45,
        rationale: 'Aggressive alpha engine targeting rapid market share gainers and high ROCE innovators.',
      },
      smallCap: {
        category: 'Small Cap',
        targetPercent: 25,
        minFloorPercent: 10,
        maxCeilingPercent: 25,
        rationale: 'High-beta allocation for exponential long-term compounding with strict 25% max ceiling.',
      },
    };
  }

  // Moderate profile: Default for balanced wealth creation
  return {
    largeCap: {
      category: 'Large Cap',
      targetPercent: 55,
      minFloorPercent: 45,
      maxCeilingPercent: 70,
      rationale: 'Core portfolio anchor in bluechip balance sheets with steady dividend reinvestment.',
    },
    midCap: {
      category: 'Mid Cap',
      targetPercent: 30,
      minFloorPercent: 20,
      maxCeilingPercent: 40,
      rationale: 'Key growth engine across expanding Indian industrial and domestic consumption sectors.',
    },
    smallCap: {
      category: 'Small Cap',
      targetPercent: 15,
      minFloorPercent: 5,
      maxCeilingPercent: 15,
      rationale: 'Satellite high-alpha exposure strictly contained within 15% risk boundary.',
    },
  };
}

export function analyzeConcentrationAndDrift(
  holdings: Array<{
    symbol: string;
    name: string;
    assetType: string;
    quantity: number;
    avgCost: number;
    cmp?: number;
  }> | undefined,
  targets: MarketCapAllocationAnalysis['targets']
): {
  currentRatio: { largeCapPercent: number; midCapPercent: number; smallCapPercent: number };
  concentrationAlerts: ConcentrationRiskAlert[];
  sectorBreakdown: Array<{ sector: string; percent: number; isBreached: boolean }>;
} {
  const stockHoldings = (holdings || []).filter(h => h.assetType === 'STOCK' || !h.assetType);
  let totalEquityValue = 0;
  let largeCapValue = 0;
  let midCapValue = 0;
  let smallCapValue = 0;

  const sectorValues: Record<string, number> = {};
  const stockValues: Array<{ symbol: string; value: number }> = [];

  for (const item of stockHoldings) {
    const price = item.cmp && item.cmp > 0 ? item.cmp : (item.avgCost || 0);
    const value = price * (item.quantity || 0);
    if (value <= 0) continue;

    totalEquityValue += value;
    stockValues.push({ symbol: item.symbol, value });

    const profile = getStockFactorProfile(item.symbol);
    if (profile.category === 'Large Cap') largeCapValue += value;
    else if (profile.category === 'Mid Cap') midCapValue += value;
    else smallCapValue += value;

    const sec = profile.sector || 'Diversified';
    sectorValues[sec] = (sectorValues[sec] || 0) + value;
  }

  const alerts: ConcentrationRiskAlert[] = [];

  // Default baseline if no equity holdings
  if (totalEquityValue === 0) {
    return {
      currentRatio: {
        largeCapPercent: targets.largeCap.targetPercent,
        midCapPercent: targets.midCap.targetPercent,
        smallCapPercent: targets.smallCap.targetPercent,
      },
      concentrationAlerts: [],
      sectorBreakdown: [],
    };
  }

  const currentLargePct = Math.round((largeCapValue / totalEquityValue) * 100);
  const currentMidPct = Math.round((midCapValue / totalEquityValue) * 100);
  const currentSmallPct = Math.max(0, 100 - currentLargePct - currentMidPct);

  // 1. Single-Stock Concentration Limit (> 10%)
  for (const st of stockValues) {
    const pct = (st.value / totalEquityValue) * 100;
    if (pct > 10.0) {
      alerts.push({
        type: 'SINGLE_STOCK',
        severity: 'HIGH',
        title: `Overconcentration: ${st.symbol}`,
        description: `${st.symbol} represents ${pct.toFixed(1)}% of your equity portfolio, exceeding the institutional 10% risk ceiling. A single-company adverse event poses disproportionate risk.`,
        safeLimit: 'Max 10.0%',
        currentValue: `${pct.toFixed(1)}%`,
      });
    }
  }

  // 2. Sector Concentration Limit (> 25%)
  const sectorBreakdown: Array<{ sector: string; percent: number; isBreached: boolean }> = [];
  for (const [sector, val] of Object.entries(sectorValues)) {
    const pct = Math.round((val / totalEquityValue) * 100);
    const isBreached = pct > 25.0;
    sectorBreakdown.push({ sector, percent: pct, isBreached });
    if (isBreached) {
      alerts.push({
        type: 'SECTOR',
        severity: 'HIGH',
        title: `Sector Concentration: ${sector}`,
        description: `${sector} commands ${pct}% of your equity portfolio, exceeding the 25% institutional sector guardrail.`,
        safeLimit: 'Max 25.0%',
        currentValue: `${pct}%`,
      });
    }
  }
  sectorBreakdown.sort((a, b) => b.percent - a.percent);

  // 3. Small-Cap Drift Check
  if (currentSmallPct > targets.smallCap.maxCeilingPercent) {
    alerts.push({
      type: 'SMALL_CAP_DRIFT',
      severity: 'HIGH',
      title: 'Small-Cap Allocation Breach',
      description: `Your small-cap exposure is ${currentSmallPct}%, which breaches your profile safety ceiling of ${targets.smallCap.maxCeilingPercent}%. Downside volatility risk is elevated.`,
      safeLimit: `Max ${targets.smallCap.maxCeilingPercent}%`,
      currentValue: `${currentSmallPct}%`,
    });
  }

  return {
    currentRatio: {
      largeCapPercent: currentLargePct,
      midCapPercent: currentMidPct,
      smallCapPercent: currentSmallPct,
    },
    concentrationAlerts: alerts,
    sectorBreakdown,
  };
}

export interface AIRecommendationResponse {
  currentAllocation: RecommendedAllocation;
  recommendedAllocation: RecommendedAllocation;
  netMonthlySurplus: number;
  emergencyBufferNeeded: number;
  retirementAge: number;
  projectedRetirementNetWorth: number;
  assetClassRecommendations: AssetClassRecommendation[];
  goalExecutionPlan: GoalExecutionPlanItem[];
  assetRecommendations: AssetRecommendationReason[];
  netWorthTrajectory: NetWorthYearPoint[];
  rebalanceActions: string[];
  marketCapAllocation?: MarketCapAllocationAnalysis;
}

export function calculateAIRecommendation(payload: UserProfilePayload): AIRecommendationResponse {
  const demo = payload.userDemographics || { age: 28, targetRetirementAge: 55 };
  const cashflow = payload.financialCashflow || { monthlyIncome: 120000, monthlyExpenses: 45000, monthlyEmis: 22000, taxBracketPercent: 30 };
  const netWorth = payload.netWorthBreakdown || {
    totalCurrentAssets: 1000000,
    assetBreakdownPercent: { equity: 20, fdDebt: 60, gold: 10, realEstate: 10 },
    totalLiabilities: 0,
    hasHighInterestDebt: false,
  };
  const riskIns = payload.riskAndInsurance || { riskAppetite: 'Medium', hasHealthInsurance: true, hasLifeInsurance: true, hasEmergencyFund: false };
  const goals = payload.financialGoals || [];

  // LAYER 1: CASH FLOW & TAX GUARDRAILS
  const surplus = Math.max(0, cashflow.monthlyIncome - cashflow.monthlyExpenses - cashflow.monthlyEmis);
  const requiredEmergencyBuffer = cashflow.monthlyExpenses * 6.0;
  const emergencyNeeded = riskIns.hasEmergencyFund ? 0.0 : Math.min(requiredEmergencyBuffer, netWorth.totalCurrentAssets);

  const currentAllocation: RecommendedAllocation = {
    equityPercent: netWorth.assetBreakdownPercent?.equity ?? 0,
    debtPercent: netWorth.assetBreakdownPercent?.fdDebt ?? 0,
    goldPercent: netWorth.assetBreakdownPercent?.gold ?? 0,
    cashPercent: netWorth.assetBreakdownPercent?.cash ?? (netWorth.assetBreakdownPercent?.realEstate ?? 0),
  };

  // LAYER 2: ASSET ALLOCATION & GOAL SOLVER
  const age = demo.age > 0 ? demo.age : 28;
  const retirementAge = demo.targetRetirementAge > age ? demo.targetRetirementAge : 55;
  const yearsToRetire = retirementAge - age;

  // Rule of thumb: Target Equity = 100 - age adjusted for risk
  let targetEquity = 100 - age;
  if (riskIns.riskAppetite === 'High') targetEquity += 10;
  else if (riskIns.riskAppetite === 'Low') targetEquity -= 15;
  targetEquity = Math.max(20, Math.min(80, targetEquity));

  const targetGold = 10.0;
  const targetCash = emergencyNeeded > 0 ? 10.0 : 5.0;
  const targetDebt = Math.max(5.0, 100.0 - targetEquity - targetGold - targetCash);

  const recommendedAllocation: RecommendedAllocation = {
    equityPercent: targetEquity,
    debtPercent: targetDebt,
    goldPercent: targetGold,
    cashPercent: targetCash,
  };

  // ASSET CLASS RECOMMENDATIONS & WHY RECOMMENDED
  const assetClassRecommendations: AssetClassRecommendation[] = [
    {
      assetClass: 'Equity (Stocks & Mutual Funds)',
      recommendedPercent: targetEquity,
      whyRecommended: `At age ${age} with ${yearsToRetire} years to retirement, equity compounding is essential to defeat 6% annual inflation. Historically delivering 12%–14% CAGR, an allocation of ${targetEquity.toFixed(0)}% maximizes wealth building while withstanding short-term market cycles.`,
      topInstruments: [
        'Nifty 50 Index Mutual Funds (Core Foundation)',
        'Parag Parikh Flexi Cap Fund (Balanced Multi-Cap Growth)',
        'Bluechip Large-Cap Leaders (Reliance, TCS, HDFC Bank, Infosys)',
      ],
      expectedReturn: '12.0% – 14.0% CAGR',
      riskLevel: 'High Growth / Long-Term Compounding',
      taxRule: '12.5% LTCG on gains above ₹1.25 Lakh; 20% STCG',
    },
    {
      assetClass: 'Fixed Income (Fixed Deposits & Debt)',
      recommendedPercent: targetDebt,
      whyRecommended:
        cashflow.taxBracketPercent >= 30
          ? `Provides capital preservation. In your 30% tax bracket, the AI directs short/medium debt allocations into Arbitrage Funds taxed as Equity (20% STCG) rather than paying 30% slab rate on bank FDs, saving ~10% in tax drag.`
          : `Guarantees predictable capital safety and steady interest returns without stock market volatility, stabilizing your portfolio at ${targetDebt.toFixed(0)}% weight.`,
      topInstruments:
        cashflow.taxBracketPercent >= 30
          ? [
              'Arbitrage Mutual Funds (Saves ~10% tax vs FDs)',
              'Top Bank Fixed Deposits (SBI / HDFC 7.1% - 7.5%)',
              'Corporate AAA Bond Funds',
            ]
          : [
              'High-Interest Bank Fixed Deposits (7.1% - 7.5%)',
              'Short-Duration Debt Mutual Funds',
              'RBI Floating Rate Savings Bonds',
            ],
      expectedReturn: '7.0% – 7.5% p.a.',
      riskLevel: 'Low Risk / Capital Preservation',
      taxRule: cashflow.taxBracketPercent >= 30 ? 'Tax-optimized equity arbitrage (20% STCG) vs 30% slab' : 'Taxed at regular income slab rate',
    },
    {
      assetClass: 'Gold & Silver',
      recommendedPercent: targetGold,
      whyRecommended:
        'Acts as an essential crisis hedge and inflation dampener. Gold has low correlation to Indian equity indices, preserving purchasing power during recessions and currency fluctuations.',
      topInstruments: [
        'Sovereign Gold Bonds (SGB - 2.5% annual interest + tax-free gains)',
        'Gold ETFs (Nippon / HDFC Gold BeES)',
        'Physical 24K Gold / Silver ETFs',
      ],
      expectedReturn: '8.5% – 10.0% p.a.',
      riskLevel: 'Moderate / Safe-Haven & Inflation Hedge',
      taxRule: 'SGBs held to maturity are 100% Tax-Free; Gold ETFs taxed at slab',
    },
    {
      assetClass: 'Cash & Emergency Buffer',
      recommendedPercent: targetCash,
      whyRecommended:
        emergencyNeeded > 0
          ? `Allocates ₹${emergencyNeeded.toLocaleString('en-IN')} (6 months living expenses at ₹${cashflow.monthlyExpenses.toLocaleString('en-IN')}/mo) in ultra-safe liquid funds so you never distress-sell long-term investments during contingencies.`
          : 'Maintains tactical liquidity for monthly EMIs, unexpected medical contingencies, and opportunistic market dip buys.',
      topInstruments: [
        'Liquid Mutual Funds (Instant T+1 redemption)',
        'High-Yield Auto-Sweep Savings Account',
        '7-Day to 90-Day Short-Term Bank FDs',
      ],
      expectedReturn: '6.0% – 6.8% p.a.',
      riskLevel: 'Zero Volatility / 100% Instant Liquidity',
      taxRule: 'Taxed at income tax slab rate',
    },
  ];

  // GOAL EXECUTION PLAN & ASSET REASONS
  const goalExecutionPlan: GoalExecutionPlanItem[] = [];
  const assetRecommendations: AssetRecommendationReason[] = [];

  for (const goal of goals) {
    const inflationAdjusted = Math.round(goal.targetAmount * Math.pow(1.06, goal.horizonYears));
    let assetClass = '';
    let reasonText = '';
    let taxText = '';
    let riskProfileText = '';
    let expectedAnnualReturn = 0.07;

    if (goal.horizonYears <= 3) {
      if (cashflow.taxBracketPercent >= 30) {
        assetClass = 'Arbitrage Mutual Funds';
        reasonText = `Selected for short-term horizon (${goal.horizonYears} yrs) with capital protection. Taxed at 20% STCG equity rates instead of 30% FD slab tax.`;
        taxText = 'Saves ~10% in tax leakage vs FDs';
      } else {
        assetClass = 'Short-Term Fixed Deposits';
        reasonText = `Selected for guaranteed 100% capital safety for a short horizon of ${goal.horizonYears} years.`;
        taxText = 'Standard slab interest tax';
      }
      riskProfileText = 'Low Volatility / Capital Preservation';
      expectedAnnualReturn = 0.07;
    } else if (goal.horizonYears <= 7) {
      assetClass = 'Balanced Advantage Funds';
      reasonText = `Selected for medium-term horizon (${goal.horizonYears} yrs) to capture equity upside while dynamically hedging market downturns.`;
      taxText = 'Equity tax treatment (12.5% LTCG)';
      riskProfileText = 'Moderate Risk / Growth & Stability';
      expectedAnnualReturn = 0.10;
    } else {
      assetClass = 'Nifty 50 Index & Flexi-Cap Funds';
      reasonText = `Selected for long-term compounding (${goal.horizonYears} yrs). Long horizons absorb market cycles and deliver max inflation-beating returns.`;
      taxText = '₹1.25 Lakh annual LTCG tax-free threshold';
      riskProfileText = 'High Growth / High Equity Compounding';
      expectedAnnualReturn = 0.13;
    }

    const months = goal.horizonYears * 12;
    const monthlyRate = expectedAnnualReturn / 12.0;
    const requiredSIP = months > 0 ? (inflationAdjusted * monthlyRate) / (Math.pow(1 + monthlyRate, months) - 1) : inflationAdjusted;

    goalExecutionPlan.push({
      goal: goal.type,
      originalTarget: goal.targetAmount,
      inflationAdjustedTarget: inflationAdjusted,
      horizonYears: goal.horizonYears,
      suggestedAssetClass: assetClass,
      requiredMonthlySip: Math.round(requiredSIP),
    });

    assetRecommendations.push({
      assetClass,
      goalType: goal.type,
      horizonLabel: `${goal.horizonYears} Years`,
      reasoning: reasonText,
      taxAdvantage: taxText,
      riskProfile: riskProfileText,
    });
  }

  // NET WORTH TRAJECTORY WITH REALISTIC GOAL DIPS
  const trajectory: NetWorthYearPoint[] = [];
  let expectedAssets = Math.max(0, netWorth.totalCurrentAssets);
  let pessimisticAssets = Math.max(0, netWorth.totalCurrentAssets);
  let optimisticAssets = Math.max(0, netWorth.totalCurrentAssets);
  const currentLiabilities = Math.max(0, netWorth.totalLiabilities || 0);

  const expectedRate = (targetEquity * 0.13 + targetDebt * 0.07 + targetGold * 0.09) / 100.0;
  const pessimisticRate = expectedRate - 0.035;
  const optimisticRate = expectedRate + 0.035;

  for (let y = 0; y <= yearsToRetire; y++) {
    const currentPointAge = age + y;
    const currentPointYear = 2026 + y;

    const remainingDebt = Math.max(0, currentLiabilities - (cashflow.monthlyEmis * 12.0 * y));
    const activeMonthlyEmi = remainingDebt > 0 ? cashflow.monthlyEmis : 0;
    const yearlySurplus = Math.max(0, (cashflow.monthlyIncome - cashflow.monthlyExpenses - activeMonthlyEmi) * 12.0);

    // Check if any goal matures this year
    let goalOutflowInYear = 0;
    const outflowNames: string[] = [];
    for (const g of goals) {
      if (g.horizonYears === y) {
        const infAdjustedGoal = g.targetAmount * Math.pow(1.06, g.horizonYears);
        goalOutflowInYear += infAdjustedGoal;
        outflowNames.push(g.type);
      }
    }

    if (y === 0) {
      trajectory.push({
        age: currentPointAge,
        year: currentPointYear,
        ageLabel: `Age ${currentPointAge}`,
        expectedNetWorth: Math.round(Math.max(0, expectedAssets)),
        pessimisticNetWorth: Math.round(Math.max(0, pessimisticAssets)),
        optimisticNetWorth: Math.round(Math.max(0, optimisticAssets)),
        isGoalDip: false,
      });
    } else {
      // Compound assets for the year with active new surplus investments
      expectedAssets = expectedAssets * (1 + expectedRate) + yearlySurplus;
      pessimisticAssets = pessimisticAssets * (1 + pessimisticRate) + yearlySurplus;
      optimisticAssets = optimisticAssets * (1 + optimisticRate) + yearlySurplus;

      if (goalOutflowInYear > 0) {
        // 1. PRE-GOAL PEAK POINT
        trajectory.push({
          age: currentPointAge,
          year: currentPointYear,
          ageLabel: `Age ${currentPointAge} (Pre-Goal)`,
          expectedNetWorth: Math.round(Math.max(0, expectedAssets)),
          pessimisticNetWorth: Math.round(Math.max(0, pessimisticAssets)),
          optimisticNetWorth: Math.round(Math.max(0, optimisticAssets)),
          isGoalDip: false,
        });

        // Deduct goal capital outflow (capped at available assets so assets cannot become negative)
        const outflow = Math.min(expectedAssets, goalOutflowInYear);
        expectedAssets -= outflow;
        pessimisticAssets = Math.max(0, pessimisticAssets - outflow);
        optimisticAssets = Math.max(0, optimisticAssets - outflow);

        // 2. POST-GOAL DIP POINT (GRAPH PLUNGES DOWN HERE)
        const goalTitle = outflowNames.join(', ');
        trajectory.push({
          age: currentPointAge,
          year: currentPointYear,
          ageLabel: `Age ${currentPointAge} (${goalTitle} Outflow)`,
          expectedNetWorth: Math.round(Math.max(0, expectedAssets)),
          pessimisticNetWorth: Math.round(Math.max(0, pessimisticAssets)),
          optimisticNetWorth: Math.round(Math.max(0, optimisticAssets)),
          isGoalDip: true,
          goalDipName: goalTitle,
          goalOutflowAmount: Math.round(outflow),
        });
      } else {
        trajectory.push({
          age: currentPointAge,
          year: currentPointYear,
          ageLabel: `Age ${currentPointAge}`,
          expectedNetWorth: Math.round(Math.max(0, expectedAssets)),
          pessimisticNetWorth: Math.round(Math.max(0, pessimisticAssets)),
          optimisticNetWorth: Math.round(Math.max(0, optimisticAssets)),
          isGoalDip: false,
        });
      }
    }
  }

  const projectedRetirementNetWorth = trajectory.length > 0 ? trajectory[trajectory.length - 1].expectedNetWorth : 0;

  // LAYER 2.5: MARKET-CAP TIERING & CONCENTRATION DRIFT
  const longestHorizon = goals.length > 0 ? Math.max(...goals.map(g => g.horizonYears || 5)) : yearsToRetire;
  const marketCapTargets = calculateMarketCapAllocation(age, riskIns.riskAppetite, longestHorizon);
  const concentrationAnalysis = analyzeConcentrationAndDrift(payload.holdings, marketCapTargets);

  const marketCapAllocation: MarketCapAllocationAnalysis = {
    targets: marketCapTargets,
    currentRatio: concentrationAnalysis.currentRatio,
    concentrationAlerts: concentrationAnalysis.concentrationAlerts,
    sectorBreakdown: concentrationAnalysis.sectorBreakdown,
  };

  // REBALANCE ACTIONS
  const rebalanceActions: string[] = [];
  if (emergencyNeeded > 0) {
    rebalanceActions.push(`Transfer ₹${emergencyNeeded.toLocaleString('en-IN')} from low-yield savings into Liquid Mutual Funds to secure your 6-month safety net.`);
  }
  const equityDiff = targetEquity - currentAllocation.equityPercent;
  if (Math.abs(equityDiff) >= 5) {
    if (equityDiff > 0) {
      rebalanceActions.push(`Increase Equity allocation by ${equityDiff.toFixed(0)}% (via monthly SIP into Nifty 50 Index and Flexi-Cap Funds).`);
    } else {
      rebalanceActions.push(`Rebalance Equity downwards by ${Math.abs(equityDiff).toFixed(0)}% to de-risk into Arbitrage/Debt instruments.`);
    }
  }
  if (netWorth.hasHighInterestDebt) {
    rebalanceActions.push('URGENT: Prioritize paying off credit card / high-interest debt (>20% APR) before initiating long-term equity SIPs.');
  }
  if (goalExecutionPlan.length > 0) {
    rebalanceActions.push(`Deploy monthly SIP of ₹${goalExecutionPlan[0].requiredMonthlySip.toLocaleString('en-IN')} towards "${goalExecutionPlan[0].goal}" in ${goalExecutionPlan[0].suggestedAssetClass}.`);
  }

  // Add concentration risk alerts to rebalance actions
  for (const alert of concentrationAnalysis.concentrationAlerts) {
    rebalanceActions.push(`[${alert.type}] ${alert.title}: ${alert.description}`);
  }

  return {
    currentAllocation,
    recommendedAllocation,
    netMonthlySurplus: surplus,
    emergencyBufferNeeded: emergencyNeeded,
    retirementAge,
    projectedRetirementNetWorth,
    assetClassRecommendations,
    goalExecutionPlan,
    assetRecommendations,
    netWorthTrajectory: trajectory,
    rebalanceActions,
    marketCapAllocation,
  };
}
