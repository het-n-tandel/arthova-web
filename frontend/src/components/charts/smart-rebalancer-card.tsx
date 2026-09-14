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
  className?: string;
}

export function SmartRebalancerCard({
  current,
  recommended,
  netWorth,
  defaultMonthlySurplus = 25000,
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

  // Compute Deficits & Tactical Weights
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
        instrument: 'Nifty 50 Index Fund / Top AI Bluechip Pick',
        icon: TrendingUp,
        color: '#C9A227',
      },
      gold: {
        percent: Math.round(goldWeight * 100),
        rupees: goldRupees,
        instrument: 'Nippon India Gold BeES / Sovereign Gold',
        icon: Coins,
        color: '#7C8AD4',
      },
      debt: {
        percent: Math.round(debtWeight * 100),
        rupees: debtRupees,
        instrument: 'Corporate Bond / Fixed Deposit (7.2% p.a.)',
        icon: Landmark,
        color: '#3FA88A',
      },
      cash: {
        percent: Math.round(cashWeight * 100),
        rupees: cashRupees,
        instrument: 'Auto-Sweep Liquid Savings Reserve',
        icon: Banknote,
        color: '#D9705C',
      },
    };
  }, [current, recommended, deployAmount, marketValuation]);

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

      if (deploymentPlan.equity.rupees > 0) {
        trades.push({
          symbol: 'NIFTYBEES.NS',
          name: 'Nifty 50 Index ETF',
          quantity: Math.max(1, Math.round(deploymentPlan.equity.rupees / 280)),
          pricePerUnit: 280,
          assetType: 'stock',
          metadata: { category: 'Equity Rebalance' },
          purchaseDate: today,
        });
      }

      if (deploymentPlan.gold.rupees > 0) {
        trades.push({
          symbol: 'GOLDBEES.NS',
          name: 'Gold BeES ETF',
          quantity: Math.max(1, Math.round(deploymentPlan.gold.rupees / 75)),
          pricePerUnit: 75,
          assetType: 'gold',
          metadata: { category: 'Precious Metals Hedge' },
          purchaseDate: today,
        });
      }

      if (deploymentPlan.debt.rupees > 0) {
        trades.push({
          symbol: 'FD-HDFC-SEC',
          name: 'HDFC High Yield FD (7.2% p.a.)',
          quantity: deploymentPlan.debt.rupees,
          pricePerUnit: 1,
          assetType: 'fd',
          metadata: { rate: 7.2, tenureMonths: 12 },
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

      setDeploySuccess(`Success! Rebalance plan of ₹${deployAmount.toLocaleString('en-IN')} is deployed. Previous allocations updated cleanly.`);
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

      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      queryClient.invalidateQueries({ queryKey: ['networth'] });
      queryClient.invalidateQueries({ queryKey: ['rebalance-plan'] });

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
          <span className="font-medium text-text-primary">Market Valuation Context (Nifty 50 P/E: {marketValuation.niftyPE}): </span>
          <span className="text-text-secondary">{marketValuation.rationale} {marketValuation.actionGuidance}</span>
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

                <p className="text-[11px] text-text-faint leading-tight line-clamp-2">
                  {item.instrument}
                </p>

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
