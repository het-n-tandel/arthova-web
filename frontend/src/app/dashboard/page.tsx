'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  TrendingUp,
  PiggyBank,
  Coins,
  Landmark,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { usePortfolio } from '@/lib/hooks/use-portfolio';
import { formatINR, formatINRCompact, formatDate, cn } from '@/lib/formatters';
import {
  aiInsights,
  generatePortfolioHistory,
} from '@/lib/mock-data';
import { SummaryCard } from '@/components/ui/summary-card';
import { DeltaBadge } from '@/components/ui/delta-badge';
import { AllocationDonut } from '@/components/charts/allocation-donut';
import { IncomeLineChart } from '@/components/charts/income-line-chart';
import { AIInsightCard } from '@/components/portfolio/ai-insight-card';
import { FavouriteStockRow } from '@/components/portfolio/favourite-stock-row';
import { useLedgerStore } from '@/lib/store';

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

const assetIconMap: Record<string, any> = {
  'Stocks': TrendingUp,
  'Mutual Funds': PiggyBank,
  'Gold & Silver': Coins,
  'Fixed Deposits': Landmark,
  'Property': Building2,
  'Crypto': Activity,
  'Cash': Landmark,
  'Bonds': Landmark,
};

const assetColors = ['#C9A227', '#3FA88A', '#7C8AD4', '#D9705C', '#E0B34C', '#8A5CF5', '#38BDF8', '#F43F5E'];

export default function DashboardPage() {
  const portfolio = usePortfolio();
  const favorites = useLedgerStore((s) => s.favorites);

  const { data: activityData, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const res = await fetch('/api/portfolio/activity');
      if (!res.ok) return { activities: [] };
      return res.json();
    },
  });
  const activitiesList = activityData?.activities || [];

  const portfolioHistory = useMemo(() => generatePortfolioHistory(portfolio.netWorth, 12), [portfolio.netWorth]);

  const donutData = portfolio.assets.map((a, i) => ({
    name: a.name,
    value: a.allocation,
    current: a.current,
    color: assetColors[i % assetColors.length],
  }));

  const favoriteStocks = portfolio.stockHoldings.filter((s: any) => favorites.has(s.symbol));

  const topGainers = [...portfolio.stockHoldings]
    .sort((a, b) => b.dayChangePercent - a.dayChangePercent)
    .slice(0, 3);
  const topLosers = [...portfolio.stockHoldings]
    .sort((a, b) => a.dayChangePercent - b.dayChangePercent)
    .slice(0, 3);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Page header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] text-text-primary mb-1">Dashboard</h1>
          <p className="text-[13px] text-text-faint">
            Portfolio overview as of {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link
          href="/dashboard/ai-advisor"
          className="flex items-center gap-2 bg-accent-brass/10 hover:bg-accent-brass/20 text-accent-brass px-3.5 py-1.5 rounded-[8px] text-[13px] font-medium transition-colors border border-accent-brass/30"
        >
          <Sparkles className="w-4 h-4" />
          AI Advisor <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </motion.div>

      {/* Hero: Total value + Allocation donut */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-2xl glass-card-elevated p-7 sm:p-8 border border-border shadow-2xl">
          {/* Subtle Ambient Radial Glow Inside Hero */}

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-[11.5px] font-mono tracking-wider uppercase text-emerald-600 dark:text-emerald-400 font-semibold">
                  Live Consolidated Net Worth
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-4">
                <span
                  className="text-[44px] sm:text-[52px] font-bold tracking-tight leading-none text-gradient-emerald"
                  style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatINRCompact(portfolio.netWorth)}
                </span>
                <DeltaBadge value={portfolio.totalGainPercent} size="md" />
              </div>

              {/* Stat breakdown pills */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-[13px]">
                <div className="px-3 py-1.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-border flex items-center gap-2">
                  <span className="text-text-faint">Assets</span>
                  <span className="text-text-primary font-mono font-medium">{formatINRCompact(portfolio.totalCurrent)}</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-border flex items-center gap-2">
                  <span className="text-text-faint">Invested</span>
                  <span className="text-text-primary font-mono font-medium">{formatINRCompact(portfolio.totalInvested)}</span>
                </div>
                {portfolio.totalLiabilities > 0 && (
                  <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                    <span className="text-amber-500 dark:text-amber-400">Total Debt</span>
                    <span className="text-amber-600 dark:text-amber-300 font-mono font-medium">{formatINRCompact(portfolio.totalLiabilities)}</span>
                  </div>
                )}
                <div className="px-3 py-1.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-border flex items-center gap-2">
                  <span className="text-text-faint">Day Gain</span>
                  <span className={cn('font-mono font-medium', portfolio.dayChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                    {portfolio.dayChange >= 0 ? '+' : ''}{formatINR(portfolio.dayChange)}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-auto flex justify-center">
              <AllocationDonut
                data={donutData}
                totalValue={formatINRCompact(portfolio.totalCurrent)}
                className="w-full lg:w-auto"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Summary cards grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {portfolio.assets.map((asset) => {
          const Icon = assetIconMap[asset.name] || TrendingUp;
          return (
            <SummaryCard
              key={asset.name}
              label={asset.name}
              value={formatINRCompact(asset.current)}
              delta={asset.gainPercent}
              sublabel={`${asset.allocation.toFixed(1)}% of portfolio`}
              icon={<Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            />
          );
        })}
      </motion.div>

      {/* AI Advisor Banner Quick Link */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-xl glass-card p-5 sm:p-6 border border-emerald-500/25 hover:border-emerald-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 group shadow-lg">
          <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-[16px] font-semibold text-text-primary">Institutional AI Wealth Advisor</h3>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  SEBI RIA Model
                </span>
              </div>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                QVM quantitative stock scoring, demographic market-cap bounds, and realistic goal-outflow retirement simulations.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/ai-advisor"
            className="relative z-10 flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold px-5 py-2.5 rounded-lg text-[13.5px] transition-all whitespace-nowrap shadow-md shadow-emerald-500/25 group-hover:shadow-emerald-500/40"
          >
            Open AI Advisor <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio performance chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="rounded-xl glass-card p-6 border border-border shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-text-primary">Portfolio Performance</h2>
              <span className="text-[12px] text-text-faint font-mono">12-Month Historical Trajectory</span>
            </div>
            <IncomeLineChart data={portfolioHistory} height={280} />
          </div>
        </motion.div>

        {/* Watchlist */}
        <motion.div variants={itemVariants}>
          <div className="rounded-xl glass-card p-5 border border-border shadow-lg">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-[16px] font-semibold text-text-primary">Watchlist</h2>
              <span className="text-[11px] font-mono text-text-faint uppercase tracking-wider">Starred</span>
            </div>
            <div className="space-y-1">
              {favoriteStocks.length > 0 ? (
                favoriteStocks.map((stock) => (
                  <FavouriteStockRow key={stock.symbol} stock={stock} />
                ))
              ) : (
                <p className="text-[13px] text-text-faint py-6 text-center">
                  No favorites yet. Star stocks to add them here.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* AI Insights Summary */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-6 h-6 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-[16px] font-semibold text-text-primary">Portfolio Intelligence</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiInsights.slice(0, 3).map((insight) => (
            <AIInsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </motion.div>

      {/* Top Movers + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Movers */}
        <motion.div variants={itemVariants}>
          <div className="rounded-xl glass-card p-6 border border-border shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-text-primary">Market Movers</h2>
              <span className="text-[11px] font-mono text-text-faint uppercase">Intraday</span>
            </div>
            <div className="grid grid-cols-2 gap-5">
              {/* Gainers */}
              <div className="p-3.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-border">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3 block">
                  Top Gainers
                </span>
                <div className="space-y-3">
                  {topGainers.map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-semibold text-text-primary">{stock.symbol}</p>
                        <p className="text-[11px] text-text-faint font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {formatINR(stock.cmp)}
                        </p>
                      </div>
                      <DeltaBadge value={stock.dayChangePercent} />
                    </div>
                  ))}
                </div>
              </div>
              {/* Losers */}
              <div className="p-3.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-border">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-3 block">
                  Top Losers
                </span>
                <div className="space-y-3">
                  {topLosers.map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-semibold text-text-primary">{stock.symbol}</p>
                        <p className="text-[11px] text-text-faint font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {formatINR(stock.cmp)}
                        </p>
                      </div>
                      <DeltaBadge value={stock.dayChangePercent} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          <div className="rounded-xl glass-card p-6 border border-border shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-text-primary">Recent Activity</h2>
              <span className="text-[11px] font-mono text-text-faint uppercase">Audit Trail</span>
            </div>
            {isLoadingActivity ? (
              <div className="py-8 text-center text-[13px] text-text-faint">Loading activity feed...</div>
            ) : activitiesList.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-border rounded-lg bg-black/[0.02] dark:bg-white/[0.02]">
                <p className="text-[13.5px] font-medium text-text-secondary">No recent transactions yet.</p>
                <p className="text-[11.5px] text-text-faint mt-1">Trades, deposits, and broker syncs will record here automatically.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activitiesList.slice(0, 6).map((activity: any) => (
                  <div key={activity.id} className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0',
                      activity.amount > 0 ? 'bg-positive-bg' : 'bg-bg-surface-2'
                    )}>
                      {activity.amount > 0 ? (
                        <ArrowDownRight className="w-4 h-4 text-positive" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-text-faint" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-text-primary truncate">{activity.description}</p>
                      <p className="text-[11px] text-text-faint">{formatDate(activity.date)}</p>
                    </div>
                    <span
                      className={cn('text-[13px]', activity.amount > 0 ? 'text-positive' : 'text-text-secondary')}
                      style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}
                    >
                      {activity.amount > 0 ? '+' : ''}{formatINR(activity.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
