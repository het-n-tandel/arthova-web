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
  RefreshCw
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { formatINR, formatINRCompact, cn } from '@/lib/formatters';
import { getMarketValuationInfo } from '@/lib/market-valuation-service';

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
  className?: string;
}

export function SmartRebalancerCard({
  current,
  recommended,
  netWorth,
  defaultMonthlySurplus = 25000,
  goals = [],
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

  // Analyze primary goal horizon from user's configured goals
  const goalContext = useMemo(() => {
    if (!goals || goals.length === 0) {
      return {
        primaryGoal: 'Wealth Compounding',
        horizonYears: 15,
        horizonType: 'long' as const, // 'short' | 'medium' | 'long'
        equityInstrument: {
          symbol: 'NIFTYBEES.NS',
          name: 'Nifty 50 Index ETF',
          assetType: 'stock' as const,
          description: 'Long-term low-cost index compounding',
        },
        debtInstrument: {
          symbol: 'FD-HDFC-SEC',
          name: 'High Yield Fixed Deposit (7.2% p.a.)',
          assetType: 'fd' as const,
          description: 'Emergency liquidity & capital foundation',
        },
      };
    }

    // Sort by shortest horizon first (goals that need money first get highest priority)
    const sorted = [...goals].sort((a, b) => a.horizonYears - b.horizonYears);
    const topGoal = sorted[0];

    if (topGoal.horizonYears <= 3) {
      // Short-Term (< 3y): Capital Preservation is supreme
      return {
        primaryGoal: topGoal.goal,
        horizonYears: topGoal.horizonYears,
        horizonType: 'short' as const,
        equityInstrument: {
          symbol: 'HDFCBANK.NS',
          name: 'HDFC Bank Ltd (Low-Beta Defensive)',
          assetType: 'stock' as const,
          description: `Capital defense for short-term goal: ${topGoal.goal} (${topGoal.horizonYears}y)`,
        },
        debtInstrument: {
          symbol: 'FD-HDFC-SEC',
          name: 'Short-Term Fixed Deposit (7.1% p.a.)',
          assetType: 'fd' as const,
          description: `Guaranteed capital safety for: ${topGoal.goal}`,
        },
      };
    } else if (topGoal.horizonYears <= 7) {
      // Medium-Term (3-7y): Balanced Growth & Defense
      return {
        primaryGoal: topGoal.goal,
        horizonYears: topGoal.horizonYears,
        horizonType: 'medium' as const,
        equityInstrument: {
          symbol: '122639', // Parag Parikh Flexi Cap Fund
          name: 'Parag Parikh Flexi Cap Fund - Direct Growth',
          assetType: 'mutual_fund' as const,
          description: `Multi-cap dynamic growth for: ${topGoal.goal} (${topGoal.horizonYears}y)`,
        },
        debtInstrument: {
          symbol: 'FD-HDFC-SEC',
          name: 'Corporate AAA Debt Reserve (7.2% p.a.)',
          assetType: 'fd' as const,
          description: `Stability hedge for: ${topGoal.goal}`,
        },
      };
    } else {
      // Long-Term (> 7y): Maximum Wealth Compounding
      return {
        primaryGoal: topGoal.goal,
        horizonYears: topGoal.horizonYears,
        horizonType: 'long' as const,
        equityInstrument: {
          symbol: 'RELIANCE.NS',
          name: 'Reliance Industries (Alpha Compounding)',
          assetType: 'stock' as const,
          description: `Max long-term compounding for: ${topGoal.goal} (${topGoal.horizonYears}y)`,
        },
        debtInstrument: {
          symbol: 'FD-HDFC-SEC',
          name: 'Fixed Income Safety Cushion (7.2% p.a.)',
          assetType: 'fd' as const,
          description: `Volatilty anchor for: ${topGoal.goal}`,
        },
      };
    }
  }, [goals]);

  // Fetch active saved rebalance plan from server
  const { data: rebalancePlanData, isLoading: isLoadingPlan } = useQuery({
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

  // Remember old deployed value when loaded
  useEffect(() => {
    if (activePlan?.amount && !hasInitializedFromPlan) {
      setDeployAmount(activePlan.amount);
      setHasInitializedFromPlan(true);
    }
  }, [activePlan, hasInitializedFromPlan]);

  // Market Valuation Tactical Overlay
  const marketValuation = useMemo(() => getMarketValuationInfo(), []);

  // Compute Deficits & Tactical Weights tailored to Goal & Market
  const deploymentPlan = useMemo(() => {
    const equityDeficit = Math.max(0, recommended.equityPercent - current.equityPercent);
    const goldDeficit = Math.max(0, recommended.goldPercent - current.goldPercent);
    const debtDeficit = Math.max(0, recommended.debtPercent - current.debtPercent);
    const cashDeficit = Math.max(0, recommended.cashPercent - current.cashPercent);

    let totalDeficit = equityDeficit + goldDeficit + debtDeficit + cashDeficit;

    // If portfolio is already in equilibrium, distribute by recommended target weights
    let eqWeight = totalDeficit > 0 ? equityDeficit / totalDeficit : recommended.equityPercent / 100;
    let goldWeight = totalDeficit > 0 ? goldDeficit / totalDeficit : recommended.goldPercent / 100;
    let debtWeight = totalDeficit > 0 ? debtDeficit / totalDeficit : recommended.debtPercent / 100;
    let cashWeight = totalDeficit > 0 ? cashDeficit / totalDeficit : recommended.cashPercent / 100;

    // Goal-specific weight fine-tuning:
    // If user's top goal is short-term (< 3y), tilt extra towards debt preservation
    if (goalContext.horizonType === 'short') {
      debtWeight += 0.15;
      eqWeight = Math.max(0.1, eqWeight - 0.15);
      const s = eqWeight + goldWeight + debtWeight + cashWeight;
      eqWeight /= s;
      debtWeight /= s;
    }

    // Apply Tactical Market Valuation Overlay
    if (marketValuation.equityAdjustmentPercent !== 0) {
      const shift = (marketValuation.equityAdjustmentPercent / 100) * 0.15; // Moderate tactical shift
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

    return {
      equity: {
        percent: Math.round(eqWeight * 100),
        rupees: equityRupees,
        instrument: `${goalContext.equityInstrument.name}`,
        subtext: goalContext.equityInstrument.description,
        icon: TrendingUp,
        color: '#C9A227',
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
  }, [current, recommended, deployAmount, marketValuation, goalContext]);

  // Helper to fetch live quote with fallbacks
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
      const trades = [];

      // 1. Dynamic Equity Allocation using Goal-tailored instrument and live market price
      if (deploymentPlan.equity.rupees > 0) {
        const eqInst = goalContext.equityInstrument;
        let defaultP = eqInst.symbol === 'RELIANCE.NS' ? 2980 : eqInst.symbol === 'HDFCBANK.NS' ? 1640 : eqInst.symbol === '122639' ? 82.5 : 280;
        const livePrice = await fetchLiveQuote(eqInst.symbol, defaultP);
        const qty = Math.max(1, Math.round(deploymentPlan.equity.rupees / livePrice));

        trades.push({
          symbol: eqInst.symbol,
          name: eqInst.name,
          quantity: qty,
          pricePerUnit: livePrice,
          assetType: eqInst.assetType,
          metadata: {
            category: 'Equity Rebalance',
            goal: goalContext.primaryGoal,
            horizonYears: goalContext.horizonYears,
            source: 'smart_rebalance',
          },
          purchaseDate: today,
        });
      }

      // 2. Dynamic Gold Allocation using live Gold ETF quote
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

      // Invalidate queries to reload portfolio, net worth, and rebalance plan
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      queryClient.invalidateQueries({ queryKey: ['networth'] });
      queryClient.invalidateQueries({ queryKey: ['rebalance-plan'] });

      setDeploySuccess(`Success! Rebalanced ₹${deployAmount.toLocaleString('en-IN')} dynamically for "${goalContext.primaryGoal}" (${goalContext.horizonYears}y horizon). Live prices recorded.`);
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
    <div className={cn('bg-bg-surface border-2 border-accent-brass/40 rounded-[14px] p-6 space-y-6 shadow-md', className)}>
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
                Interactive simulator to eliminate negative drift with your monthly savings
              </p>
            </div>
          </div>
        </div>

        {/* Tactical Market Valuation & Active Plan Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {goalContext.primaryGoal && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium border bg-info-indigo-bg/30 border-info-indigo/40 text-info-indigo font-mono">
              <span>🎯 Goal: {goalContext.primaryGoal} ({goalContext.horizonYears}y)</span>
            </div>
          )}
          {activePlan && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium border bg-accent-brass/10 border-accent-brass/30 text-accent-brass font-mono">
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

      {/* Market Rationale Context Alert */}
      <div className="bg-bg-surface-2 border border-border-default rounded-[10px] p-3.5 flex items-start gap-3">
        <Info className="w-4 h-4 text-accent-brass shrink-0 mt-0.5" />
        <div className="text-[12px] leading-relaxed">
          <span className="font-medium text-text-primary">Goal & Market Valuation Guidance: </span>
          <span className="text-text-secondary">
            Allocations are dynamically optimized for <strong className="text-text-primary">{goalContext.primaryGoal}</strong> with a <strong className="text-accent-brass">{goalContext.horizonYears}-year timeline</strong>. {marketValuation.rationale}
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

      {/* Recommended Deployment Breakdown Grid */}
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
          {Object.entries(deploymentPlan).map(([key, item]) => {
            const Icon = item.icon;
            return (
              <div
                key={key}
                className="bg-bg-surface-2 border border-border-default rounded-[10px] p-4 flex flex-col justify-between space-y-2 relative overflow-hidden"
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
                </div>

                <div className="w-full h-1 bg-bg-surface rounded-full overflow-hidden mt-1">
                  <div className="h-full rounded-full" style={{ width: `${item.percent}%`, backgroundColor: item.color }} />
                </div>
              </div>
            );
          })}
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
                : 'Executing this plan will eliminate negative portfolio drift uniformly.'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {isPlanDeployed && (
            <button
              type="button"
              onClick={handleResetRebalance}
              disabled={isResetting || isDeploying}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-[8px] border border-negative/30 hover:border-negative/60 hover:bg-negative/10 text-negative text-[13px] font-medium transition-all disabled:opacity-50"
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
              'flex items-center justify-center gap-2 px-6 py-2.5 rounded-[8px] font-medium text-[13.5px] transition-all shadow-sm w-full sm:w-auto font-semibold',
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
