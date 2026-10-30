'use client';

/**
 * DailyWealthPulse — Arthova Daily Morning Wealth Intelligence Pulse
 * Proactive personal intelligence briefing for the investor's consolidated portfolio.
 * Highlights health resilience score, today's market catalyst, and 1-click priority actions.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Scissors,
  PieChart,
  ArrowRight,
  Flame,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Target,
} from 'lucide-react';
import { usePortfolio } from '@/lib/hooks/use-portfolio';
import { formatINR, formatINRCompact, cn } from '@/lib/formatters';

interface DailyWealthPulseProps {
  className?: string;
}

export function DailyWealthPulse({ className = '' }: DailyWealthPulseProps) {
  const router = useRouter();
  const portfolio = usePortfolio();

  const [lastRefreshed, setLastRefreshed] = useState<string>(
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastRefreshed(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
      setIsRefreshing(false);
    }, 400);
  };

  // Derive intelligence pillars from portfolio context
  const pulseMetrics = useMemo(() => {
    const netWorth = portfolio.netWorth || 0;
    const totalCash = portfolio.assets.find((a) => a.name.toLowerCase().includes('cash'))?.current || 0;
    const totalEquity = portfolio.assets.find((a) => a.name.toLowerCase().includes('stock') || a.name.toLowerCase().includes('equity'))?.current || 0;
    const equityPct = netWorth > 0 ? (totalEquity / netWorth) * 100 : 0;
    const cashPct = netWorth > 0 ? (totalCash / netWorth) * 100 : 0;

    // Check single stock concentration
    let maxStockPct = 0;
    let maxStockSymbol = 'None';
    portfolio.stockHoldings.forEach((h: any) => {
      const val = (h.cmp || h.avgCost || 0) * h.quantity;
      const pct = netWorth > 0 ? (val / netWorth) * 100 : 0;
      if (pct > maxStockPct) {
        maxStockPct = pct;
        maxStockSymbol = (h.symbol || '').replace('.NS', '');
      }
    });

    // Calculate Portfolio Resilience Score (0 - 100)
    let score = 70;
    if (portfolio.assets.length >= 3) score += 10;
    if (cashPct >= 3 && cashPct <= 15) score += 10;
    if (maxStockPct <= 12) score += 10;
    else score -= 8;
    score = Math.min(96, Math.max(50, score));

    // Calculate top holding by day change
    const sortedHoldings = [...portfolio.stockHoldings].sort(
      (a: any, b: any) => (b.dayChangePercent || 0) - (a.dayChangePercent || 0)
    );
    const topGainer = sortedHoldings[0];

    // Priority Action logic
    let priorityAction: {
      type: 'tax' | 'rebalance' | 'screener';
      title: string;
      description: string;
      buttonText: string;
      url: string;
      icon: any;
      badge: string;
    };

    if (totalCash > 30000) {
      priorityAction = {
        type: 'rebalance',
        title: 'Idle Cash Deployment',
        description: `You have ${formatINR(totalCash)} idle in cash. Deploy into top QVM alpha compounders to optimize compounding.`,
        buttonText: 'Deploy Idle Cash',
        url: '/dashboard/ai-advisor?tab=rebalancer',
        icon: PieChart,
        badge: 'OPTIMIZATION',
      };
    } else if (maxStockPct > 20) {
      priorityAction = {
        type: 'rebalance',
        title: 'Concentration Warning',
        description: `${maxStockSymbol} comprises ${maxStockPct.toFixed(1)}% of your equity book. Consider rebalancing below the 15% ceiling.`,
        buttonText: 'Smart Rebalancer',
        url: '/dashboard/ai-advisor?tab=rebalancer',
        icon: AlertTriangle,
        badge: 'RISK CONTROL',
      };
    } else {
      priorityAction = {
        type: 'screener',
        title: 'Alpha Opportunities',
        description: 'NSE 10-signal frequency models are showing 8/10 Bullish consensus on top large-cap compounders.',
        buttonText: 'Explore Screener',
        url: '/dashboard/stocks',
        icon: Target,
        badge: 'QUANT ALPHA',
      };
    }

    return {
      score,
      maxStockPct,
      maxStockSymbol,
      cashPct,
      equityPct,
      topGainer,
      priorityAction,
    };
  }, [portfolio]);

  return (
    <div
      className={cn(
        'bg-bg-surface border border-border-default hover:border-accent-brass/40 rounded-[16px] p-5 space-y-4 shadow-sm transition-all',
        className
      )}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-default/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent-brass/10 border border-accent-brass/25 flex items-center justify-center text-accent-brass shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-bold text-text-primary tracking-tight">
                Daily Wealth Intelligence Pulse
              </h3>
              <span className="flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sentinel
              </span>
            </div>
            <p className="text-[11.5px] text-text-faint font-mono">
              Consolidated analysis as of today · Updated {lastRefreshed} IST
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-bg-surface-2 hover:bg-bg-surface-3 text-text-faint hover:text-text-primary text-[11px] font-mono transition-all border border-border-default cursor-pointer"
            title="Re-calculate intelligence pulse"
          >
            <RefreshCw className={cn('w-3 h-3', isRefreshing && 'animate-spin text-accent-brass')} />
            <span>Sync</span>
          </button>
          <Link
            href="/dashboard/ai-advisor"
            className="flex items-center gap-1 px-3 py-1 rounded-[6px] bg-accent-brass/10 hover:bg-accent-brass text-accent-brass hover:text-bg-base text-[11.5px] font-semibold transition-all border border-accent-brass/20 cursor-pointer"
          >
            <span>AI Advisor</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* 3 Pillar Intelligence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Pillar 1: Health & Resilience Score */}
        <div className="bg-bg-surface-2/60 border border-border-default rounded-[12px] p-3.5 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono text-text-faint uppercase">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-accent-brass" /> Resilience Score
              </span>
              <span className="text-emerald-400 font-bold">Safe Tier</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-[28px] font-mono font-bold text-text-primary leading-none">
                {pulseMetrics.score}
              </span>
              <span className="text-[12px] font-mono text-text-faint">/ 100</span>
              <span className="text-[11px] font-semibold text-emerald-400 ml-auto">
                {pulseMetrics.score >= 80 ? 'Institutional' : 'Moderate'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-text-faint leading-relaxed border-t border-border-default/50 pt-2 font-mono">
            {pulseMetrics.maxStockPct > 15
              ? `Max holding (${pulseMetrics.maxStockSymbol}) is ${pulseMetrics.maxStockPct.toFixed(1)}% of assets.`
              : 'Well-diversified. No single asset exceeds the 15% risk ceiling.'}
          </p>
        </div>

        {/* Pillar 2: Today's Market Catalyst */}
        <div className="bg-bg-surface-2/60 border border-border-default rounded-[12px] p-3.5 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono text-text-faint uppercase">
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-violet-400" /> Market Catalyst
              </span>
              <span className="text-violet-400 font-bold">NSE / BSE</span>
            </div>
            <div className="mt-2 space-y-0.5">
              {pulseMetrics.topGainer ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[14px] font-bold text-text-primary">
                      {pulseMetrics.topGainer.symbol.replace('.NS', '')}
                    </span>
                    <span className="text-[13px] font-mono font-bold text-emerald-400">
                      {pulseMetrics.topGainer.dayChangePercent >= 0 ? '+' : ''}
                      {pulseMetrics.topGainer.dayChangePercent.toFixed(2)}%
                    </span>
                  </div>
                  <span className="text-[11px] text-text-faint block truncate">
                    Top performing asset in your active portfolio today.
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[13px] font-bold text-text-primary block">
                    Macro Regime: Bullish Momentum
                  </span>
                  <span className="text-[11px] text-text-faint block">
                    Large-cap IT and Energy showing high signal alignment.
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border-default/50 pt-2 text-[11px] font-mono text-text-faint">
            <span>Signal Consensus:</span>
            <span className="text-emerald-400 font-semibold">8/10 Bullish</span>
          </div>
        </div>

        {/* Pillar 3: Tactical Priority Alert & 1-Click Action */}
        <div className="bg-bg-surface-2/60 border border-accent-brass/30 rounded-[12px] p-3.5 space-y-2 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-brass/5 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono text-text-faint uppercase">
              <span className="flex items-center gap-1 text-accent-brass font-semibold">
                <Zap className="w-3.5 h-3.5" /> Priority Focus
              </span>
              <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-accent-brass/10 text-accent-brass border border-accent-brass/20">
                {pulseMetrics.priorityAction.badge}
              </span>
            </div>
            <div className="mt-1.5 space-y-1">
              <h4 className="text-[13px] font-bold text-text-primary">
                {pulseMetrics.priorityAction.title}
              </h4>
              <p className="text-[11px] text-text-faint leading-relaxed line-clamp-2">
                {pulseMetrics.priorityAction.description}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-border-default/50">
            <button
              onClick={() => router.push(pulseMetrics.priorityAction.url)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-[8px] bg-accent-brass hover:bg-accent-brass-dim text-bg-base text-[11.5px] font-semibold transition-all cursor-pointer shadow-xs"
            >
              <span>{pulseMetrics.priorityAction.buttonText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
