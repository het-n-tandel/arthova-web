'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Sliders,
  Activity,
  HelpCircle,
  TrendingUp,
  Landmark,
  Coins,
  Banknote,
  ListPlus,
  Cpu,
  Target,
  ArrowRight,
  Calculator,
  Calendar,
  Wallet,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { usePortfolio } from '@/lib/hooks/use-portfolio';
import { AllocationDriftCard } from '@/components/charts/allocation-drift-card';
import { SmartRebalancerCard } from '@/components/charts/smart-rebalancer-card';
import { GoalExecutionCards } from '@/components/portfolio/goal-execution-cards';
import { NetWorthProjectionChart } from '@/components/charts/net-worth-projection-chart';
import { AIOnboardingWizard } from '@/components/onboarding/ai-onboarding-wizard';
import { AIInsightCard } from '@/components/portfolio/ai-insight-card';
import { aiInsights as staticAiInsights } from '@/lib/mock-data';
import { formatINR, formatINRCompact } from '@/lib/formatters';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
};

export default function AIAdvisorPage() {
  const portfolio = usePortfolio();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [aiData, setAiData] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Load saved state on mount
  useEffect(() => {
    const initData = async () => {
      let loadedProfile: any = null;

      // 1. Check localStorage for user profile
      const localProfileStr = localStorage.getItem('arthova_user_profile');
      if (localProfileStr) {
        try {
          loadedProfile = JSON.parse(localProfileStr);
        } catch (e) {}
      }

      // 2. If not in localStorage, attempt to fetch from backend/DB
      if (!loadedProfile) {
        try {
          const profileRes = await fetch('/api/ai/profile');
          if (profileRes.ok) {
            const profile = await profileRes.json();
            if (profile && profile.userDemographics) {
              loadedProfile = profile;
              localStorage.setItem('arthova_user_profile', JSON.stringify(profile));
            }
          }
        } catch (e) {}
      }

      if (loadedProfile) {
        setUserProfile(loadedProfile);
      }

      // 3. Check for cached AI recommendation data
      const savedData = localStorage.getItem('arthova_ai_data');
      if (savedData) {
        try {
          setAiData(JSON.parse(savedData));
          setIsLoading(false);
          return;
        } catch (e) {}
      }

      // 4. Generate recommendation with either loaded profile or live portfolio defaults
      await fetchAiRecommendation(loadedProfile);
    };

    initData();
  }, [portfolio.totalCurrent, portfolio.liabilityHoldings.length, portfolio.rawHoldings.length]);

  const fetchAiRecommendation = async (customPayload?: any) => {
    setIsLoading(true);
    try {
      const liveTotal = portfolio.totalCurrent || 0;
      const equityVal =
        portfolio.stockHoldings.reduce((s, h) => s + (h.cmp || 0) * (h.quantity || 0), 0) +
        portfolio.mfHoldings.reduce((s, h) => s + (h.cmp || 0) * (h.quantity || 0), 0);
      const fdVal =
        portfolio.fdHoldings.reduce((s, h) => s + (h.computedCurrent || h.cmp || 0), 0) +
        portfolio.bondHoldings.reduce((s, h) => s + (h.cmp || 0) * (h.quantity || 0), 0);
      const goldVal = portfolio.goldHoldings.reduce((s, h) => s + (h.cmp || 0) * (h.quantity || 0), 0);
      const propVal = portfolio.propHoldings.reduce((s, h) => s + (h.computedCurrent || h.cmp || 0), 0);
      const cashVal = portfolio.cashHoldings.reduce((s, h) => s + (h.computedValue || h.quantity || 0), 0);
      const liabVal = portfolio.liabilityHoldings.reduce((s, h) => s + (h.computedValue ?? h.cmp ?? (h.quantity * h.avgCost)), 0);
      const totalEmis = portfolio.liabilityHoldings.reduce((s, h) => s + parseFloat(h.metadata?.emi || '0'), 0);
      const hasHighInterestDebt = portfolio.liabilityHoldings.some(h => parseFloat(h.metadata?.interestRate || '0') > 11.5);

      const salaryH = portfolio.cashHoldings.find(h => h.name.toLowerCase().includes('salary') || (h as any).isSalary);
      const salaryAmount = salaryH ? (salaryH.quantity || 0) : 100000;

      const payload = customPayload || {
        userDemographics: {
          age: userProfile?.userDemographics?.age || userProfile?.calculatedAge || 28,
          targetRetirementAge: userProfile?.userDemographics?.targetRetirementAge || 55,
          maritalStatus: userProfile?.userDemographics?.maritalStatus || 'single',
          childrenCount: 0,
          dependentParents: false,
        },
        financialCashflow: {
          monthlyIncome: salaryAmount,
          monthlyExpenses: Math.round(salaryAmount * 0.4),
          monthlyEmis: totalEmis > 0 ? totalEmis : (userProfile?.financialCashflow?.monthlyEmis || 0),
          taxBracketPercent: salaryAmount > 125000 ? 30 : salaryAmount > 60000 ? 20 : 10,
        },
        netWorthBreakdown: {
          totalCurrentAssets: liveTotal,
          assetBreakdownPercent: {
            equity: liveTotal > 0 ? (equityVal / liveTotal) * 100 : 0,
            fdDebt: liveTotal > 0 ? (fdVal / liveTotal) * 100 : 0,
            gold: liveTotal > 0 ? (goldVal / liveTotal) * 100 : 0,
            realEstate: liveTotal > 0 ? (propVal / liveTotal) * 100 : 0,
            cash: liveTotal > 0 ? (cashVal / liveTotal) * 100 : 0,
          },
          totalLiabilities: liabVal > 0 ? liabVal : (userProfile?.netWorthBreakdown?.totalLiabilities || 0),
          hasHighInterestDebt: hasHighInterestDebt || Boolean(userProfile?.netWorthBreakdown?.hasHighInterestDebt),
        },
        riskAndInsurance: { riskAppetite: 'Medium', hasHealthInsurance: true, hasLifeInsurance: true, hasEmergencyFund: false },
        financialGoals: userProfile?.financialGoals || [],
      };

      const res = await fetch('/api/ai/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setAiData(data);
        localStorage.setItem('arthova_ai_data', JSON.stringify(data));
        if (!userProfile) {
          setUserProfile(payload);
          localStorage.setItem('arthova_user_profile', JSON.stringify(payload));
        }
      }
    } catch (e) {
      console.error('Failed to fetch AI Recommendation', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWizardSuccess = (data: any, profile: any) => {
    setAiData(data);
    setUserProfile(profile);
    localStorage.setItem('arthova_ai_data', JSON.stringify(data));
    localStorage.setItem('arthova_user_profile', JSON.stringify(profile));
  };

  const activeAge = userProfile?.userDemographics?.age ?? 28;
  const activeRetireAge = userProfile?.userDemographics?.targetRetirementAge ?? 55;
  const activeIncome = userProfile?.financialCashflow?.monthlyIncome ?? 120000;
  const activeExpenses = userProfile?.financialCashflow?.monthlyExpenses ?? 45000;
  const activeEmis = userProfile?.financialCashflow?.monthlyEmis ?? 22000;
  const activeSurplus = aiData?.netMonthlySurplus ?? Math.max(0, activeIncome - activeExpenses - activeEmis);
  const activeTaxSlab = userProfile?.financialCashflow?.taxBracketPercent ?? 30;
  const activeRisk = userProfile?.riskAndInsurance?.riskAppetite ?? 'Medium';
  const activeGoals = userProfile?.financialGoals ?? [
    { type: 'Car Purchase', targetAmount: 800000, horizonYears: 2 },
    { type: 'Child Education', targetAmount: 2500000, horizonYears: 12 },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Page header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] text-text-primary mb-1 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent-brass" />
            AI Wealth & Allocation Advisor
          </h1>
          <p className="text-[13px] text-text-faint">
            Tax-aware multi-asset allocation, life goal SIP plans, and realistic goal-outflow retirement simulations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-border-default hover:bg-bg-surface-2 text-text-secondary text-[12.5px] font-medium transition-colors"
          >
            <Cpu className="w-4 h-4 text-accent-brass" />
            <span>How Calculations Work</span>
            {showHowItWorks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsWizardOpen(true)}
            className="flex items-center gap-2 bg-accent-brass hover:bg-accent-brass-dim text-bg-base px-4 py-2 rounded-[8px] text-[13px] font-medium transition-colors shadow-md"
          >
            <Sliders className="w-4 h-4" />
            Calibrate Profile
          </button>
        </div>
      </motion.div>

      {/* ACTIVE PROFILE PARAMETERS BANNER */}
      <motion.div variants={itemVariants} className="bg-bg-surface border border-border-default rounded-[12px] p-4.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-default pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-positive animate-pulse" />
            <span className="text-[12.5px] font-medium text-text-primary">Active Profile Parameters</span>
            <span className="text-[11px] text-text-faint">(Driving the AI predictions below)</span>
          </div>
          <button
            onClick={() => setIsWizardOpen(true)}
            className="text-[11.5px] text-accent-brass hover:underline flex items-center gap-1 font-medium"
          >
            Modify Inputs in Wizard <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-bg-surface-2 p-2.5 rounded-[8px] border border-border-default">
            <span className="text-[10.5px] text-text-faint block flex items-center gap-1">
              <Calendar className="w-3 h-3 text-accent-brass" /> Timeline
            </span>
            <span className="text-[13px] font-mono text-text-primary font-medium">
              Age {activeAge} → {activeRetireAge}
            </span>
            <span className="text-[10px] text-text-faint block mt-0.5">{activeRetireAge - activeAge} yrs horizon</span>
          </div>

          <div className="bg-bg-surface-2 p-2.5 rounded-[8px] border border-border-default">
            <span className="text-[10.5px] text-text-faint block flex items-center gap-1">
              <Wallet className="w-3 h-3 text-accent-brass" /> Monthly Surplus
            </span>
            <span className="text-[13px] font-mono text-positive font-medium">
              {formatINR(activeSurplus)}/mo
            </span>
            <span className="text-[10px] text-text-faint block mt-0.5">₹{(activeIncome / 1000).toFixed(0)}k in - ₹{((activeExpenses + activeEmis) / 1000).toFixed(0)}k out</span>
          </div>

          <div className="bg-bg-surface-2 p-2.5 rounded-[8px] border border-border-default">
            <span className="text-[10.5px] text-text-faint block flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-accent-brass" /> Tax Slab
            </span>
            <span className="text-[13px] font-mono text-text-primary font-medium">
              {activeTaxSlab}% Bracket
            </span>
            <span className="text-[10px] text-text-faint block mt-0.5">Tax-loss optimized</span>
          </div>

          <div className="bg-bg-surface-2 p-2.5 rounded-[8px] border border-border-default">
            <span className="text-[10.5px] text-text-faint block flex items-center gap-1">
              <Target className="w-3 h-3 text-accent-brass" /> Risk Profile
            </span>
            <span className="text-[13px] font-mono text-text-primary font-medium">
              {activeRisk} Risk
            </span>
            <span className="text-[10px] text-text-faint block mt-0.5">{(100 - activeAge)}% equity base</span>
          </div>

          <div className="bg-bg-surface-2 p-2.5 rounded-[8px] border border-border-default sm:col-span-2 lg:col-span-2">
            <span className="text-[10.5px] text-text-faint block flex items-center gap-1 mb-1">
              <Target className="w-3 h-3 text-accent-brass" /> Active Life Goals ({activeGoals.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeGoals.length > 0 ? (
                activeGoals.map((g: any, i: number) => (
                  <span
                    key={i}
                    className="bg-bg-base border border-border-default px-2 py-0.5 rounded text-[11px] font-mono text-text-secondary"
                  >
                    {g.type}: {formatINRCompact(g.targetAmount)} in {g.horizonYears}y
                  </span>
                ))
              ) : (
                <span className="text-[11.5px] text-text-faint font-mono">
                  Pure Wealth Compounding Mode (No goals)
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* HOW AND WHERE PREDICTIONS ARE DONE EXPLAINER */}
      {showHowItWorks && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-bg-surface border-2 border-accent-brass/30 rounded-[12px] p-5 space-y-4 shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-accent-brass" />
              <div>
                <h3 className="text-[15px] font-medium text-text-primary">
                  Where & How Predictions Are Calculated
                </h3>
                <p className="text-[12px] text-text-faint">
                  Transparency breakdown of Arthova&apos;s Hybrid Quantitative Wealth Engine
                </p>
              </div>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-accent-brass/10 text-accent-brass font-mono">
              Engine: /api/ai/recommendation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
            <div className="bg-bg-surface-2 p-3.5 rounded-[8px] border border-border-default space-y-2">
              <div className="flex items-center gap-2 text-accent-brass font-medium text-[12.5px]">
                <span className="w-5 h-5 rounded-full bg-accent-brass text-bg-base flex items-center justify-center text-[11px] font-bold">1</span>
                <span>Surplus & Cashflow</span>
              </div>
              <p className="text-[11.5px] text-text-secondary leading-relaxed">
                Computes investible capacity = <span className="font-mono text-text-primary">Income ({formatINR(activeIncome)}) - Living Expenses ({formatINR(activeExpenses)}) - Debt EMIs ({formatINR(activeEmis)}) = {formatINR(activeSurplus)}/mo</span>.
              </p>
            </div>

            <div className="bg-bg-surface-2 p-3.5 rounded-[8px] border border-border-default space-y-2">
              <div className="flex items-center gap-2 text-accent-brass font-medium text-[12.5px]">
                <span className="w-5 h-5 rounded-full bg-accent-brass text-bg-base flex items-center justify-center text-[11px] font-bold">2</span>
                <span>Safety & Debt Guardrail</span>
              </div>
              <p className="text-[11.5px] text-text-secondary leading-relaxed">
                Checks for high-interest debt (&gt;20%) and ensures a mandatory 6-month living expense buffer in liquid instruments before directing capital to equities.
              </p>
            </div>

            <div className="bg-bg-surface-2 p-3.5 rounded-[8px] border border-border-default space-y-2">
              <div className="flex items-center gap-2 text-accent-brass font-medium text-[12.5px]">
                <span className="w-5 h-5 rounded-full bg-accent-brass text-bg-base flex items-center justify-center text-[11px] font-bold">3</span>
                <span>Goal Sinking Fund & Dips</span>
              </div>
              <p className="text-[11.5px] text-text-secondary leading-relaxed">
                Applies 6% inflation compounding to goal targets. When a goal matures, the accumulated capital is deducted from portfolio assets, creating the realistic downward drop on the chart.
              </p>
            </div>

            <div className="bg-bg-surface-2 p-3.5 rounded-[8px] border border-border-default space-y-2">
              <div className="flex items-center gap-2 text-accent-brass font-medium text-[12.5px]">
                <span className="w-5 h-5 rounded-full bg-accent-brass text-bg-base flex items-center justify-center text-[11px] font-bold">4</span>
                <span>Monte Carlo Wealth Growth</span>
              </div>
              <p className="text-[11.5px] text-text-secondary leading-relaxed">
                Simulates multi-asset returns (Equity ~13%, Debt ~7%, Gold ~9%) year-by-year across Bull (+3.5%), Strategy, and Bear (-3.5%) market scenarios until retirement age {activeRetireAge}.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading Spinner State */}
      {isLoading && (
        <div className="flex flex-col items-center py-16 gap-3 border border-border-default rounded-[12px] bg-bg-surface">
          <div className="w-8 h-8 rounded-full border-2 border-accent-brass border-t-transparent animate-spin" />
          <p className="text-[13px] text-text-secondary font-medium">Running Hybrid AI Engine & Monte Carlo Simulations...</p>
        </div>
      )}

      {/* AI Target Allocation Drift Card */}
      {!isLoading && aiData && (
        <motion.div variants={itemVariants}>
          <AllocationDriftCard
            current={aiData.currentAllocation}
            recommended={aiData.recommendedAllocation}
            netWorth={portfolio.totalCurrent}
          />
        </motion.div>
      )}

      {/* Smart Monthly Rebalancer with 1-Click Execution */}
      {!isLoading && aiData && (
        <motion.div variants={itemVariants}>
          <SmartRebalancerCard
            current={aiData.currentAllocation}
            recommended={aiData.recommendedAllocation}
            netWorth={portfolio.totalCurrent}
            defaultMonthlySurplus={aiData.netMonthlySurplus || 25000}
            goals={aiData.goalExecutionPlan || []}
          />
        </motion.div>
      )}

      {/* AI Net Worth Retirement Projection Chart (WITH REALISTIC GOAL DIPS) */}
      {!isLoading && aiData && (
        <motion.div variants={itemVariants}>
          <NetWorthProjectionChart
            data={aiData.netWorthTrajectory}
            retirementAge={aiData.retirementAge}
            projectedRetirementNetWorth={aiData.projectedRetirementNetWorth}
          />
        </motion.div>
      )}

      {/* WHY STOCKS & ASSET CLASSES WERE RECOMMENDED (DETAILED EXPLANATION CARDS) */}
      {!isLoading && aiData?.assetClassRecommendations && (
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-accent-brass" />
              <h2 className="text-[16px] font-medium text-text-primary">Why These Assets & Stocks Were Recommended</h2>
            </div>
            <span className="text-[12px] text-text-faint">Hybrid Quantitative Rationale</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiData.assetClassRecommendations.map((rec: any, idx: number) => {
              const Icon = rec.assetClass.includes('Equity')
                ? TrendingUp
                : rec.assetClass.includes('Debt') || rec.assetClass.includes('Fixed')
                ? Landmark
                : rec.assetClass.includes('Gold')
                ? Coins
                : Banknote;

              return (
                <div
                  key={idx}
                  className="bg-bg-surface border border-border-default hover:border-accent-brass/50 rounded-[12px] p-5 space-y-4 transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between border-b border-border-default pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-accent-brass/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-accent-brass" />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-medium text-text-primary">{rec.assetClass}</h3>
                        <span className="text-[11px] text-text-faint font-mono">{rec.riskLevel}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-text-faint uppercase block">Target Weight</span>
                      <span className="text-[15px] font-mono text-accent-brass font-bold">{rec.recommendedPercent.toFixed(0)}%</span>
                    </div>
                  </div>

                  <p className="text-[12.5px] text-text-secondary leading-relaxed">{rec.whyRecommended}</p>

                  {/* Top Specific Recommended Instruments */}
                  {rec.topInstruments && rec.topInstruments.length > 0 && (
                    <div className="bg-bg-surface-2 p-3 rounded-[8px] space-y-1.5 border border-border-default">
                      <span className="text-[11px] font-medium text-text-primary flex items-center gap-1">
                        <ListPlus className="w-3.5 h-3.5 text-accent-brass" /> Top Recommended Instruments:
                      </span>
                      <ul className="space-y-1">
                        {rec.topInstruments.map((inst: string, i: number) => (
                          <li key={i} className="text-[11.5px] text-text-secondary flex items-start gap-1.5">
                            <span className="text-accent-brass">•</span>
                            <span>{inst}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between text-[11px] pt-1 border-t border-border-default gap-2">
                    <span className="text-positive font-medium">Expected: {rec.expectedReturn}</span>
                    <span className="text-text-faint font-mono text-[10.5px]">{rec.taxRule}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* AI Goal Execution Plan Cards */}
      {!isLoading && aiData?.goalExecutionPlan && (
        <motion.div variants={itemVariants}>
          <GoalExecutionCards goals={aiData.goalExecutionPlan} />
        </motion.div>
      )}

      {/* GOAL-SPECIFIC ASSET REASONING CARDS */}
      {!isLoading && aiData?.assetRecommendations && aiData.assetRecommendations.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-positive" />
            <h2 className="text-[16px] font-medium text-text-primary">Goal-Specific Tax & Asset Selection Rationale</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiData.assetRecommendations.map((rec: any, idx: number) => (
              <div key={idx} className="bg-bg-surface border border-border-default hover:border-accent-brass/40 rounded-[12px] p-4 space-y-2.5 transition-all">
                <div className="flex items-center justify-between border-b border-border-default pb-2">
                  <span className="text-[13.5px] font-medium text-text-primary flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-accent-brass" />
                    {rec.assetClass}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-bg-surface-2 text-accent-brass font-mono">
                    {rec.goalType} ({rec.horizonLabel})
                  </span>
                </div>
                <p className="text-[12px] text-text-secondary leading-relaxed">{rec.reasoning}</p>
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-positive font-medium">💡 Tax Advantage: {rec.taxAdvantage}</span>
                  <span className="text-text-faint font-mono">{rec.riskProfile}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Action Plan & Insights */}
      {!isLoading && (
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-accent-brass" />
            <h2 className="text-[16px] font-medium text-text-primary">AI Rebalance Action Plan</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiData?.rebalanceActions?.map((action: string, idx: number) => (
              <div key={idx} className="bg-bg-surface border border-border-default rounded-[12px] p-4 space-y-2">
                <div className="flex items-center gap-2 text-accent-brass text-[12px] font-medium">
                  <Sparkles className="w-3.5 h-3.5" /> Action #{idx + 1}
                </div>
                <p className="text-[13px] text-text-primary leading-relaxed">{action}</p>
              </div>
            )) || staticAiInsights.slice(0, 3).map((insight) => (
              <AIInsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Profile Calibration Wizard Modal */}
      <AIOnboardingWizard
        isOpen={isWizardOpen}
        initialProfile={userProfile}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={handleWizardSuccess}
      />
    </motion.div>
  );
}
