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
import { usePortfolio } from '@/lib/hooks/use-portfolio';
import { formatINR, formatINRCompact, formatDate, cn } from '@/lib/formatters';
import {
  aiInsights,
  recentActivity,
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
        <div className="bg-bg-surface border border-border-default rounded-[12px] p-6"
          style={{ background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-surface-2))' }}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
            <div className="flex-1">
              <span className="text-eyebrow mb-2 block">Net Worth</span>
              <div className="flex items-end gap-4 mb-2">
                <span
                  className="text-[42px] font-medium text-text-primary leading-none"
                  style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatINRCompact(portfolio.netWorth)}
                </span>
                <DeltaBadge value={portfolio.totalGainPercent} size="md" />
              </div>
              <div className="flex items-center gap-4 text-[13px]">
                <span className="text-text-secondary">
                  Assets: <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINRCompact(portfolio.totalCurrent)}</span>
                </span>
                <span className="text-text-secondary">
                  Invested: <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINRCompact(portfolio.totalInvested)}</span>
                </span>
                <span className="text-text-secondary">
                  Day:{' '}
                  <span className={cn(portfolio.dayChange >= 0 ? 'text-positive' : 'text-negative')} style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
                    {portfolio.dayChange >= 0 ? '+' : ''}
                    {formatINR(portfolio.dayChange)}
                  </span>
                </span>
              </div>
            </div>
            <AllocationDonut
              data={donutData}
              totalValue={formatINRCompact(portfolio.totalCurrent)}
              className="w-full lg:w-auto"
            />
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
              icon={<Icon className="w-4 h-4" />}
            />
          );
        })}
      </motion.div>

      {/* AI Advisor Banner Quick Link */}
      <motion.div variants={itemVariants}>
        <div className="bg-bg-surface-2 border border-accent-brass/30 rounded-[12px] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-brass/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-accent-brass" />
            </div>
            <div>
              <h3 className="text-[15px] font-medium text-text-primary">AI Wealth & Asset Allocation Advisor</h3>
              <p className="text-[12.5px] text-text-secondary">View Monte Carlo retirement trajectories, goal execution SIP plans, and multi-asset drift alerts.</p>
            </div>
          </div>
          <Link
            href="/dashboard/ai-advisor"
            className="flex items-center gap-2 bg-accent-brass hover:bg-accent-brass-dim text-bg-base px-4 py-2 rounded-[8px] text-[13px] font-medium transition-colors whitespace-nowrap shadow-sm"
          >
            Open AI Advisor <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio performance chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="bg-bg-surface border border-border-default rounded-[12px] p-6">
            <h2 className="text-[16px] font-medium text-text-primary mb-4">Portfolio Performance</h2>
            <IncomeLineChart data={portfolioHistory} height={280} />
          </div>
        </motion.div>

        {/* Watchlist */}
        <motion.div variants={itemVariants}>
          <div className="bg-bg-surface border border-border-default rounded-[12px] p-4">
            <h2 className="text-[16px] font-medium text-text-primary mb-3">Watchlist</h2>
            <div className="space-y-0.5">
              {favoriteStocks.length > 0 ? (
                favoriteStocks.map((stock) => (
                  <FavouriteStockRow key={stock.symbol} stock={stock} />
                ))
              ) : (
                <p className="text-[13px] text-text-faint py-4 text-center">
                  No favorites yet. Star stocks to add them here.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* AI Insights Summary */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-accent-brass" />
          <h2 className="text-[16px] font-medium text-text-primary">Portfolio Intelligence</h2>
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
          <div className="bg-bg-surface border border-border-default rounded-[12px] p-5">
            <h2 className="text-[16px] font-medium text-text-primary mb-4">Today&apos;s Movers</h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Gainers */}
              <div>
                <span className="text-eyebrow text-positive mb-3 block">Top Gainers</span>
                <div className="space-y-3">
                  {topGainers.map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-medium text-text-primary">{stock.symbol}</p>
                        <p className="text-[11px] text-text-faint" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
                          {formatINR(stock.cmp)}
                        </p>
                      </div>
                      <DeltaBadge value={stock.dayChangePercent} />
                    </div>
                  ))}
                </div>
              </div>
              {/* Losers */}
              <div>
                <span className="text-eyebrow text-negative mb-3 block">Top Losers</span>
                <div className="space-y-3">
                  {topLosers.map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-medium text-text-primary">{stock.symbol}</p>
                        <p className="text-[11px] text-text-faint" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
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
          <div className="bg-bg-surface border border-border-default rounded-[12px] p-5">
            <h2 className="text-[16px] font-medium text-text-primary mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.slice(0, 6).map((activity) => (
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
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
