'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { usePortfolio } from '@/lib/hooks/use-portfolio';
import { formatINR, formatINRCompact, cn } from '@/lib/formatters';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  name: string;
  currentPrice: number;
  initialAction?: 'buy' | 'sell';
  assetType?: 'stock' | 'mutual_fund' | 'crypto' | 'gold';
  qvmScore?: number;
  suitabilityVerdict?: string;
  userRiskLabel?: string;
}

export function TradeModal({
  isOpen,
  onClose,
  symbol,
  name,
  currentPrice,
  initialAction = 'buy',
  assetType = 'stock',
  qvmScore,
  suitabilityVerdict,
  userRiskLabel,
}: TradeModalProps) {
  const queryClient = useQueryClient();
  const portfolio = usePortfolio();

  const [action, setAction] = useState<'buy' | 'sell'>(initialAction);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState<number>(currentPrice || 100);
  const [quantity, setQuantity] = useState<number>(1);
  const [fundingSource, setFundingSource] = useState<'cash' | 'external'>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync initial action and price when opened
  useEffect(() => {
    if (isOpen) {
      setAction(initialAction);
      setLimitPrice(currentPrice || 100);
      setQuantity(1);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialAction, currentPrice]);

  // Find if user already owns this asset
  const existingPosition = useMemo(() => {
    const sym = symbol.toUpperCase();
    const cleanSym = sym.replace('.NS', '').replace('.BO', '');
    return portfolio.rawHoldings.find((h: any) => {
      const hSym = (h.symbol || '').toUpperCase().replace('.NS', '').replace('.BO', '');
      return hSym === cleanSym || (h.name && h.name.toLowerCase() === name.toLowerCase());
    });
  }, [portfolio.rawHoldings, symbol, name]);

  const ownedQuantity = existingPosition ? parseFloat(existingPosition.quantity || '0') : 0;
  const existingAvgCost = existingPosition ? parseFloat(existingPosition.avgCost || '0') : 0;

  // Liquid cash balance
  const cashHolding = portfolio.rawHoldings.find((h: any) => h.symbol === 'CASH');
  const availableCash = cashHolding ? parseFloat(cashHolding.quantity || '0') : 0;

  const executionPrice = orderType === 'market' ? (currentPrice || 1) : (limitPrice || 1);
  const totalTradeValue = quantity * executionPrice;
  const estCharges = Math.max(20, totalTradeValue * 0.001); // 0.1% or ₹20

  // Risk concentration check (10% ceiling)
  const totalPortfolioValue = Math.max(portfolio.netWorth, 100000);
  const projectedPositionValue = (action === 'buy' ? (ownedQuantity + quantity) : Math.max(0, ownedQuantity - quantity)) * executionPrice;
  const concentrationPercent = (projectedPositionValue / totalPortfolioValue) * 100;
  const isOverConcentrated = concentrationPercent > 10;

  // Quick percent helpers
  const handleCashPercent = (pct: number) => {
    if (action === 'buy') {
      const budget = (availableCash > 0 ? availableCash : totalPortfolioValue * 0.05) * (pct / 100);
      const calculatedQty = Math.max(1, Math.floor(budget / executionPrice));
      setQuantity(calculatedQty);
    } else {
      const calculatedQty = Math.max(1, Math.floor(ownedQuantity * (pct / 100)));
      setQuantity(calculatedQty);
    }
  };

  const handleExecuteTrade = async () => {
    setErrorMsg(null);
    if (quantity <= 0) {
      setErrorMsg('Quantity must be greater than zero.');
      return;
    }

    if (action === 'sell' && quantity > ownedQuantity) {
      setErrorMsg(`Cannot sell ${quantity} units. You currently own ${ownedQuantity} units.`);
      return;
    }

    if (action === 'buy' && fundingSource === 'cash' && availableCash > 0 && totalTradeValue > availableCash) {
      setErrorMsg(`Insufficient cash balance (₹${availableCash.toLocaleString('en-IN')}). Switch funding source to 'External Account' or reduce quantity.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/portfolio/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetType,
          symbol,
          name,
          quantity: quantity.toString(),
          pricePerUnit: executionPrice.toString(),
          transactionType: action,
          metadata: {
            orderType,
            qvmScore,
            suitabilityVerdict,
            source: 'qvm_direct_execution',
            fundingSource,
          },
          purchaseDate: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to execute trade.');
      }

      // Success
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      queryClient.invalidateQueries({ queryKey: ['networth'] });
      queryClient.invalidateQueries({ queryKey: ['rebalance-plan'] });

      setSuccessMsg(
        `Successfully executed ${action.toUpperCase()} order for ${quantity} shares of ${symbol} at ₹${executionPrice.toFixed(2)}.`
      );

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Trade execution failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-lg rounded-2xl border border-border-default bg-bg-surface p-6 shadow-2xl space-y-5"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold uppercase px-2.5 py-0.5 rounded-full bg-accent-brass/10 text-accent-brass border border-accent-brass/20">
                  {assetType === 'stock' ? 'Equity Order' : assetType.toUpperCase()}
                </span>
                {qvmScore && (
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-positive/10 text-positive border border-positive/20">
                    QVM {qvmScore}/100
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                {name}
                <span className="text-xs font-mono font-normal text-text-faint">({symbol})</span>
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-faint hover:text-text-primary hover:bg-bg-surface-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Tabs: BUY vs SELL */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-bg-surface-2 border border-border-default">
            <button
              type="button"
              onClick={() => setAction('buy')}
              className={cn(
                'flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all',
                action === 'buy'
                  ? 'bg-positive text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <TrendingUp className="w-4 h-4" />
              BUY / ACCUMULATE
            </button>
            <button
              type="button"
              onClick={() => setAction('sell')}
              className={cn(
                'flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all',
                action === 'sell'
                  ? 'bg-negative text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <TrendingDown className="w-4 h-4" />
              SELL / TRIM
            </button>
          </div>

          {/* Position Info Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-bg-surface-2/60 border border-border-default text-xs">
            <div>
              <span className="text-text-faint block text-[11px]">Current Holding:</span>
              <span className="font-mono font-medium text-text-primary">
                {ownedQuantity > 0 ? `${ownedQuantity} units @ avg ₹${existingAvgCost.toFixed(2)}` : 'No current position'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-text-faint block text-[11px]">Market CMP:</span>
              <span className="font-mono font-bold text-accent-brass text-[13px]">
                {formatINR(currentPrice)}
              </span>
            </div>
          </div>

          {/* Order Type & Price Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-text-secondary">Order Type</label>
              <div className="flex gap-1.5 bg-bg-surface-2 p-0.5 rounded-lg border border-border-default">
                <button
                  type="button"
                  onClick={() => setOrderType('market')}
                  className={cn(
                    'px-2.5 py-1 rounded text-[11px] font-mono transition-colors',
                    orderType === 'market' ? 'bg-bg-surface text-text-primary shadow-xs font-bold' : 'text-text-faint'
                  )}
                >
                  MARKET
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('limit')}
                  className={cn(
                    'px-2.5 py-1 rounded text-[11px] font-mono transition-colors',
                    orderType === 'limit' ? 'bg-bg-surface text-text-primary shadow-xs font-bold' : 'text-text-faint'
                  )}
                >
                  LIMIT
                </button>
              </div>
            </div>

            {orderType === 'limit' && (
              <div className="space-y-1">
                <label className="text-[11px] text-text-faint">Limit Price (₹)</label>
                <input
                  type="number"
                  step="0.05"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(Math.max(0.01, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-border-default bg-bg-surface font-mono text-sm text-text-primary focus:outline-none focus:border-accent-brass transition-colors"
                />
              </div>
            )}

            {/* Quantity Input + Increment buttons */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-text-secondary">Quantity (Shares)</label>
                <div className="flex items-center gap-1">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleCashPercent(pct)}
                      className="px-2 py-0.5 rounded bg-bg-surface-2 hover:bg-bg-surface-3 border border-border-default text-[10px] font-mono text-text-secondary transition-colors"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-xl border border-border-default bg-bg-surface-2 hover:bg-bg-surface-3 font-mono font-bold text-text-primary flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 px-3 py-2 text-center rounded-xl border border-border-default bg-bg-surface font-mono font-bold text-base text-text-primary focus:outline-none focus:border-accent-brass transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-10 rounded-xl border border-border-default bg-bg-surface-2 hover:bg-bg-surface-3 font-mono font-bold text-text-primary flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Funding Source & Available Cash (Buy mode only) */}
          {action === 'buy' && (
            <div className="p-3 rounded-xl border border-border-default bg-bg-surface-2/40 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-text-secondary">
                  <Wallet className="w-3.5 h-3.5 text-accent-brass" />
                  <span>Funding Source:</span>
                </div>
                <div className="flex gap-1.5 font-mono text-[11px]">
                  <button
                    type="button"
                    onClick={() => setFundingSource('cash')}
                    className={cn(
                      'px-2 py-0.5 rounded transition-colors',
                      fundingSource === 'cash' ? 'bg-accent-brass text-bg-base font-bold' : 'text-text-faint'
                    )}
                  >
                    Cash Balance (₹{availableCash.toLocaleString('en-IN')})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFundingSource('external')}
                    className={cn(
                      'px-2 py-0.5 rounded transition-colors',
                      fundingSource === 'external' ? 'bg-accent-brass text-bg-base font-bold' : 'text-text-faint'
                    )}
                  >
                    Bank Transfer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Concentration Guardrail Alert */}
          {action === 'buy' && isOverConcentrated && (
            <div className="p-3 rounded-xl bg-warning/10 border border-warning/30 text-warning text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold block">Risk Ceiling Warning:</span>
                <p className="text-[11px] leading-relaxed text-warning/90">
                  This trade will bring {symbol} to <strong className="font-mono">{concentrationPercent.toFixed(1)}%</strong> of your total portfolio, exceeding the 10% maximum single-stock diversification ceiling.
                </p>
              </div>
            </div>
          )}

          {/* Trade Summary Card */}
          <div className="p-3.5 rounded-xl border border-border-default bg-bg-surface-2 space-y-2 text-xs">
            <div className="flex justify-between items-center text-text-secondary">
              <span>Order Value:</span>
              <span className="font-mono font-semibold text-text-primary text-[13px]">
                {formatINR(totalTradeValue)}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-text-faint">
              <span>Est. STT & Exchange Charges:</span>
              <span className="font-mono">~{formatINR(estCharges)}</span>
            </div>
            <div className="border-t border-border-default pt-2 flex justify-between items-center font-medium">
              <span className="text-text-primary">Estimated Net Total:</span>
              <span className="font-mono text-base font-bold text-accent-brass">
                {formatINR(action === 'buy' ? (totalTradeValue + estCharges) : (totalTradeValue - estCharges))}
              </span>
            </div>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-positive/10 border border-positive/30 text-positive text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            disabled={isSubmitting || !!successMsg}
            onClick={handleExecuteTrade}
            className={cn(
              'w-full py-3 rounded-xl text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2',
              action === 'buy'
                ? 'bg-positive hover:bg-positive/90 text-white'
                : 'bg-negative hover:bg-negative/90 text-white',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Executing Order with Supabase...
              </>
            ) : (
              <>
                Confirm {action.toUpperCase()} ({quantity} shares · {formatINR(totalTradeValue)})
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
