'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  TrendingUp, 
  Coins, 
  Landmark, 
  Banknote, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Info,
  Loader2,
  SlidersHorizontal,
  RotateCcw,
  RefreshCw,
  Brain,
  ChevronDown,
  Layers,
  Sparkles,
  Award,
  Check,
  PiggyBank
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { formatINR, formatINRCompact, cn } from '@/lib/formatters';
import { getMarketValuationInfo } from '@/lib/market-valuation-service';
import { MarketCapAllocationAnalysis } from '@/lib/ai-engine';
import { 
  getTopPicksByCategory, 
  getBestPickForMarketCap, 
  StockFactorData,
  MarketCapCategory,
  getTopMutualFundsByCategory,
  getBestMutualFundForMarketCap,
  MutualFundFactorData,
} from '@/lib/factor-scoring';

export interface GoalItem {
  goal: string;
  originalTarget: number;
  inflationAdjustedTarget: number;
  horizonYears: number;
  suggestedAssetClass: string;
  requiredMonthlySip: number;
}

interface Props {
  current: {
    equityPercent: number;
    debtPercent: number;
    goldPercent: number;
    cashPercent: number;
  };
  recommended: {
    equityPercent: number;
    debtPercent: number;
    goldPercent: number;
    cashPercent: number;
  };
  netWorth: number;
  defaultMonthlySurplus?: number;
  goals?: GoalItem[];
  marketCapAllocation?: MarketCapAllocationAnalysis;
  className?: string;
}

export function SmartRebalancerCard({
  current,
  recommended,
  netWorth,
  defaultMonthlySurplus = 25000,
  goals = [],
  marketCapAllocation,
  className
}: Props) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [deployAmount, setDeployAmount] = useState<number>(defaultMonthlySurplus > 0 ? defaultMonthlySurplus : 25000);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasInitializedFromPlan, setHasInitializedFromPlan] = useState(false);
  const [showQvmDetails, setShowQvmDetails] = useState<boolean>(true);

  // Investment Vehicle Mode: 'stocks' or 'mutual_funds'
  const [investmentMode, setInvestmentMode] = useState<'stocks' | 'mutual_funds'>('stocks');

  // Direct Stock factor options for each tier
  const largeCapOptions = useMemo(() => getTopPicksByCategory('Large Cap', 0), []);
  const midCapOptions = useMemo(() => getTopPicksByCategory('Mid Cap', 0), []);
  const smallCapOptions = useMemo(() => getTopPicksByCategory('Small Cap', 0), []);

  const [selectedLargeCapSym, setSelectedLargeCapSym] = useState<string>('TCS.NS');
  const [selectedMidCapSym, setSelectedMidCapSym] = useState<string>('POLYCAB.NS');
  const [selectedSmallCapSym, setSelectedSmallCapSym] = useState<string>('CDSL.NS');

  // Mutual Fund factor options for each tier
  const largeCapMFOptions = useMemo(() => getTopMutualFundsByCategory('Large Cap'), []);
  const midCapMFOptions = useMemo(() => getTopMutualFundsByCategory('Mid Cap'), []);
  const smallCapMFOptions = useMemo(() => getTopMutualFundsByCategory('Small Cap'), []);

  const [selectedLargeCapMF, setSelectedLargeCapMF] = useState<string>('122639');
  const [selectedMidCapMF, setSelectedMidCapMF] = useState<string>('118989');
  const [selectedSmallCapMF, setSelectedSmallCapMF] = useState<string>('118778');

  // Active stock profiles
  const activeLargePick: StockFactorData = useMemo(() => {
    return largeCapOptions.find(p => p.symbol === selectedLargeCapSym) || largeCapOptions[0] || getBestPickForMarketCap('Large Cap');
  }, [largeCapOptions, selectedLargeCapSym]);

  const activeMidPick: StockFactorData = useMemo(() => {
    return midCapOptions.find(p => p.symbol === selectedMidCapSym) || midCapOptions[0] || getBestPickForMarketCap('Mid Cap');
  }, [midCapOptions, selectedMidCapSym]);

  const activeSmallPick: StockFactorData = useMemo(() => {
    return smallCapOptions.find(p => p.symbol === selectedSmallCapSym) || smallCapOptions[0] || getBestPickForMarketCap('Small Cap');
  }, [smallCapOptions, selectedSmallCapSym]);

  // Active mutual fund profiles
  const activeLargeMF: MutualFundFactorData = useMemo(() => {
    return largeCapMFOptions.find(f => f.schemeCode === selectedLargeCapMF) || largeCapMFOptions[0] || getBestMutualFundForMarketCap('Large Cap');
  }, [largeCapMFOptions, selectedLargeCapMF]);

  const activeMidMF: MutualFundFactorData = useMemo(() => {
    return midCapMFOptions.find(f => f.schemeCode === selectedMidCapMF) || midCapMFOptions[0] || getBestMutualFundForMarketCap('Mid Cap');
  }, [midCapMFOptions, selectedMidCapMF]);

  const activeSmallMF: MutualFundFactorData = useMemo(() => {
    return smallCapMFOptions.find(f => f.schemeCode === selectedSmallCapMF) || smallCapMFOptions[0] || getBestMutualFundForMarketCap('Small Cap');
  }, [smallCapMFOptions, selectedSmallCapMF]);

  // Analyze primary goal horizon from user's configured goals
  const goalContext = useMemo(() => {
    if (!goals || goals.length === 0) {
      return {
        primaryGoal: 'Wealth Compounding',
        horizonYears: 15,
        horizonType: 'long' as const,
        debtInstrument: {
          symbol: 'FD-HDFC-SEC',
          name: 'High Yield Fixed Deposit (7.2% p.a.)',
          assetType: 'fd' as const,
          description: 'Emergency liquidity & capital foundation',
        },
      };
    }

    const sorted = [...goals].sort((a, b) => a.horizonYears - b.horizonYears);
    const topGoal = sorted[0];

    if (topGoal.horizonYears <= 3) {
      return {
        primaryGoal: topGoal.goal,
        horizonYears: topGoal.horizonYears,
        horizonType: 'short' as const,
        debtInstrument: {
          symbol: 'FD-HDFC-SEC',
          name: 'Short-Term Fixed Deposit (7.1% p.a.)',
          assetType: 'fd' as const,
          description: `Guaranteed capital safety for: ${topGoal.goal}`,
        },
      };
    } else if (topGoal.horizonYears <= 7) {
      return {
        primaryGoal: topGoal.goal,
        horizonYears: topGoal.horizonYears,
        horizonType: 'medium' as const,
        debtInstrument: {
          symbol: 'FD-HDFC-SEC',
          name: 'Corporate AAA Debt Reserve (7.2% p.a.)',
          assetType: 'fd' as const,
          description: `Stability hedge for: ${topGoal.goal}`,
        },
      };
    } else {
      return {
        primaryGoal: topGoal.goal,
        horizonYears: topGoal.horizonYears,
        horizonType: 'long' as const,
        debtInstrument: {
          symbol: 'FD-HDFC-SEC',
          name: 'Fixed Income Safety Cushion (7.2% p.a.)',
          assetType: 'fd' as const,
          description: `Volatility anchor for: ${topGoal.goal}`,
        },
      };
    }
  }, [goals]);

  // Market Cap Targets
  const capTargets = useMemo(() => {
    if (marketCapAllocation?.targets) {
      return {
        largeCapPct: marketCapAllocation.targets.largeCap.targetPercent,
        midCapPct: marketCapAllocation.targets.midCap.targetPercent,
        smallCapPct: marketCapAllocation.targets.smallCap.targetPercent,
        rationale: 'Calibrated from institutional demographic risk profile & time horizon.',
      };
    }
    if (goalContext.horizonType === 'short') {
      return { largeCapPct: 75, midCapPct: 20, smallCapPct: 5, rationale: 'Defensive Large-Cap anchor for capital preservation.' };
    } else if (goalContext.horizonType === 'medium') {
      return { largeCapPct: 55, midCapPct: 30, smallCapPct: 15, rationale: 'Balanced growth engine across bluechip and emerging champions.' };
    } else {
      return { largeCapPct: 40, midCapPct: 35, smallCapPct: 25, rationale: 'High-alpha growth compounding for multi-year horizon.' };
    }
  }, [marketCapAllocation, goalContext]);

  // Fetch active saved rebalance plan from server
  const { data: rebalancePlanData } = useQuery({
    queryKey: ['rebalance-plan'],
    queryFn: async () => {
      const res = await fetch('/api/portfolio/rebalance-plan');
      if (!res.ok) return { activePlan: null };
      return res.json();
    },
  });

  const activePlan = rebalancePlanData?.activePlan;
  const isPlanDeployed = Boolean(activePlan && activePlan.amount > 0);
  const isAmountModified = isPlanDeployed && deployAmount !== activePlan.amount;

  useEffect(() => {
    if (activePlan?.amount && !hasInitializedFromPlan) {
      setDeployAmount(activePlan.amount);
      setHasInitializedFromPlan(true);
    }
  }, [activePlan, hasInitializedFromPlan]);

  // Market Valuation Tactical Overlay
  const marketValuation = useMemo(() => getMarketValuationInfo(), []);

  // Compute Deficits & Tactical Weights
  const deploymentPlan = useMemo(() => {
    const equityDeficit = Math.max(0, recommended.equityPercent - current.equityPercent);
    const goldDeficit = Math.max(0, recommended.goldPercent - current.goldPercent);
    const debtDeficit = Math.max(0, recommended.debtPercent - current.debtPercent);
    const cashDeficit = Math.max(0, recommended.cashPercent - current.cashPercent);

    let totalDeficit = equityDeficit + goldDeficit + debtDeficit + cashDeficit;

    let eqWeight = totalDeficit > 0 ? equityDeficit / totalDeficit : recommended.equityPercent / 100;
    let goldWeight = totalDeficit > 0 ? goldDeficit / totalDeficit : recommended.goldPercent / 100;
    let debtWeight = totalDeficit > 0 ? debtDeficit / totalDeficit : recommended.debtPercent / 100;
    let cashWeight = totalDeficit > 0 ? cashDeficit / totalDeficit : recommended.cashPercent / 100;

    if (goalContext.horizonType === 'short') {
      debtWeight += 0.15;
      eqWeight = Math.max(0.1, eqWeight - 0.15);
      const s = eqWeight + goldWeight + debtWeight + cashWeight;
      eqWeight /= s;
      debtWeight /= s;
    }

    if (marketValuation.equityAdjustmentPercent !== 0) {
      const shift = (marketValuation.equityAdjustmentPercent / 100) * 0.15;
      eqWeight = Math.max(0.1, eqWeight + shift);
      debtWeight = Math.max(0.05, debtWeight - shift);
      const sum = eqWeight + goldWeight + debtWeight + cashWeight;
      eqWeight /= sum;
      goldWeight /= sum;
      debtWeight /= sum;
      cashWeight /= sum;
    }

    const equityRupees = Math.round(deployAmount * eqWeight);
    const goldRupees = Math.round(deployAmount * goldWeight);
    const debtRupees = Math.round(deployAmount * debtWeight);
    const cashRupees = Math.max(0, deployAmount - equityRupees - goldRupees - debtRupees);

    // QVM Market-Cap Sub-Breakdown
    const largeCapRupees = Math.round(equityRupees * (capTargets.largeCapPct / 100));
    const midCapRupees = Math.round(equityRupees * (capTargets.midCapPct / 100));
    const smallCapRupees = Math.max(0, equityRupees - largeCapRupees - midCapRupees);

    const isMF = investmentMode === 'mutual_funds';
    const picksSummary = isMF
      ? `${activeLargeMF.name.split(' ')[0]}, ${activeMidMF.name.split(' ')[0]}, ${activeSmallMF.name.split(' ')[0]}`
      : `${activeLargePick.name.split(' ')[0]}, ${activeMidPick.name.split(' ')[0]}, ${activeSmallPick.name.split(' ')[0]}`;

    return {
      equity: {
        percent: Math.round(eqWeight * 100),
        rupees: equityRupees,
        instrument: isMF ? 'Top-Rated Direct Mutual Funds' : 'QVM Multi-Factor Quant Portfolio',
        subtext: `Large (${capTargets.largeCapPct}%) • Mid (${capTargets.midCapPct}%) • Small (${capTargets.smallCapPct}%)`,
        picksSummary,
        icon: TrendingUp,
        color: '#C9A227',
      },
      equityTiers: {
        largeCap: {
          category: 'Large Cap' as const,
          pct: capTargets.largeCapPct,
          rupees: largeCapRupees,
          stockPick: activeLargePick,
          mfPick: activeLargeMF,
        },
        midCap: {
          category: 'Mid Cap' as const,
          pct: capTargets.midCapPct,
          rupees: midCapRupees,
          stockPick: activeMidPick,
          mfPick: activeMidMF,
        },
        smallCap: {
          category: 'Small Cap' as const,
          pct: capTargets.smallCapPct,
          rupees: smallCapRupees,
          stockPick: activeSmallPick,
          mfPick: activeSmallMF,
        },
      },
      gold: {
        percent: Math.round(goldWeight * 100),
        rupees: goldRupees,
        instrument: 'Nippon India Gold BeES (Crisis & Currency Hedge)',
        subtext: '0.5g - 1g physical gold backing',
        icon: Coins,
        color: '#7C8AD4',
      },
      debt: {
        percent: Math.round(debtWeight * 100),
        rupees: debtRupees,
        instrument: `${goalContext.debtInstrument.name}`,
        subtext: goalContext.debtInstrument.description,
        icon: Landmark,
        color: '#3FA88A',
      },
      cash: {
        percent: Math.round(cashWeight * 100),
        rupees: cashRupees,
        instrument: 'Auto-Sweep Liquid Savings Reserve',
        subtext: 'Instant access emergency liquidity',
        icon: Banknote,
        color: '#D9705C',
      },
    };
  }, [
    current, 
    recommended, 
    deployAmount, 
    marketValuation, 
    goalContext, 
    capTargets, 
    investmentMode,
    activeLargePick, 
    activeMidPick, 
    activeSmallPick,
    activeLargeMF,
    activeMidMF,
    activeSmallMF
  ]);

  // Helper to fetch live quote
  const fetchLiveQuote = async (symbol: string, defaultPrice: number): Promise<number> => {
    try {
      const res = await fetch(`/api/market/quote?symbol=${encodeURIComponent(symbol)}`);
      if (res.ok) {
        const data = await res.json();
        const price = Number(data.regularMarketPrice || data.price || defaultPrice);
        if (price > 0) return price;
      }
    } catch (e) {
      console.warn(`Could not fetch live quote for ${symbol}, using reference price`, e);
    }
    return defaultPrice;
  };

  const handleExecuteRebalance = async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setErrorMessage('Please sign in to log deployment trades.');
      return;
    }

    setIsDeploying(true);
    setErrorMessage(null);

    try {
      const today = new Date().toISOString().slice(0, 10);
      const trades: any[] = [];
      const isMF = investmentMode === 'mutual_funds';
      const { largeCap, midCap, smallCap } = deploymentPlan.equityTiers;

      // 1. Deploy Equity Tiers (Stocks or Mutual Funds)
      if (isMF) {
        // Log Mutual Funds trades
        if (largeCap.rupees > 0) {
          const nav = largeCap.mfPick.nav;
          const units = Math.round((largeCap.rupees / nav) * 1000) / 1000;
          trades.push({
            symbol: largeCap.mfPick.schemeCode,
            name: largeCap.mfPick.name,
            quantity: units,
            pricePerUnit: nav,
            assetType: 'mutual_fund',
            metadata: {
              category: 'Mutual Fund (Large Cap)',
              marketCapTier: 'Large Cap',
              expenseRatio: largeCap.mfPick.expenseRatio,
              cagr3Y: largeCap.mfPick.cagr3Y,
              sharpeRatio: largeCap.mfPick.sharpeRatio,
              goal: goalContext.primaryGoal,
              source: 'qvm_smart_rebalance',
            },
            purchaseDate: today,
          });
        }

        if (midCap.rupees > 0) {
          const nav = midCap.mfPick.nav;
          const units = Math.round((midCap.rupees / nav) * 1000) / 1000;
          trades.push({
            symbol: midCap.mfPick.schemeCode,
            name: midCap.mfPick.name,
            quantity: units,
            pricePerUnit: nav,
            assetType: 'mutual_fund',
            metadata: {
              category: 'Mutual Fund (Mid Cap)',
              marketCapTier: 'Mid Cap',
              expenseRatio: midCap.mfPick.expenseRatio,
              cagr3Y: midCap.mfPick.cagr3Y,
              sharpeRatio: midCap.mfPick.sharpeRatio,
              goal: goalContext.primaryGoal,
              source: 'qvm_smart_rebalance',
            },
            purchaseDate: today,
          });
        }

        if (smallCap.rupees > 0) {
          const nav = smallCap.mfPick.nav;
          const units = Math.round((smallCap.rupees / nav) * 1000) / 1000;
          trades.push({
            symbol: smallCap.mfPick.schemeCode,
            name: smallCap.mfPick.name,
            quantity: units,
            pricePerUnit: nav,
            assetType: 'mutual_fund',
            metadata: {
              category: 'Mutual Fund (Small Cap)',
              marketCapTier: 'Small Cap',
              expenseRatio: smallCap.mfPick.expenseRatio,
              cagr3Y: smallCap.mfPick.cagr3Y,
              sharpeRatio: smallCap.mfPick.sharpeRatio,
              goal: goalContext.primaryGoal,
              source: 'qvm_smart_rebalance',
            },
            purchaseDate: today,
          });
        }
      } else {
        // Log Direct Stock trades
        if (largeCap.rupees > 0) {
          const livePrice = await fetchLiveQuote(largeCap.stockPick.symbol, 3950);
          const qty = Math.max(1, Math.round(largeCap.rupees / livePrice));
          trades.push({
            symbol: largeCap.stockPick.symbol,
            name: largeCap.stockPick.name,
            quantity: qty,
            pricePerUnit: livePrice,
            assetType: 'stock',
            metadata: {
              category: 'Equity (Large Cap)',
              marketCapTier: 'Large Cap',
              qvmScore: largeCap.stockPick.factorBreakdown.compositeQVM,
              piotroskiFScore: largeCap.stockPick.piotroskiFScore,
              altmanZScore: largeCap.stockPick.altmanZScore,
              rating: largeCap.stockPick.factorBreakdown.rating,
              goal: goalContext.primaryGoal,
              horizonYears: goalContext.horizonYears,
              source: 'qvm_smart_rebalance',
            },
            purchaseDate: today,
          });
        }

        if (midCap.rupees > 0) {
          const livePrice = await fetchLiveQuote(midCap.stockPick.symbol, 6400);
          const qty = Math.max(1, Math.round(midCap.rupees / livePrice));
          trades.push({
            symbol: midCap.stockPick.symbol,
            name: midCap.stockPick.name,
            quantity: qty,
            pricePerUnit: livePrice,
            assetType: 'stock',
            metadata: {
              category: 'Equity (Mid Cap)',
              marketCapTier: 'Mid Cap',
              qvmScore: midCap.stockPick.factorBreakdown.compositeQVM,
              piotroskiFScore: midCap.stockPick.piotroskiFScore,
              altmanZScore: midCap.stockPick.altmanZScore,
              rating: midCap.stockPick.factorBreakdown.rating,
              goal: goalContext.primaryGoal,
              horizonYears: goalContext.horizonYears,
              source: 'qvm_smart_rebalance',
            },
            purchaseDate: today,
          });
        }

        if (smallCap.rupees > 0) {
          const livePrice = await fetchLiveQuote(smallCap.stockPick.symbol, 1600);
          const qty = Math.max(1, Math.round(smallCap.rupees / livePrice));
          trades.push({
            symbol: smallCap.stockPick.symbol,
            name: smallCap.stockPick.name,
            quantity: qty,
            pricePerUnit: livePrice,
            assetType: 'stock',
            metadata: {
              category: 'Equity (Small Cap)',
              marketCapTier: 'Small Cap',
              qvmScore: smallCap.stockPick.factorBreakdown.compositeQVM,
              piotroskiFScore: smallCap.stockPick.piotroskiFScore,
              altmanZScore: smallCap.stockPick.altmanZScore,
              rating: smallCap.stockPick.factorBreakdown.rating,
              goal: goalContext.primaryGoal,
              horizonYears: goalContext.horizonYears,
              source: 'qvm_smart_rebalance',
            },
            purchaseDate: today,
          });
        }
      }

      // 2. Dynamic Gold Allocation
      if (deploymentPlan.gold.rupees > 0) {
        const goldPrice = await fetchLiveQuote('GOLDBEES.NS', 75);
        const goldQty = Math.max(1, Math.round(deploymentPlan.gold.rupees / goldPrice));

        trades.push({
          symbol: 'GOLDBEES.NS',
          name: 'Gold BeES ETF',
          quantity: goldQty,
          pricePerUnit: goldPrice,
          assetType: 'gold',
          metadata: {
            category: 'Precious Metals Hedge',
            goal: goalContext.primaryGoal,
            horizonYears: goalContext.horizonYears,
            source: 'smart_rebalance',
          },
          purchaseDate: today,
        });
      }

      // 3. Dynamic Debt Reserve Allocation
      if (deploymentPlan.debt.rupees > 0) {
        const debtInst = goalContext.debtInstrument;
        trades.push({
          symbol: debtInst.symbol,
          name: debtInst.name,
          quantity: deploymentPlan.debt.rupees,
          pricePerUnit: 1,
          assetType: 'fd',
          metadata: {
            rate: 7.2,
            tenureMonths: goalContext.horizonType === 'short' ? 12 : 36,
            goal: goalContext.primaryGoal,
            horizonYears: goalContext.horizonYears,
            source: 'smart_rebalance',
          },
          purchaseDate: today,
        });
      }

      const res = await fetch('/api/portfolio/rebalance-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deploy',
          amount: deployAmount,
          trades,
        }),
      });

      if (!res.ok) {
        const errDetail = await res.json().catch(() => ({}));
        throw new Error(errDetail.error || 'Failed to deploy rebalance plan');
      }

      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      queryClient.invalidateQueries({ queryKey: ['networth'] });
      queryClient.invalidateQueries({ queryKey: ['rebalance-plan'] });

      const deployedNames = isMF
        ? `${activeLargeMF.name.split(' ')[0]}, ${activeMidMF.name.split(' ')[0]}, ${activeSmallMF.name.split(' ')[0]}`
        : `${activeLargePick.symbol}, ${activeMidPick.symbol}, ${activeSmallPick.symbol}`;

      setDeploySuccess(`Success! Deployed ₹${deployAmount.toLocaleString('en-IN')} via ${isMF ? 'Mutual Funds' : 'Direct Stocks'} (${deployedNames}). Holdings updated.`);
      setTimeout(() => setDeploySuccess(null), 8000);
    } catch (err: any) {
      console.error('Rebalance execution error:', err);
      setErrorMessage(err.message || 'Error deploying rebalance plan.');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleResetRebalance = async () => {
    setIsResetting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/portfolio/rebalance-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });

      if (!res.ok) {
        const errDetail = await res.json().catch(() => ({}));
        throw new Error(errDetail.error || 'Failed to reset rebalance plan');
      }

      await queryClient.invalidateQueries();
      setDeploySuccess('Rebalance plan successfully removed from portfolio.');
      setTimeout(() => setDeploySuccess(null), 8000);
    } catch (err: any) {
      console.error('Rebalance reset error:', err);
      setErrorMessage(err.message || 'Error resetting rebalance plan.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className={cn('bg-bg-surface border border-border-default rounded-[14px] p-6 space-y-6 shadow-sm', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-default pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent-brass/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-accent-brass" />
            </div>
            <div>
              <h2 className="text-[17px] font-medium text-text-primary">
                Smart Monthly Rebalancer & Deployment
              </h2>
              <p className="text-[12px] text-text-faint">
                Interactive simulator to eliminate negative drift with institutional QVM quant selection
              </p>
            </div>
          </div>
        </div>

        {/* Tactical Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium border border-border-default bg-bg-surface-2 text-accent-brass font-mono">
            <Brain className="w-3.5 h-3.5" />
            <span>QVM Quant Model Active</span>
          </div>
          {goalContext.primaryGoal && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium border bg-info-indigo-bg/30 border-info-indigo/40 text-info-indigo font-mono">
              <span>🎯 Goal: {goalContext.primaryGoal} ({goalContext.horizonYears}y)</span>
            </div>
          )}
          {activePlan && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium border bg-positive/10 border-positive/30 text-positive font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active Plan: {formatINR(activePlan.amount)}/mo</span>
            </div>
          )}
          <div className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium border', marketValuation.badgeColor)}>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{marketValuation.badgeLabel}</span>
          </div>
        </div>
      </div>

      {/* Market Rationale & Guidance */}
      <div className="bg-bg-surface-2 border border-border-default rounded-[10px] p-3.5 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-accent-brass shrink-0 mt-0.5" />
        <div className="text-[12px] leading-relaxed">
          <span className="font-medium text-text-primary">QVM Factor Model & Goal Guidance: </span>
          <span className="text-text-secondary">
            Equities are systematically selected using institutional <strong className="text-accent-brass">Quality (40%)</strong>, <strong className="text-accent-brass">Valuation (30%)</strong>, and <strong className="text-accent-brass">Momentum (30%)</strong> factor scoring across Large, Mid, and Small Cap tiers. Allocations are fine-tuned for <strong className="text-text-primary">{goalContext.primaryGoal}</strong> ({goalContext.horizonYears}y timeline). {marketValuation.rationale}
          </span>
        </div>
      </div>

      {/* Monthly Surplus Input & Slider */}
      <div className="space-y-3 bg-bg-surface-2 p-4 rounded-[12px] border border-border-default">
        <div className="flex items-center justify-between">
          <label className="text-[13px] font-medium text-text-primary flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-accent-brass" />
            Monthly Savings to Deploy:
          </label>
          <div className="flex items-center gap-1 bg-bg-base border border-border-default rounded-[6px] px-3 py-1">
            <span className="text-text-faint font-mono text-[13px]">₹</span>
            <input
              type="number"
              min="1000"
              max="500000"
              step="1000"
              value={deployAmount}
              onChange={(e) => setDeployAmount(Math.max(0, parseInt(e.target.value) || 0))}
              className="bg-transparent text-[14px] font-mono font-medium text-text-primary w-24 text-right focus:outline-none"
            />
          </div>
        </div>

        <input
          type="range"
          min="5000"
          max="200000"
          step="2500"
          value={Math.min(200000, Math.max(5000, deployAmount))}
          onChange={(e) => setDeployAmount(parseInt(e.target.value))}
          className="w-full accent-accent-brass cursor-pointer"
        />

        <div className="flex justify-between text-[11px] font-mono text-text-faint">
          <span>₹5,000</span>
          <span>₹50,000</span>
          <span>₹1,00,000</span>
          <span>₹2,00,000</span>
        </div>
      </div>

      {/* Recommended Deployment Breakdown Grid (4 Quadrants) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-eyebrow text-accent-brass flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Tactically Rebalanced Allocation (Total: {formatINR(deployAmount)})
          </span>
          <span className="text-[11px] text-text-faint font-mono">
            {marketValuation.equityAdjustmentPercent > 0 ? '+ Equity Tilted' : marketValuation.equityAdjustmentPercent < 0 ? '+ Defensive Tilted' : 'Neutral Balanced'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries({
            equity: deploymentPlan.equity,
            gold: deploymentPlan.gold,
            debt: deploymentPlan.debt,
            cash: deploymentPlan.cash,
          }).map(([key, item]) => {
            const Icon = item.icon;
            const isEquity = key === 'equity';
            return (
              <div
                key={key}
                className={cn(
                  'bg-bg-surface-2 border rounded-[10px] p-4 flex flex-col justify-between space-y-2 relative overflow-hidden transition-all',
                  isEquity ? 'border-accent-brass/40 bg-accent-brass/5' : 'border-border-default'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-4 h-4" style={{ color: item.color }} />
                    <span className="text-[12.5px] font-medium text-text-primary capitalize">{key}</span>
                  </div>
                  <span className="text-[12px] font-mono font-medium" style={{ color: item.color }}>
                    {item.percent}%
                  </span>
                </div>

                <div className="text-[18px] font-medium text-text-primary font-mono" style={{ color: item.color }}>
                  {formatINR(item.rupees)}
                </div>

                <div>
                  <p className="text-[12px] font-medium text-text-primary leading-tight">
                    {item.instrument}
                  </p>
                  {item.subtext && (
                    <p className="text-[10.5px] text-text-faint leading-snug mt-0.5">
                      {item.subtext}
                    </p>
                  )}
                  {'picksSummary' in item && Boolean((item as any).picksSummary) && (
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-accent-brass/10 text-accent-brass border border-border-default">
                        Picks: {(item as any).picksSummary}
                      </span>
                    </div>
                  )}
                </div>

                <div className="w-full h-1 bg-bg-surface rounded-full overflow-hidden mt-1">
                  <div className="h-full rounded-full" style={{ width: `${item.percent}%`, backgroundColor: item.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DEDICATED QVM MULTI-FACTOR EQUITIES BENTO SECTION */}
      <div className="border border-border-default rounded-[12px] p-5 bg-bg-surface-2 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-default pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-accent-brass" />
            <div>
              <h3 className="text-[14.5px] font-medium text-text-primary flex items-center gap-2">
                QVM Multi-Factor Equity Deployment
                <span className="text-[11px] font-mono font-normal px-2 py-0.5 rounded-full bg-accent-brass/10 text-accent-brass border border-border-default">
                  {formatINR(deploymentPlan.equity.rupees)} Total
                </span>
              </h3>
              <p className="text-[11.5px] text-text-faint">
                {capTargets.rationale} Filtered for institutional accounting resilience & risk-adjusted alpha.
              </p>
            </div>
          </div>

          {/* Investment Vehicle Mode Switch (Direct Stocks vs Mutual Funds) */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1 p-1 rounded-[8px] bg-bg-surface border border-border-default text-[12px]">
              <button
                type="button"
                onClick={() => setInvestmentMode('stocks')}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-[6px] font-medium transition-all cursor-pointer',
                  investmentMode === 'stocks'
                    ? 'bg-accent-brass text-bg-base font-semibold shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Direct Stocks</span>
              </button>
              <button
                type="button"
                onClick={() => setInvestmentMode('mutual_funds')}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-[6px] font-medium transition-all cursor-pointer',
                  investmentMode === 'mutual_funds'
                    ? 'bg-accent-brass text-bg-base font-semibold shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <PiggyBank className="w-3.5 h-3.5" />
                <span>Mutual Funds</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowQvmDetails(!showQvmDetails)}
              className="flex items-center gap-1 text-[12px] text-accent-brass hover:text-accent-brass-dim font-medium transition-colors cursor-pointer ml-1"
            >
              <span>{showQvmDetails ? 'Compact' : 'Detailed'}</span>
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', showQvmDetails && 'rotate-180')} />
            </button>
          </div>
        </div>

        {/* 3 Tier Bento Grid (Large Cap, Mid Cap, Small Cap) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Large Cap Tier */}
          {(() => {
            const tier = deploymentPlan.equityTiers.largeCap;
            const isMF = investmentMode === 'mutual_funds';
            const stockPick = tier.stockPick;
            const mfPick = tier.mfPick;

            return (
              <div className="bg-bg-surface border border-border-default rounded-[10px] p-4 flex flex-col justify-between space-y-3 shadow-sm hover:border-accent-brass/40 transition-all">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase font-semibold text-accent-brass px-2 py-0.5 rounded bg-accent-brass/10 border border-border-default">
                      Large Cap ({tier.pct}%)
                    </span>
                    <span className="text-[14px] font-mono font-bold text-text-primary">
                      {formatINR(tier.rupees)}
                    </span>
                  </div>

                  {/* Selector Dropdown */}
                  <div className="pt-1">
                    <label className="text-[10.5px] text-text-faint block uppercase font-mono mb-1">
                      {isMF ? 'Top Mutual Fund' : 'Top QVM Stock'}
                    </label>
                    {isMF ? (
                      <select
                        value={selectedLargeCapMF}
                        onChange={(e) => setSelectedLargeCapMF(e.target.value)}
                        className="w-full bg-bg-surface-2 border border-border-default rounded-[6px] px-2.5 py-1.5 text-[12px] font-medium text-text-primary focus:outline-none focus:border-accent-brass cursor-pointer"
                      >
                        {largeCapMFOptions.map((f) => (
                          <option key={f.schemeCode} value={f.schemeCode}>
                            {f.name} • {f.cagr3Y}% 3Y
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={selectedLargeCapSym}
                        onChange={(e) => setSelectedLargeCapSym(e.target.value)}
                        className="w-full bg-bg-surface-2 border border-border-default rounded-[6px] px-2.5 py-1.5 text-[12px] font-medium text-text-primary focus:outline-none focus:border-accent-brass font-mono cursor-pointer"
                      >
                        {largeCapOptions.map((st) => (
                          <option key={st.symbol} value={st.symbol}>
                            {st.name} ({st.symbol.replace('.NS', '')}) • QVM {st.factorBreakdown.compositeQVM}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="space-y-2 pt-1 border-t border-border-default">
                  {isMF ? (
                    <div className="space-y-1.5 text-[11.5px]">
                      <div className="flex items-center justify-between text-text-secondary">
                        <span>Expense Ratio (TER):</span>
                        <span className="font-mono font-medium text-positive">{mfPick.expenseRatio}% p.a.</span>
                      </div>
                      <div className="flex items-center justify-between text-text-secondary">
                        <span>3Y CAGR / Sharpe:</span>
                        <span className="font-mono font-medium text-text-primary">{mfPick.cagr3Y}% / {mfPick.sharpeRatio}</span>
                      </div>
                      <div className="flex items-center justify-between text-text-secondary">
                        <span>Fund AUM:</span>
                        <span className="font-mono font-medium text-text-primary">₹{mfPick.aumCr.toLocaleString('en-IN')} Cr</span>
                      </div>
                      {showQvmDetails && (
                        <div className="pt-1 text-[11px] text-text-faint italic leading-relaxed border-t border-border-default">
                          &ldquo;{mfPick.analystSummary}&rdquo;
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-text-faint">Composite QVM:</span>
                        <span className={cn('text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border', stockPick.factorBreakdown.ratingColor)}>
                          {stockPick.factorBreakdown.compositeQVM}/100 • {stockPick.factorBreakdown.rating.split('/')[0]}
                        </span>
                      </div>
                      {showQvmDetails && (
                        <div className="space-y-1.5 text-[11px] pt-1">
                          <div className="flex items-center justify-between text-text-secondary">
                            <span>Piotroski F-Score:</span>
                            <span className="font-mono font-medium text-positive">{stockPick.piotroskiFScore}/9</span>
                          </div>
                          <div className="flex items-center justify-between text-text-secondary">
                            <span>Altman Z-Zone:</span>
                            <span className="font-mono font-medium text-positive">Safe ({stockPick.altmanZScore})</span>
                          </div>
                          <div className="flex items-center justify-between text-text-secondary">
                            <span>ROE / ROCE:</span>
                            <span className="font-mono font-medium text-text-primary">{stockPick.roe}% / {stockPick.roce}%</span>
                          </div>
                          <p className="text-[10.5px] text-text-faint italic pt-1 border-t border-border-default">
                            &ldquo;{stockPick.analystSummary}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* 2. Mid Cap Tier */}
          {(() => {
            const tier = deploymentPlan.equityTiers.midCap;
            const isMF = investmentMode === 'mutual_funds';
            const stockPick = tier.stockPick;
            const mfPick = tier.mfPick;

            return (
              <div className="bg-bg-surface border border-border-default rounded-[10px] p-4 flex flex-col justify-between space-y-3 shadow-sm hover:border-accent-brass/40 transition-all">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase font-semibold text-accent-brass px-2 py-0.5 rounded bg-accent-brass/10 border border-border-default">
                      Mid Cap ({tier.pct}%)
                    </span>
                    <span className="text-[14px] font-mono font-bold text-text-primary">
                      {formatINR(tier.rupees)}
                    </span>
                  </div>

                  {/* Selector Dropdown */}
                  <div className="pt-1">
                    <label className="text-[10.5px] text-text-faint block uppercase font-mono mb-1">
                      {isMF ? 'Top Mutual Fund' : 'Top QVM Stock'}
                    </label>
                    {isMF ? (
                      <select
                        value={selectedMidCapMF}
                        onChange={(e) => setSelectedMidCapMF(e.target.value)}
                        className="w-full bg-bg-surface-2 border border-border-default rounded-[6px] px-2.5 py-1.5 text-[12px] font-medium text-text-primary focus:outline-none focus:border-accent-brass cursor-pointer"
                      >
                        {midCapMFOptions.map((f) => (
                          <option key={f.schemeCode} value={f.schemeCode}>
                            {f.name} • {f.cagr3Y}% 3Y
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={selectedMidCapSym}
                        onChange={(e) => setSelectedMidCapSym(e.target.value)}
                        className="w-full bg-bg-surface-2 border border-border-default rounded-[6px] px-2.5 py-1.5 text-[12px] font-medium text-text-primary focus:outline-none focus:border-accent-brass font-mono cursor-pointer"
                      >
                        {midCapOptions.map((st) => (
                          <option key={st.symbol} value={st.symbol}>
                            {st.name} ({st.symbol.replace('.NS', '')}) • QVM {st.factorBreakdown.compositeQVM}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="space-y-2 pt-1 border-t border-border-default">
                  {isMF ? (
                    <div className="space-y-1.5 text-[11.5px]">
                      <div className="flex items-center justify-between text-text-secondary">
                        <span>Expense Ratio (TER):</span>
                        <span className="font-mono font-medium text-positive">{mfPick.expenseRatio}% p.a.</span>
                      </div>
                      <div className="flex items-center justify-between text-text-secondary">
                        <span>3Y CAGR / Sharpe:</span>
                        <span className="font-mono font-medium text-text-primary">{mfPick.cagr3Y}% / {mfPick.sharpeRatio}</span>
                      </div>
                      <div className="flex items-center justify-between text-text-secondary">
                        <span>Fund AUM:</span>
                        <span className="font-mono font-medium text-text-primary">₹{mfPick.aumCr.toLocaleString('en-IN')} Cr</span>
                      </div>
                      {showQvmDetails && (
                        <div className="pt-1 text-[11px] text-text-faint italic leading-relaxed border-t border-border-default">
                          &ldquo;{mfPick.analystSummary}&rdquo;
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-text-faint">Composite QVM:</span>
                        <span className={cn('text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border', stockPick.factorBreakdown.ratingColor)}>
                          {stockPick.factorBreakdown.compositeQVM}/100 • {stockPick.factorBreakdown.rating.split('/')[0]}
                        </span>
                      </div>
                      {showQvmDetails && (
                        <div className="space-y-1.5 text-[11px] pt-1">
                          <div className="flex items-center justify-between text-text-secondary">
                            <span>Piotroski F-Score:</span>
                            <span className="font-mono font-medium text-positive">{stockPick.piotroskiFScore}/9</span>
                          </div>
                          <div className="flex items-center justify-between text-text-secondary">
                            <span>Altman Z-Zone:</span>
                            <span className="font-mono font-medium text-positive">Safe ({stockPick.altmanZScore})</span>
                          </div>
                          <div className="flex items-center justify-between text-text-secondary">
                            <span>ROE / ROCE:</span>
                            <span className="font-mono font-medium text-text-primary">{stockPick.roe}% / {stockPick.roce}%</span>
                          </div>
                          <p className="text-[10.5px] text-text-faint italic pt-1 border-t border-border-default">
                            &ldquo;{stockPick.analystSummary}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* 3. Small Cap Tier */}
          {(() => {
            const tier = deploymentPlan.equityTiers.smallCap;
            const isMF = investmentMode === 'mutual_funds';
            const stockPick = tier.stockPick;
            const mfPick = tier.mfPick;

            return (
              <div className="bg-bg-surface border border-border-default rounded-[10px] p-4 flex flex-col justify-between space-y-3 shadow-sm hover:border-accent-brass/40 transition-all">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase font-semibold text-accent-brass px-2 py-0.5 rounded bg-accent-brass/10 border border-border-default">
                      Small Cap ({tier.pct}%)
                    </span>
                    <span className="text-[14px] font-mono font-bold text-text-primary">
                      {formatINR(tier.rupees)}
                    </span>
                  </div>

                  {/* Selector Dropdown */}
                  <div className="pt-1">
                    <label className="text-[10.5px] text-text-faint block uppercase font-mono mb-1">
                      {isMF ? 'Top Mutual Fund' : 'Top QVM Stock'}
                    </label>
                    {isMF ? (
                      <select
                        value={selectedSmallCapMF}
                        onChange={(e) => setSelectedSmallCapMF(e.target.value)}
                        className="w-full bg-bg-surface-2 border border-border-default rounded-[6px] px-2.5 py-1.5 text-[12px] font-medium text-text-primary focus:outline-none focus:border-accent-brass cursor-pointer"
                      >
                        {smallCapMFOptions.map((f) => (
                          <option key={f.schemeCode} value={f.schemeCode}>
                            {f.name} • {f.cagr3Y}% 3Y
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={selectedSmallCapSym}
                        onChange={(e) => setSelectedSmallCapSym(e.target.value)}
                        className="w-full bg-bg-surface-2 border border-border-default rounded-[6px] px-2.5 py-1.5 text-[12px] font-medium text-text-primary focus:outline-none focus:border-accent-brass font-mono cursor-pointer"
                      >
                        {smallCapOptions.map((st) => (
                          <option key={st.symbol} value={st.symbol}>
                            {st.name} ({st.symbol.replace('.NS', '')}) • QVM {st.factorBreakdown.compositeQVM}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="space-y-2 pt-1 border-t border-border-default">
                  {isMF ? (
                    <div className="space-y-1.5 text-[11.5px]">
                      <div className="flex items-center justify-between text-text-secondary">
                        <span>Expense Ratio (TER):</span>
                        <span className="font-mono font-medium text-positive">{mfPick.expenseRatio}% p.a.</span>
                      </div>
                      <div className="flex items-center justify-between text-text-secondary">
                        <span>3Y CAGR / Sharpe:</span>
                        <span className="font-mono font-medium text-text-primary">{mfPick.cagr3Y}% / {mfPick.sharpeRatio}</span>
                      </div>
                      <div className="flex items-center justify-between text-text-secondary">
                        <span>Fund AUM:</span>
                        <span className="font-mono font-medium text-text-primary">₹{mfPick.aumCr.toLocaleString('en-IN')} Cr</span>
                      </div>
                      {showQvmDetails && (
                        <div className="pt-1 text-[11px] text-text-faint italic leading-relaxed border-t border-border-default">
                          &ldquo;{mfPick.analystSummary}&rdquo;
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-text-faint">Composite QVM:</span>
                        <span className={cn('text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border', stockPick.factorBreakdown.ratingColor)}>
                          {stockPick.factorBreakdown.compositeQVM}/100 • {stockPick.factorBreakdown.rating.split('/')[0]}
                        </span>
                      </div>
                      {showQvmDetails && (
                        <div className="space-y-1.5 text-[11px] pt-1">
                          <div className="flex items-center justify-between text-text-secondary">
                            <span>Piotroski F-Score:</span>
                            <span className="font-mono font-medium text-positive">{stockPick.piotroskiFScore}/9</span>
                          </div>
                          <div className="flex items-center justify-between text-text-secondary">
                            <span>Altman Z-Zone:</span>
                            <span className="font-mono font-medium text-positive">Safe ({stockPick.altmanZScore})</span>
                          </div>
                          <div className="flex items-center justify-between text-text-secondary">
                            <span>Debt to Equity:</span>
                            <span className="font-mono font-medium text-positive">{stockPick.debtToEquity === 0 ? 'Zero Debt' : stockPick.debtToEquity}</span>
                          </div>
                          <p className="text-[10.5px] text-text-faint italic pt-1 border-t border-border-default">
                            &ldquo;{stockPick.analystSummary}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Action Execution Button */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 text-[12px] text-text-secondary">
            <CheckCircle2 className="w-4 h-4 text-positive shrink-0" />
            <span>
              {isPlanDeployed
                ? isAmountModified
                  ? `Updating from ${formatINR(activePlan.amount)} to ${formatINR(deployAmount)} will adjust your allocations without duplicate buys.`
                  : `Monthly allocation plan of ${formatINR(activePlan.amount)} is active in your portfolio.`
                : `Executing this plan will deploy into ${investmentMode === 'mutual_funds' ? 'Mutual Funds' : 'Direct Stocks'}, Gold, and Debt uniformly.`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {isPlanDeployed && (
            <button
              type="button"
              onClick={handleResetRebalance}
              disabled={isResetting || isDeploying}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-[8px] border border-negative/30 hover:border-negative/60 hover:bg-negative/10 text-negative text-[13px] font-medium transition-all disabled:opacity-50 cursor-pointer"
              title="Reverts the monthly rebalance plan holdings from your portfolio"
            >
              {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              <span>Reset Plan</span>
            </button>
          )}

          <button
            onClick={handleExecuteRebalance}
            disabled={isDeploying || deployAmount <= 0 || (isPlanDeployed && !isAmountModified)}
            className={cn(
              'flex items-center justify-center gap-2 px-6 py-2.5 rounded-[8px] font-medium text-[13.5px] transition-all shadow-sm w-full sm:w-auto font-semibold cursor-pointer',
              isPlanDeployed && !isAmountModified
                ? 'bg-positive/15 text-positive border border-positive/30 cursor-default'
                : 'bg-accent-brass hover:bg-accent-brass-dim text-bg-base disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating Portfolio...</span>
              </>
            ) : isPlanDeployed ? (
              isAmountModified ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Update Plan to {formatINR(deployAmount)}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Plan Deployed ({formatINR(activePlan.amount)}/mo)</span>
                </>
              )
            ) : (
              <>
                <span>Deploy & Log Plan to Portfolio</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {deploySuccess && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3.5 rounded-[8px] bg-positive/10 border border-positive/30 text-positive text-[13px] flex items-center gap-2.5 font-medium"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{deploySuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Notification */}
      {errorMessage && (
        <div className="p-3 rounded-[8px] bg-negative/10 border border-negative/30 text-negative text-[12.5px]">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
