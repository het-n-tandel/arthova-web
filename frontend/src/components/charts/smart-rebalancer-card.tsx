'use client';

import { useState, useMemo } from 'react';
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
  SlidersHorizontal
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
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
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
          transactionType: 'buy',
          assetType: 'stock',
          metadata: JSON.stringify({ category: 'Equity Rebalance' }),
          purchaseDate: today,
        });
      }

      if (deploymentPlan.gold.rupees > 0) {
        trades.push({
          symbol: 'GOLDBEES.NS',
          name: 'Gold BeES ETF',
          quantity: Math.max(1, Math.round(deploymentPlan.gold.rupees / 75)),
          pricePerUnit: 75,
          transactionType: 'buy',
          assetType: 'gold',
          metadata: JSON.stringify({ category: 'Precious Metals Hedge' }),
          purchaseDate: today,
        });
      }

      if (deploymentPlan.debt.rupees > 0) {
        trades.push({
          symbol: 'FD-HDFC-SEC',
          name: 'HDFC High Yield FD (7.2% p.a.)',
          quantity: deploymentPlan.debt.rupees,
          pricePerUnit: 1,
          transactionType: 'buy',
          assetType: 'fd',
          metadata: JSON.stringify({ rate: 7.2, tenureMonths: 12 }),
          purchaseDate: today,
        });
      }

      // Execute trades via backend API
      for (const trade of trades) {
        const res = await fetch(`http://localhost:8080/api/public/portfolio/${userId}/trade`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(trade),
        });
        if (!res.ok) {
          const errDetail = await res.text().catch(() => '');
          console.error('Rebalance trade failed:', res.status, errDetail);
          throw new Error(`Failed to record trade for ${trade.symbol}: ${res.statusText || 'Server error'}`);
        }
      }

      // Invalidate queries to reload portfolio and net worth
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      queryClient.invalidateQueries({ queryKey: ['networth'] });

      setDeploySuccess(true);
      setTimeout(() => setDeploySuccess(false), 8000);
    } catch (err: any) {
      console.error('Rebalance execution error:', err);
      setErrorMessage(err.message || 'Error deploying rebalance plan.');
    } finally {
      setIsDeploying(false);
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

        {/* Tactical Market Valuation Badge */}
        <div className="flex items-center gap-2">
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
              min={1000}
              max={1000000}
              step={1000}
              value={deployAmount}
              onChange={(e) => setDeployAmount(Math.max(1000, Number(e.target.value)))}
              className="w-28 bg-transparent text-right font-mono font-medium text-[15px] text-text-primary outline-none"
            />
          </div>
        </div>

        <input
          type="range"
          min={5000}
          max={200000}
          step={2500}
          value={deployAmount}
          onChange={(e) => setDeployAmount(Number(e.target.value))}
          className="w-full accent-[#C9A227] cursor-pointer h-2 bg-bg-surface-3 rounded-lg"
        />

        <div className="flex justify-between text-[11px] text-text-faint font-mono">
          <span>₹5,000/mo</span>
          <span>₹50,000/mo</span>
          <span>₹1,00,000/mo</span>
          <span>₹2,00,000/mo</span>
        </div>
      </div>

      {/* Proportional Deployment Plan */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-eyebrow text-text-faint">Tactical Rupee Distribution</span>
          <span className="text-[12px] font-mono text-text-faint">
            Total to Deploy: <strong className="text-text-primary">{formatINR(deployAmount)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(deploymentPlan).map(([key, item]) => {
            const Icon = item.icon;
            return (
              <div
                key={key}
                className="bg-bg-surface-2 border border-border-default rounded-[10px] p-3.5 space-y-2 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: item.color }} />
                    <span className="text-[12.5px] font-medium text-text-primary capitalize">{key}</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-bg-surface text-text-secondary">
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
        <div className="flex items-center gap-2 text-[12px] text-text-secondary">
          <CheckCircle2 className="w-4 h-4 text-positive" />
          <span>Executing this plan will eliminate negative portfolio drift uniformly.</span>
        </div>

        <button
          onClick={handleExecuteRebalance}
          disabled={isDeploying || deployAmount <= 0}
          className={cn(
            'flex items-center justify-center gap-2 px-6 py-2.5 rounded-[8px] font-medium text-[13.5px] transition-all shadow-sm w-full sm:w-auto',
            'bg-accent-brass hover:bg-accent-brass-dim text-bg-base font-semibold',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isDeploying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Deploying to Portfolio...</span>
            </>
          ) : (
            <>
              <span>Deploy & Log Plan to Portfolio</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
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
            <span>Success! ₹{deployAmount.toLocaleString('en-IN')} has been deployed across your target asset classes and logged to your portfolio.</span>
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
