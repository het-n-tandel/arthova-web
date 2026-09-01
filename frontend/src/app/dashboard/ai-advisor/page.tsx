'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Sliders, Activity, HelpCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { usePortfolio } from '@/lib/hooks/use-portfolio';
import { AllocationDriftCard } from '@/components/charts/allocation-drift-card';
import { GoalExecutionCards } from '@/components/portfolio/goal-execution-cards';
import { NetWorthProjectionChart } from '@/components/charts/net-worth-projection-chart';
import { AIOnboardingWizard } from '@/components/onboarding/ai-onboarding-wizard';
import { AIInsightCard } from '@/components/portfolio/ai-insight-card';
import { aiInsights as staticAiInsights } from '@/lib/mock-data';

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
  const [isLoading, setIsLoading] = useState(true);

  // Load saved state from localStorage if present
  useEffect(() => {
    const saved = localStorage.getItem('arthova_ai_data');
    if (saved) {
      try {
        setAiData(JSON.parse(saved));
        setIsLoading(false);
      } catch (e) {}
    }
  }, []);

  const fetchAiRecommendation = async (customPayload?: any) => {
    setIsLoading(true);
    try {
      const payload = customPayload || {
        userDemographics: { age: 28, targetRetirementAge: 55, maritalStatus: 'married', childrenCount: 1, dependentParents: true },
        financialCashflow: { monthlyIncome: 120000, monthlyExpenses: 45000, monthlyEmis: 22000, taxBracketPercent: 30 },
        netWorthBreakdown: {
          totalCurrentAssets: portfolio.totalCurrent > 0 ? portfolio.totalCurrent : 1000000,
          assetBreakdownPercent: {
            equity: portfolio.totalCurrent > 0 ? ((portfolio.stockHoldings.reduce((s, h) => s + h.cmp * h.quantity, 0) + portfolio.mfHoldings.reduce((s, h) => s + h.cmp * h.quantity, 0)) / portfolio.totalCurrent) * 100 : 20,
            fdDebt: portfolio.totalCurrent > 0 ? (portfolio.fdHoldings.reduce((s, h) => s + h.computedCurrent, 0) / portfolio.totalCurrent) * 100 : 60,
            gold: portfolio.totalCurrent > 0 ? (portfolio.goldHoldings.reduce((s, h) => s + h.cmp * h.quantity, 0) / portfolio.totalCurrent) * 100 : 10,
            realEstate: portfolio.totalCurrent > 0 ? (portfolio.propHoldings.reduce((s, h) => s + h.computedCurrent, 0) / portfolio.totalCurrent) * 100 : 10,
          },
          totalLiabilities: portfolio.liabilityHoldings.reduce((s, h) => s + h.cmp, 0),
          hasHighInterestDebt: false,
        },
        riskAndInsurance: { riskAppetite: 'Medium', hasHealthInsurance: true, hasLifeInsurance: true, hasEmergencyFund: false },
        financialGoals: [
          { type: 'Car Purchase', targetAmount: 800000, horizonYears: 2 },
          { type: 'Child Education', targetAmount: 2500000, horizonYears: 12 },
        ],
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
      }
    } catch (e) {
      console.error('Failed to fetch AI Recommendation', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!aiData) {
      fetchAiRecommendation();
    }
  }, [portfolio.totalCurrent]);

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
            Tax-aware multi-asset allocation, life goal SIP plans, and Monte Carlo retirement projections
          </p>
        </div>
        <button
          onClick={() => setIsWizardOpen(true)}
          className="flex items-center gap-2 bg-accent-brass hover:bg-accent-brass-dim text-bg-base px-4 py-2 rounded-[8px] text-[13px] font-medium transition-colors shadow-md"
        >
          <Sliders className="w-4 h-4" />
          Calibrate Profile Inputs
        </button>
      </motion.div>

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

      {/* AI Goal Execution Plan Cards */}
      {!isLoading && aiData?.goalExecutionPlan && (
        <motion.div variants={itemVariants}>
          <GoalExecutionCards goals={aiData.goalExecutionPlan} />
        </motion.div>
      )}

      {/* WHY ASSETS WERE RECOMMENDED (AI EXPLANATION CARDS) */}
      {!isLoading && aiData?.assetRecommendations && (
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-accent-brass" />
            <h2 className="text-[16px] font-medium text-text-primary">Why These Assets Were Recommended</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiData.assetRecommendations.map((rec: any, idx: number) => (
              <div key={idx} className="bg-bg-surface border border-border-default hover:border-accent-brass/40 rounded-[12px] p-5 space-y-3 transition-all">
                <div className="flex items-center justify-between border-b border-border-default pb-2">
                  <span className="text-[14px] font-medium text-text-primary flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-positive" />
                    {rec.assetClass}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-bg-surface-2 text-accent-brass font-mono">
                    {rec.goalType} ({rec.horizonLabel})
                  </span>
                </div>
                <p className="text-[12.5px] text-text-secondary leading-relaxed">{rec.reasoning}</p>
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
        onClose={() => setIsWizardOpen(false)}
        onSuccess={(data) => {
          setAiData(data);
          localStorage.setItem('arthova_ai_data', JSON.stringify(data));
        }}
      />
    </motion.div>
  );
}
