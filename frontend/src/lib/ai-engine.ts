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
  realEstate: number;
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
    equityPercent: netWorth.assetBreakdownPercent?.equity ?? 20,
    debtPercent: netWorth.assetBreakdownPercent?.fdDebt ?? 60,
    goldPercent: netWorth.assetBreakdownPercent?.gold ?? 10,
    cashPercent: netWorth.assetBreakdownPercent?.realEstate ?? 10,
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
  let expectedAssets = netWorth.totalCurrentAssets;
  let pessimisticAssets = netWorth.totalCurrentAssets;
  let optimisticAssets = netWorth.totalCurrentAssets;
  const currentLiabilities = netWorth.totalLiabilities || 0;

  const annualInvestCapacity = surplus * 12.0;
  const expectedRate = (targetEquity * 0.13 + targetDebt * 0.07 + targetGold * 0.09) / 100.0;
  const pessimisticRate = expectedRate - 0.035;
  const optimisticRate = expectedRate + 0.035;

  for (let y = 0; y <= yearsToRetire; y++) {
    const currentPointAge = age + y;
    const currentPointYear = 2026 + y;
    const paydownLiabilities = Math.max(0, currentLiabilities - (cashflow.monthlyEmis * 12.0 * y));

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
        expectedNetWorth: Math.round(expectedAssets - paydownLiabilities),
        pessimisticNetWorth: Math.round(pessimisticAssets - paydownLiabilities),
        optimisticNetWorth: Math.round(optimisticAssets - paydownLiabilities),
        isGoalDip: false,
      });
    } else {
      // Compound assets for the year
      expectedAssets = (expectedAssets + annualInvestCapacity) * (1 + expectedRate);
      pessimisticAssets = (pessimisticAssets + annualInvestCapacity) * (1 + pessimisticRate);
      optimisticAssets = (optimisticAssets + annualInvestCapacity) * (1 + optimisticRate);

      if (goalOutflowInYear > 0) {
        // 1. PRE-GOAL PEAK POINT
        trajectory.push({
          age: currentPointAge,
          year: currentPointYear,
          ageLabel: `Age ${currentPointAge} (Pre-Goal)`,
          expectedNetWorth: Math.round(expectedAssets - paydownLiabilities),
          pessimisticNetWorth: Math.round(pessimisticAssets - paydownLiabilities),
          optimisticNetWorth: Math.round(optimisticAssets - paydownLiabilities),
          isGoalDip: false,
        });

        // Deduct goal capital outflow
        expectedAssets = Math.max(0, expectedAssets - goalOutflowInYear);
        pessimisticAssets = Math.max(0, pessimisticAssets - goalOutflowInYear);
        optimisticAssets = Math.max(0, optimisticAssets - goalOutflowInYear);

        // 2. POST-GOAL DIP POINT (GRAPH PLUNGES DOWN HERE)
        const goalTitle = outflowNames.join(', ');
        trajectory.push({
          age: currentPointAge,
          year: currentPointYear,
          ageLabel: `Age ${currentPointAge} (${goalTitle} Outflow)`,
          expectedNetWorth: Math.round(expectedAssets - paydownLiabilities),
          pessimisticNetWorth: Math.round(pessimisticAssets - paydownLiabilities),
          optimisticNetWorth: Math.round(optimisticAssets - paydownLiabilities),
          isGoalDip: true,
          goalDipName: goalTitle,
          goalOutflowAmount: Math.round(goalOutflowInYear),
        });
      } else {
        trajectory.push({
          age: currentPointAge,
          year: currentPointYear,
          ageLabel: `Age ${currentPointAge}`,
          expectedNetWorth: Math.round(expectedAssets - paydownLiabilities),
          pessimisticNetWorth: Math.round(pessimisticAssets - paydownLiabilities),
          optimisticNetWorth: Math.round(optimisticAssets - paydownLiabilities),
          isGoalDip: false,
        });
      }
    }
  }

  const projectedRetirementNetWorth = trajectory.length > 0 ? trajectory[trajectory.length - 1].expectedNetWorth : 0;

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
  };
}
