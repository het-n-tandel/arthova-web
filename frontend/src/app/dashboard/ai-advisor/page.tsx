'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  Flame,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  BarChart3,
  Percent,
  SlidersHorizontal,
} from 'lucide-react';
import { usePortfolio } from '@/lib/hooks/use-portfolio';
import { AllocationDriftCard } from '@/components/charts/allocation-drift-card';
import { MarketCapBreakdownCard } from '@/components/charts/market-cap-breakdown-card';
import { SmartRebalancerCard } from '@/components/charts/smart-rebalancer-card';
import { GoalExecutionCards } from '@/components/portfolio/goal-execution-cards';
import { NetWorthProjectionChart } from '@/components/charts/net-worth-projection-chart';
import { StressTestingCard } from '@/components/charts/stress-testing-card';
import { StrategyBenchmarkCard } from '@/components/charts/strategy-benchmark-card';
import { AIOnboardingWizard } from '@/components/onboarding/ai-onboarding-wizard';
import { AIInsightCard } from '@/components/portfolio/ai-insight-card';
import { QVMScoringCard } from '@/components/portfolio/qvm-scoring-card';
import { SentimentCatalystCard } from '@/components/portfolio/sentiment-catalyst-card';
import { aiInsights as staticAiInsights } from '@/lib/mock-data';
import { formatINR, formatINRCompact, cn } from '@/lib/formatters';

type TabKey = 'overview' | 'rebalancer' | 'qvm' | 'risk' | 'goals' | 'stress-test' | 'benchmarks';

interface TabItem {
  id: TabKey;
  label: string;
  icon: any;
  shortLabel: string;
  badge?: string;
  badgeType?: 'alert' | 'success' | 'new' | 'neutral';
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
};

function AIAdvisorContent() {
  const portfolio = usePortfolio();
  const searchParams = useSearchParams();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [aiData, setAiData] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Tab State
  const initialTab = (searchParams.get('tab') as TabKey) || 'overview';
  const [activeTab, setActiveTab] = useState<TabKey>(
    ['overview', 'rebalancer', 'qvm', 'risk', 'goals', 'stress-test', 'benchmarks'].includes(initialTab) ? initialTab : 'overview'
  );

  const handleTabChange = (tabId: TabKey) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tabId);
    window.history.replaceState(null, '', `?${params.toString()}`);
  };

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

      // 3. Purge any legacy cached data with negative values
      const savedData = localStorage.getItem('arthova_ai_data');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          const hasNegative =
            !parsed ||
            (parsed.projectedRetirementNetWorth || 0) <= 0 ||
            parsed.netWorthTrajectory?.some((pt: any) => (pt.expectedNetWorth || 0) < 0);
          if (parsed && parsed.marketCapAllocation && !hasNegative && parsed.projectedRetirementNetWorth > 0) {
            setAiData(parsed);
            setIsLoading(false);
            return;
          } else {
            localStorage.removeItem('arthova_ai_data');
          }
        } catch (e) {
          localStorage.removeItem('arthova_ai_data');
        }
      }

      // 4. Generate recommendation with either loaded profile or live portfolio defaults
      await fetchAiRecommendation(loadedProfile);
    };

    initData();
  }, [portfolio.totalCurrent, portfolio.liabilityHoldings.length, portfolio.rawHoldings.length]);

  const sanitizeRecommendation = (data: any) => {
    if (!data) return data;
    const traj = (data.netWorthTrajectory || []).map((pt: any) => ({
      ...pt,
      expectedNetWorth: Math.max(0, Math.round(pt.expectedNetWorth || 0)),
      optimisticNetWorth: Math.max(0, Math.round(pt.optimisticNetWorth || 0)),
      pessimisticNetWorth: Math.max(0, Math.round(pt.pessimisticNetWorth || 0)),
    }));
    const lastPt = traj.length > 0 ? traj[traj.length - 1].expectedNetWorth : 0;
    const proj = Math.max(0, data.projectedRetirementNetWorth > 0 ? data.projectedRetirementNetWorth : lastPt);
    return {
      ...data,
      projectedRetirementNetWorth: proj,
      netWorthTrajectory: traj,
    };
  };

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
      const hasHighInterestDebt = portfolio.liabilityHoldings.some((h) => parseFloat(h.metadata?.interestRate || '0') > 11.5);

      const salaryH = portfolio.cashHoldings.find((h) => h.name.toLowerCase().includes('salary') || (h as any).isSalary);
      const salaryAmount = salaryH ? (salaryH.quantity || 0) : 100000;

      const basePayload = customPayload || {
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

      const payload = {
        ...basePayload,
        holdings: customPayload?.holdings || portfolio.stockHoldings,
      };

      const res = await fetch('/api/ai/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const rawData = await res.json();
        const data = sanitizeRecommendation(rawData);
        setAiData(data);
        localStorage.setItem('arthova_ai_data', JSON.stringify(data));
        if (!userProfile) {
          setUserProfile(payload);
          localStorage.setItem('arthova_user_profile', JSON.stringify(payload));
        }
      }
    } catch (err) {
      console.error('Error fetching AI recommendation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWizardSuccess = (profileOrData: any, maybeData?: any) => {
    const profile = profileOrData?.userDemographics
      ? profileOrData
      : maybeData?.userDemographics
      ? maybeData
      : profileOrData;
    const recData = profileOrData?.recommendedAllocation
      ? profileOrData
      : maybeData?.recommendedAllocation
      ? maybeData
      : null;

    setUserProfile(profile);
    localStorage.setItem('arthova_user_profile', JSON.stringify(profile));

    if (recData && recData.projectedRetirementNetWorth > 0) {
      const clean = sanitizeRecommendation(recData);
      setAiData(clean);
      localStorage.setItem('arthova_ai_data', JSON.stringify(clean));
    }
    fetchAiRecommendation(profile);
  };

  const handleAddGoal = async (newGoal: { type: string; targetAmount: number; horizonYears: number }) => {
    const currentGoals = userProfile?.financialGoals || [];
    const updatedGoals = [...currentGoals, newGoal];
    const updatedProfile = {
      ...userProfile,
      financialGoals: updatedGoals,
    };
    setUserProfile(updatedProfile);
    localStorage.setItem('arthova_user_profile', JSON.stringify(updatedProfile));

    try {
      await fetch('/api/ai/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile),
      });
    } catch (e) {
      console.warn('Could not save goal to DB:', e);
    }

    await fetchAiRecommendation(updatedProfile);
  };

  const handleDeleteGoal = async (index: number) => {
    const currentGoals = userProfile?.financialGoals || [];
    const updatedGoals = currentGoals.filter((_: any, i: number) => i !== index);
    const updatedProfile = {
      ...userProfile,
      financialGoals: updatedGoals,
    };
    setUserProfile(updatedProfile);
    localStorage.setItem('arthova_user_profile', JSON.stringify(updatedProfile));

    try {
      await fetch('/api/ai/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile),
      });
    } catch (e) {
      console.warn('Could not delete goal from DB:', e);
    }

    await fetchAiRecommendation(updatedProfile);
  };

  // Profile data summary
  const activeAge = userProfile?.userDemographics?.age || userProfile?.calculatedAge || 28;
  const activeRetireAge = userProfile?.userDemographics?.targetRetirementAge || 55;
  const activeIncome = userProfile?.financialCashflow?.monthlyIncome || 100000;
  const activeExpenses = userProfile?.financialCashflow?.monthlyExpenses || 40000;
  const activeEmis = userProfile?.financialCashflow?.monthlyEmis || 0;
  const activeSurplus = Math.max(0, activeIncome - activeExpenses - activeEmis);

  // Active risk alerts count
  const alertCount = aiData?.marketCapAllocation?.concentrationAlerts?.length || 0;

  // Tabs Definition with contextual badges
  const tabs: TabItem[] = useMemo(() => [
    {
      id: 'overview',
      label: 'Overview & Health',
      shortLabel: 'Overview',
      icon: Activity,
    },
    {
      id: 'rebalancer',
      label: 'Smart Rebalancer',
      shortLabel: 'Rebalancer',
      icon: SlidersHorizontal,
      badge: 'QVM Model',
      badgeType: 'neutral',
    },
    {
      id: 'qvm',
      label: 'QVM Quant Lab',
      shortLabel: 'Quant Lab',
      icon: Cpu,
      badge: 'F-Score ≥ 8',
      badgeType: 'neutral',
    },
    {
      id: 'risk',
      label: 'Risk & Guardrails',
      shortLabel: 'Risk',
      icon: ShieldAlert,
      badge: alertCount > 0 ? `${alertCount} Alerts` : 'Safe',
      badgeType: alertCount > 0 ? 'alert' : 'success',
    },
    {
      id: 'goals',
      label: 'Goal Sinking Funds',
      shortLabel: 'Goals',
      icon: Target,
      badge: aiData?.goalExecutionPlan?.length ? `${aiData.goalExecutionPlan.length} Goals` : undefined,
      badgeType: 'neutral',
    },
    {
      id: 'stress-test',
      label: 'Stress Testing',
      shortLabel: 'Stress Test',
      icon: Flame,
      badge: 'New',
      badgeType: 'new',
    },
    {
      id: 'benchmarks',
      label: 'DRL Benchmarks',
      shortLabel: 'AI Models',
      icon: Cpu,
      badge: 'Dey et al.',
      badgeType: 'new',
    },
  ], [alertCount, aiData?.goalExecutionPlan?.length]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Flagship Header Banner */}
      <motion.div
        variants={itemVariants}
        className="bg-bg-surface/85 backdrop-blur-2xl border border-border-default hover:border-accent-brass/30 rounded-[16px] p-6 shadow-md relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent-brass/30 via-accent-brass/20 to-teal-500/20 border border-accent-brass/40 flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-accent-brass" />
              </div>
              <h1 className="text-[22px] font-semibold text-text-primary tracking-tight">
                Arthova AI Quantitative Advisory Suite
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] uppercase font-mono font-bold bg-accent-brass/15 text-accent-brass border border-accent-brass/30">
                PRO QUANT ENGINE
              </span>
            </div>
            <p className="text-[13px] text-text-secondary">
              SEBI RIA & PMS institutional framework • Stanford Piotroski F-Scores • Monte Carlo Retirement Simulators
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-bg-surface-2 border border-border-default hover:border-accent-brass/50 text-[12px] font-medium text-text-secondary hover:text-text-primary transition-all cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 text-accent-brass" />
              <span>How Predictions Work</span>
              {showHowItWorks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              onClick={() => setIsWizardOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-accent-brass hover:bg-accent-brass-dim text-bg-base font-semibold text-[12.5px] transition-all cursor-pointer shadow-sm"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Calibrate Profile</span>
            </button>
          </div>
        </div>

        {/* Profile Demographics Pill Strip */}
        <div className="mt-4 pt-3.5 border-t border-border-default flex flex-wrap items-center gap-3 text-[12px] text-text-secondary">
          <div className="flex items-center gap-1.5 bg-bg-surface-2/70 px-2.5 py-1 rounded-[6px] border border-border-default font-mono">
            <Calendar className="w-3.5 h-3.5 text-accent-brass" />
            <span>Age: <strong className="text-text-primary">{activeAge}y</strong></span>
            <span className="text-text-faint">→</span>
            <span>Retire: <strong className="text-accent-brass">{activeRetireAge}y</strong></span>
          </div>

          <div className="flex items-center gap-1.5 bg-bg-surface-2/70 px-2.5 py-1 rounded-[6px] border border-border-default font-mono">
            <Wallet className="w-3.5 h-3.5 text-positive" />
            <span>Income: <strong className="text-text-primary">{formatINRCompact(activeIncome)}/mo</strong></span>
          </div>

          <div className="flex items-center gap-1.5 bg-bg-surface-2/70 px-2.5 py-1 rounded-[6px] border border-border-default font-mono">
            <TrendingUp className="w-3.5 h-3.5 text-accent-brass" />
            <span>Investible Surplus: <strong className="text-accent-brass">{formatINR(activeSurplus)}/mo</strong></span>
          </div>

          {activeEmis > 0 && (
            <div className="flex items-center gap-1.5 bg-bg-surface-2/70 px-2.5 py-1 rounded-[6px] border border-border-default font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-warning" />
              <span>Active EMIs: <strong className="text-warning">{formatINR(activeEmis)}/mo</strong></span>
            </div>
          )}
        </div>
      </motion.div>

      {/* HOW AND WHERE PREDICTIONS ARE DONE EXPLAINER MODAL/COLLAPSIBLE */}
      <AnimatePresence>
        {showHowItWorks && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-bg-surface border border-border-default rounded-[14px] p-5 space-y-4 shadow-lg overflow-hidden"
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
                  Checks for high-interest debt (&gt;12-20%) and mandates an emergency living expense buffer in liquid instruments before directing capital to equities.
                </p>
              </div>

              <div className="bg-bg-surface-2 p-3.5 rounded-[8px] border border-border-default space-y-2">
                <div className="flex items-center gap-2 text-accent-brass font-medium text-[12.5px]">
                  <span className="w-5 h-5 rounded-full bg-accent-brass text-bg-base flex items-center justify-center text-[11px] font-bold">3</span>
                  <span>Goal Sinking Fund & Dips</span>
                </div>
                <p className="text-[11.5px] text-text-secondary leading-relaxed">
                  Applies 6% inflation compounding to goal targets. When a goal matures, capital is deducted from portfolio assets, creating the realistic downward drop on the chart.
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
      </AnimatePresence>

      {/* DEDICATED DOCKED SUB-NAVIGATION BAR (STICKS CLEANLY UNDER TOP HEADER ON SCROLL) */}
      <motion.div
        variants={itemVariants}
        className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2.5 bg-bg-base/95 backdrop-blur-xl border-b border-border shadow-sm transition-all"
      >
        <div className="flex items-center justify-between gap-3 max-w-[1240px] mx-auto">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full">
            <div className="hidden sm:flex items-center gap-1.5 pr-2.5 mr-1 border-r border-border shrink-0 text-text-primary">
              <Sparkles className="w-3.5 h-3.5 text-accent-brass" />
              <span className="text-[12px] font-semibold tracking-tight">AI Advisor</span>
            </div>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-[8px] text-[12.5px] font-medium transition-all relative shrink-0 cursor-pointer select-none',
                    isActive
                      ? 'bg-accent-brass text-bg-base font-semibold shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-2'
                  )}
                >
                  <Icon className={cn('w-3.5 h-3.5 shrink-0', isActive ? 'text-bg-base' : 'text-text-faint')} />
                  <span>{tab.label}</span>

                  {tab.badge && (
                    <span
                      className={cn(
                        'text-[10px] font-mono px-1.5 py-0.2 rounded-full border',
                        isActive
                          ? 'bg-bg-base/20 text-bg-base border-bg-base/30'
                          : tab.badgeType === 'alert'
                          ? 'bg-negative/15 text-negative border-negative/30 font-bold'
                          : tab.badgeType === 'success'
                          ? 'bg-positive/15 text-positive border-positive/30'
                          : tab.badgeType === 'new'
                          ? 'bg-info-indigo-bg text-info-indigo border-info-indigo/30 font-bold'
                          : 'bg-bg-surface-3 text-text-faint border-border-default'
                      )}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Loading Spinner */}
      {isLoading && (
        <div className="flex flex-col items-center py-20 gap-3 border border-border-default rounded-[14px] bg-bg-surface/90 backdrop-blur-md">
          <div className="w-8 h-8 rounded-full border-2 border-accent-brass border-t-transparent animate-spin" />
          <p className="text-[13px] text-text-secondary font-medium">
            Running Hybrid AI Engine & Monte Carlo Simulations...
          </p>
        </div>
      )}

      {/* TAB CONTENT PANELS */}
      {!isLoading && aiData && (
        <AnimatePresence mode="wait">
          {/* TAB 1: OVERVIEW & HEALTH DIAGNOSTIC */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Diagnostic KPI Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-bg-surface/90 backdrop-blur-xl border border-border-default rounded-[12px] p-4 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-[11.5px] font-mono text-text-faint uppercase">
                    <span>Portfolio Health Score</span>
                    <ShieldCheck className="w-4 h-4 text-positive" />
                  </div>
                  <div className="text-[26px] font-medium font-mono text-positive">
                    {alertCount === 0 ? '92' : alertCount <= 2 ? '84' : '72'}/100
                  </div>
                  <p className="text-[11.5px] text-text-secondary">
                    {alertCount === 0 ? 'Institutional Grade Balance' : `${alertCount} concentration warnings flagged`}
                  </p>
                </div>

                <div className="bg-bg-surface/90 backdrop-blur-xl border border-border-default rounded-[12px] p-4 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-[11.5px] font-mono text-text-faint uppercase">
                    <span>Target vs Current Drift</span>
                    <Percent className="w-4 h-4 text-accent-brass" />
                  </div>
                  <div className="text-[26px] font-medium font-mono text-accent-brass">
                    {Math.abs(Math.round(aiData.recommendedAllocation.equityPercent - aiData.currentAllocation.equityPercent))}% Drift
                  </div>
                  <p className="text-[11.5px] text-text-secondary">
                    Equity target: {aiData.recommendedAllocation.equityPercent}% (Current: {aiData.currentAllocation.equityPercent}%)
                  </p>
                </div>

                <div className="bg-bg-surface/90 backdrop-blur-xl border border-border-default rounded-[12px] p-4 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-[11.5px] font-mono text-text-faint uppercase">
                    <span>Projected Wealth (Age {aiData.retirementAge || 55})</span>
                    <TrendingUp className="w-4 h-4 text-positive" />
                  </div>
                  <div className="text-[26px] font-medium font-mono text-text-primary">
                    {formatINRCompact(aiData.projectedRetirementNetWorth)}
                  </div>
                  <p className="text-[11.5px] text-text-secondary">
                    Monte Carlo expected compounding
                  </p>
                </div>

                <div className="bg-bg-surface/90 backdrop-blur-xl border border-border-default rounded-[12px] p-4 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-[11.5px] font-mono text-text-faint uppercase">
                    <span>Safety Buffer Required</span>
                    <Wallet className="w-4 h-4 text-info-indigo" />
                  </div>
                  <div className="text-[26px] font-medium font-mono text-text-primary">
                    {formatINRCompact(aiData.emergencyBufferNeeded || 240000)}
                  </div>
                  <p className="text-[11.5px] text-text-secondary">
                    6-month mandatory liquid cushion
                  </p>
                </div>
              </div>

              {/* Asset Allocation Drift Card */}
              <AllocationDriftCard
                current={aiData.currentAllocation}
                recommended={aiData.recommendedAllocation}
                netWorth={portfolio.totalCurrent}
              />

              {/* Net Worth Retirement Projection Chart */}
              <NetWorthProjectionChart
                data={aiData.netWorthTrajectory}
                retirementAge={aiData.retirementAge}
                projectedRetirementNetWorth={aiData.projectedRetirementNetWorth}
              />

              {/* Why Assets Were Recommended Cards */}
              {aiData?.assetClassRecommendations && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-accent-brass" />
                      <h2 className="text-[16px] font-medium text-text-primary">
                        Why These Assets Were Recommended
                      </h2>
                    </div>
                    <span className="text-[12px] text-text-faint">Institutional Multi-Asset Rationale</span>
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
                          className="bg-bg-surface/90 backdrop-blur-xl border border-border-default hover:border-accent-brass/50 rounded-[12px] p-5 space-y-4 transition-all shadow-sm"
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
                              <span className="text-[15px] font-mono text-accent-brass font-bold">
                                {rec.recommendedPercent.toFixed(0)}%
                              </span>
                            </div>
                          </div>

                          <p className="text-[12.5px] text-text-secondary leading-relaxed">{rec.whyRecommended}</p>

                          {rec.topInstruments && rec.topInstruments.length > 0 && (
                            <div className="bg-bg-surface-2/70 p-3 rounded-[8px] space-y-1.5 border border-border-default">
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
                </div>
              )}

              {/* Action Plan & Insights */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-accent-brass" />
                  <h2 className="text-[16px] font-medium text-text-primary">Actionable Advisory Checklist</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {aiData?.rebalanceActions?.map((action: string, idx: number) => (
                    <div
                      key={idx}
                      className="bg-bg-surface/90 backdrop-blur-xl border border-border-default rounded-[12px] p-4 space-y-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2 text-accent-brass text-[12px] font-medium">
                        <Sparkles className="w-3.5 h-3.5" /> Action #{idx + 1}
                      </div>
                      <p className="text-[13px] text-text-primary leading-relaxed">{action}</p>
                    </div>
                  )) || staticAiInsights.slice(0, 3).map((insight) => (
                    <AIInsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              </div>

              {/* Real-time Market News & Sentiment Catalyst Analyzer (Dey et al. 2025) */}
              <SentimentCatalystCard symbol="NIFTY50" />
            </motion.div>
          )}

          {/* TAB 2: SMART MONTHLY REBALANCER & DEPLOYMENT */}
          {activeTab === 'rebalancer' && (
            <motion.div
              key="rebalancer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <SmartRebalancerCard
                current={aiData.currentAllocation}
                recommended={aiData.recommendedAllocation}
                netWorth={portfolio.totalCurrent}
                defaultMonthlySurplus={aiData.netMonthlySurplus || 25000}
                goals={aiData.goalExecutionPlan || []}
                marketCapAllocation={aiData.marketCapAllocation}
              />
            </motion.div>
          )}

          {/* TAB 3: QVM QUANT SCREENER & FACTOR LAB */}
          {activeTab === 'qvm' && (
            <motion.div
              key="qvm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <QVMScoringCard />
            </motion.div>
          )}

          {/* TAB 4: RISK, CONCENTRATION & GUARDRAILS */}
          {activeTab === 'risk' && (
            <motion.div
              key="risk"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {aiData?.marketCapAllocation && (
                <MarketCapBreakdownCard
                  marketCapAllocation={aiData.marketCapAllocation}
                  isLoading={isLoading}
                />
              )}

              {/* Debt & Cashflow Health Guardrail */}
              <div className="bg-bg-surface/90 backdrop-blur-xl border border-border-default rounded-[14px] p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4 text-warning" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-text-primary">Debt Servicing & Insolvency Guardrail</h3>
                    <p className="text-[12px] text-text-faint">Institutional limits on Debt-to-Income and High-Cost Credit</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  <div className="bg-bg-surface-2/70 p-4 rounded-[10px] border border-border-default space-y-1">
                    <span className="text-[11px] font-mono uppercase text-text-faint">Monthly EMI Ratio</span>
                    <div className="text-[20px] font-mono font-medium text-text-primary">
                      {activeIncome > 0 ? ((activeEmis / activeIncome) * 100).toFixed(1) : 0}%
                    </div>
                    <span className="text-[11px] text-text-secondary">
                      {activeIncome > 0 && (activeEmis / activeIncome) > 0.4 ? '⚠️ Exceeds 40% safe ceiling' : '✓ Well within 40% safe limit'}
                    </span>
                  </div>

                  <div className="bg-bg-surface-2/70 p-4 rounded-[10px] border border-border-default space-y-1">
                    <span className="text-[11px] font-mono uppercase text-text-faint">High Interest Debt (&gt;12%)</span>
                    <div className="text-[20px] font-mono font-medium text-positive">
                      {userProfile?.netWorthBreakdown?.hasHighInterestDebt ? 'Detected' : 'None Active'}
                    </div>
                    <span className="text-[11px] text-text-secondary">
                      {userProfile?.netWorthBreakdown?.hasHighInterestDebt ? 'Prioritize payoff before equity SIPs' : '✓ Zero toxic compounding liabilities'}
                    </span>
                  </div>

                  <div className="bg-bg-surface-2/70 p-4 rounded-[10px] border border-border-default space-y-1">
                    <span className="text-[11px] font-mono uppercase text-text-faint">Emergency Runway</span>
                    <div className="text-[20px] font-mono font-medium text-accent-brass">
                      6 Months Buffer
                    </div>
                    <span className="text-[11px] text-text-secondary">
                      Target: {formatINR(activeExpenses * 6)} in liquid instruments
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: GOAL SINKING FUNDS */}
          {activeTab === 'goals' && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {aiData?.goalExecutionPlan && (
                <GoalExecutionCards
                  goals={aiData.goalExecutionPlan}
                  onAddGoal={handleAddGoal}
                  onDeleteGoal={handleDeleteGoal}
                />
              )}

              {/* Goal-Specific Tax & Asset Selection Rationale */}
              {aiData?.assetRecommendations && aiData.assetRecommendations.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-accent-brass" />
                    <h2 className="text-[16px] font-medium text-text-primary">
                      Goal-Specific Tax & Asset Selection Rationale
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiData.assetRecommendations.map((rec: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-bg-surface/90 backdrop-blur-xl border border-border-default hover:border-accent-brass/40 rounded-[12px] p-4 space-y-2.5 transition-all shadow-sm"
                      >
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
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 6: PORTFOLIO STRESS TESTING & SHOCK SIMULATOR */}
          {activeTab === 'stress-test' && (
            <motion.div
              key="stress-test"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <StressTestingCard
                netWorthBreakdown={
                  userProfile?.netWorthBreakdown || {
                    totalCurrentAssets: portfolio.totalCurrent || 1000000,
                    assetBreakdownPercent: {
                      equity: aiData.currentAllocation.equityPercent,
                      fdDebt: aiData.currentAllocation.debtPercent,
                      gold: aiData.currentAllocation.goldPercent,
                      realEstate: 0,
                      cash: aiData.currentAllocation.cashPercent,
                    },
                  }
                }
              />
            </motion.div>
          )}

          {/* TAB 7: ML & DRL BENCHMARKS (DEY ET AL. 2025) */}
          {activeTab === 'benchmarks' && (
            <motion.div
              key="benchmarks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <StrategyBenchmarkCard />
            </motion.div>
          )}
        </AnimatePresence>
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

export default function AIAdvisorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent-brass border-t-transparent animate-spin" />
          <p className="text-[13px] text-text-secondary">Loading AI Quantitative Suite...</p>
        </div>
      }
    >
      <AIAdvisorContent />
    </Suspense>
  );
}
