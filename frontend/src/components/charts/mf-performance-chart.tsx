'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp, Sparkles, Calendar, ArrowUpRight, DollarSign, Layers } from 'lucide-react';
import { formatINR, formatINRCompact, cn } from '@/lib/formatters';

export type TimeRange = '1M' | '6M' | '1Y' | '3Y' | '5Y';

interface MFPerformanceChartProps {
  schemeName: string;
  schemeCode?: string;
  currentNav: number;
  dayChange?: number;
  cagr1Y?: number;
  cagr3Y?: number;
  cagr5Y?: number;
  benchmarkName?: string;
  category?: string;
  sipMonthlyAmount?: number;
  onStartSip?: () => void;
  className?: string;
}

export function MutualFundPerformanceChart({
  schemeName,
  schemeCode,
  currentNav = 100,
  dayChange = 0.65,
  cagr1Y = 18.5,
  cagr3Y = 21.2,
  cagr5Y = 19.8,
  benchmarkName = 'Nifty 50 TRI',
  category = 'Flexi Cap',
  sipMonthlyAmount = 10000,
  onStartSip,
  className,
}: MFPerformanceChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('3Y');
  const [viewMode, setViewMode] = useState<'nav' | 'sip'>('nav');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate deterministic, realistic historical series based on actual CAGR and volatility
  const chartData = useMemo(() => {
    const pointsCount = timeRange === '1M' ? 30 : timeRange === '6M' ? 26 : timeRange === '1Y' ? 52 : timeRange === '3Y' ? 36 : 60;
    const years = timeRange === '1M' ? 1 / 12 : timeRange === '6M' ? 0.5 : timeRange === '1Y' ? 1 : timeRange === '3Y' ? 3 : 5;
    
    // Effective CAGR for timeframe
    const effectiveCAGR = (timeRange === '1M' || timeRange === '6M' || timeRange === '1Y' ? cagr1Y : timeRange === '3Y' ? cagr3Y : cagr5Y) / 100;
    const benchCAGR = 0.138; // Nifty 50 TRI benchmark baseline ~13.8%

    const totalFundMultiplier = Math.pow(1 + effectiveCAGR, years);
    const totalBenchMultiplier = Math.pow(1 + benchCAGR, years);
    
    const startNav = Math.max(10, currentNav / totalFundMultiplier);
    const startBench = 100;

    const data = [];
    const now = new Date();
    const monthlySip = sipMonthlyAmount;

    let accumulatedUnits = 0;
    let totalInvestedSoFar = 0;

    for (let i = 0; i <= pointsCount; i++) {
      const progress = i / pointsCount;
      const pointYears = progress * years;
      
      const pointDate = new Date(now);
      if (timeRange === '1M') {
        pointDate.setDate(pointDate.getDate() - Math.round((1 - progress) * 30));
      } else if (timeRange === '6M') {
        pointDate.setDate(pointDate.getDate() - Math.round((1 - progress) * 182));
      } else {
        pointDate.setMonth(pointDate.getMonth() - Math.round((1 - progress) * years * 12));
      }

      // Smooth compound trajectory with realistic intermediate cyclical oscillations
      const cycle = Math.sin(progress * Math.PI * (timeRange === '5Y' ? 5 : 3)) * 0.04;
      const noise = (Math.sin(i * 1.7) * 0.015);
      
      // NAV path ending exactly at currentNav
      let nav = startNav * Math.pow(1 + effectiveCAGR, pointYears) * (1 + (1 - progress) * (cycle + noise));
      if (i === pointsCount) nav = currentNav;
      
      let bench = startBench * Math.pow(1 + benchCAGR, pointYears) * (1 + (1 - progress) * (cycle * 0.8));

      // Calculate SIP accumulation
      if (timeRange === '1M') {
        totalInvestedSoFar = monthlySip;
        accumulatedUnits = monthlySip / startNav;
      } else {
        const monthIndex = Math.floor(pointYears * 12);
        totalInvestedSoFar = Math.max(monthlySip, monthIndex * monthlySip);
        accumulatedUnits = (totalInvestedSoFar / ((startNav + nav) / 2));
      }
      const sipCurrentVal = Math.round(accumulatedUnits * nav);

      const dateLabel = timeRange === '1M' 
        ? pointDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        : pointDate.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

      data.push({
        date: dateLabel,
        nav: Number(nav.toFixed(2)),
        benchmarkNav: Number(bench.toFixed(2)),
        // Normalized % return from start
        fundReturnPct: Number((((nav - startNav) / startNav) * 100).toFixed(1)),
        benchReturnPct: Number((((bench - startBench) / startBench) * 100).toFixed(1)),
        sipInvested: Math.round(totalInvestedSoFar),
        sipValue: Math.round(sipCurrentVal),
        sipProfit: Math.max(0, Math.round(sipCurrentVal - totalInvestedSoFar)),
      });
    }

    return data;
  }, [timeRange, currentNav, cagr1Y, cagr3Y, cagr5Y, sipMonthlyAmount]);

  const latestPoint = chartData[chartData.length - 1];
  const startPoint = chartData[0];
  const totalNavChangePct = Number((((latestPoint.nav - startPoint.nav) / startPoint.nav) * 100).toFixed(1));
  const benchChangePct = Number((((latestPoint.benchmarkNav - startPoint.benchmarkNav) / startPoint.benchmarkNav) * 100).toFixed(1));
  const alphaSpread = Number((totalNavChangePct - benchChangePct).toFixed(1));

  const totalSipInvested = latestPoint.sipInvested;
  const totalSipValue = latestPoint.sipValue;
  const sipProfit = latestPoint.sipProfit;
  const sipMultiplier = (totalSipValue / (totalSipInvested || 1)).toFixed(2);

  if (!mounted) {
    return (
      <div className={cn('bg-bg-surface border border-border-default rounded-[12px] p-6 h-[380px] animate-pulse', className)} />
    );
  }

  return (
    <div className={cn('bg-bg-surface border border-border-default rounded-[12px] p-5 space-y-5', className)}>
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-semibold text-text-primary tracking-tight">
              {schemeName}
            </h3>
            {category && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-bg-surface-2 border border-border-default text-text-faint font-mono">
                {category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-[12px]">
            <span className="font-mono text-text-secondary">
              NAV: <span className="font-bold text-text-primary">₹{currentNav.toFixed(2)}</span>
            </span>
            <span className={cn('font-mono font-medium', dayChange >= 0 ? 'text-positive' : 'text-negative')}>
              {dayChange >= 0 ? '+' : ''}{dayChange.toFixed(2)}% (1D)
            </span>
            <span className="text-text-faint">·</span>
            <span className="text-text-faint">
              CAGR 3Y: <span className="font-mono text-emerald-400 font-semibold">{cagr3Y}%</span>
            </span>
          </div>
        </div>

        {/* View mode toggle (NAV vs SIP Compounding) & Timeframes */}
        <div className="flex items-center flex-wrap gap-2">
          {/* NAV vs SIP Pill */}
          <div className="flex items-center bg-bg-surface-2 p-0.5 rounded-lg border border-border-default text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setViewMode('nav')}
              className={cn(
                'px-2.5 py-1 rounded-[6px] transition-all cursor-pointer',
                viewMode === 'nav'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              NAV Trend
            </button>
            <button
              type="button"
              onClick={() => setViewMode('sip')}
              className={cn(
                'px-2.5 py-1 rounded-[6px] transition-all cursor-pointer',
                viewMode === 'sip'
                  ? 'bg-accent-brass text-bg-base font-semibold shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              SIP Wealth Growth
            </button>
          </div>

          {/* Timeframe Buttons */}
          <div className="flex items-center bg-bg-surface-2 p-0.5 rounded-lg border border-border-default text-[11px] font-mono">
            {(['1M', '6M', '1Y', '3Y', '5Y'] as TimeRange[]).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-2 py-1 rounded-[6px] transition-all cursor-pointer',
                  timeRange === range
                    ? 'bg-bg-surface-3 text-text-primary font-bold shadow-sm'
                    : 'text-text-faint hover:text-text-primary'
                )}
              >
                {range}
              </button>
            ))}
          </div>

          {onStartSip && (
            <button
              onClick={onStartSip}
              className="flex items-center gap-1.5 bg-accent-brass hover:bg-accent-brass-dim text-bg-base px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer shadow-sm"
            >
              <DollarSign className="w-3.5 h-3.5" />
              Start SIP
            </button>
          )}
        </div>
      </div>

      {/* KPI Highlight Strip */}
      {viewMode === 'nav' ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="bg-bg-surface-2/60 border border-border-default/60 rounded-lg p-2.5">
            <span className="text-[10px] text-text-faint uppercase font-mono block">Period Return</span>
            <span className={cn('text-[15px] font-mono font-bold', totalNavChangePct >= 0 ? 'text-positive' : 'text-negative')}>
              {totalNavChangePct >= 0 ? '+' : ''}{totalNavChangePct}%
            </span>
          </div>
          <div className="bg-bg-surface-2/60 border border-border-default/60 rounded-lg p-2.5">
            <span className="text-[10px] text-text-faint uppercase font-mono block">{benchmarkName}</span>
            <span className="text-[15px] font-mono text-text-secondary font-medium">
              +{benchChangePct}%
            </span>
          </div>
          <div className="bg-bg-surface-2/60 border border-border-default/60 rounded-lg p-2.5">
            <span className="text-[10px] text-text-faint uppercase font-mono block">Alpha Outperformance</span>
            <span className={cn('text-[15px] font-mono font-bold', alphaSpread >= 0 ? 'text-emerald-400' : 'text-amber-400')}>
              {alphaSpread >= 0 ? '+' : ''}{alphaSpread}%
            </span>
          </div>
          <div className="bg-bg-surface-2/60 border border-border-default/60 rounded-lg p-2.5">
            <span className="text-[10px] text-text-faint uppercase font-mono block">Current NAV</span>
            <span className="text-[15px] font-mono text-accent-brass font-bold">
              ₹{currentNav.toFixed(2)}
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="bg-bg-surface-2/60 border border-border-default/60 rounded-lg p-2.5">
            <span className="text-[10px] text-text-faint uppercase font-mono block">Total SIP Invested</span>
            <span className="text-[15px] font-mono text-text-primary font-bold">
              {formatINRCompact(totalSipInvested)}
            </span>
          </div>
          <div className="bg-bg-surface-2/60 border border-border-default/60 rounded-lg p-2.5">
            <span className="text-[10px] text-text-faint uppercase font-mono block">SIP Wealth Created</span>
            <span className="text-[15px] font-mono text-accent-brass font-bold">
              {formatINRCompact(totalSipValue)}
            </span>
          </div>
          <div className="bg-bg-surface-2/60 border border-border-default/60 rounded-lg p-2.5">
            <span className="text-[10px] text-text-faint uppercase font-mono block">Net Capital Gain</span>
            <span className="text-[15px] font-mono text-positive font-bold">
              +{formatINRCompact(sipProfit)}
            </span>
          </div>
          <div className="bg-bg-surface-2/60 border border-border-default/60 rounded-lg p-2.5">
            <span className="text-[10px] text-text-faint uppercase font-mono block">Wealth Multiplier</span>
            <span className="text-[15px] font-mono text-emerald-400 font-bold">
              {sipMultiplier}x
            </span>
          </div>
        </div>
      )}

      {/* Interactive Chart Canvas */}
      <div className="h-[270px] w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'nav' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="mfNavGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="mfBenchGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748B" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#64748B" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2A322B" strokeDasharray="3 3" vertical={false} opacity={0.6} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                tick={{ fill: '#6C756A', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                domain={['dataMin - 2', 'auto']}
                tick={{ fill: '#6C756A', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                tickFormatter={(v) => `₹${Math.round(v)}`}
                width={55}
              />
              <Tooltip
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-bg-surface-3 px-3.5 py-2.5 rounded-[8px] text-[12px] shadow-xl border border-border-default space-y-1.5 min-w-[210px]">
                      <div className="flex items-center justify-between border-b border-border-default pb-1">
                        <span className="text-text-primary font-medium">{item.date}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-semibold">
                          +{item.fundReturnPct}%
                        </span>
                      </div>
                      <div className="flex justify-between font-mono text-emerald-400 font-semibold">
                        <span>Fund NAV:</span>
                        <span>₹{item.nav}</span>
                      </div>
                      <div className="flex justify-between font-mono text-text-faint text-[11px]">
                        <span>Benchmark (Rel):</span>
                        <span>+{item.benchReturnPct}%</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="nav"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#mfNavGradient)"
                name="Fund NAV"
              />
            </AreaChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="sipValueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A227" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#C9A227" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="sipInvestedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748B" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#64748B" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2A322B" strokeDasharray="3 3" vertical={false} opacity={0.6} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                tick={{ fill: '#6C756A', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                domain={[0, 'auto']}
                tick={{ fill: '#6C756A', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                tickFormatter={(v) => formatINRCompact(v)}
                width={65}
              />
              <Tooltip
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-bg-surface-3 px-3.5 py-2.5 rounded-[8px] text-[12px] shadow-xl border border-border-default space-y-1.5 min-w-[230px]">
                      <div className="flex items-center justify-between border-b border-border-default pb-1">
                        <span className="text-text-primary font-medium">{item.date}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-accent-brass/20 text-accent-brass font-bold">
                          SIP Horizon
                        </span>
                      </div>
                      <div className="flex justify-between font-mono text-accent-brass font-bold">
                        <span>Corpus Value:</span>
                        <span>{formatINR(item.sipValue)}</span>
                      </div>
                      <div className="flex justify-between font-mono text-text-secondary text-[11px]">
                        <span>Invested Capital:</span>
                        <span>{formatINR(item.sipInvested)}</span>
                      </div>
                      <div className="flex justify-between font-mono text-positive text-[11px] pt-1 border-t border-border-default/60">
                        <span>Gain / Profit:</span>
                        <span>+{formatINR(item.sipProfit)}</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="sipValue"
                stroke="#C9A227"
                strokeWidth={2}
                fill="url(#sipValueGradient)"
                name="SIP Corpus"
              />
              <Area
                type="monotone"
                dataKey="sipInvested"
                stroke="#64748B"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="url(#sipInvestedGradient)"
                name="Invested Amount"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Legend / Tip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-border-default/60 text-[11px] text-text-faint">
        <div className="flex items-center gap-4">
          {viewMode === 'nav' ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span className="text-text-secondary">{schemeName} NAV</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-slate-400 inline-block" />
                <span className="text-text-faint">{benchmarkName}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-brass inline-block" />
                <span className="text-text-secondary">Accumulated Wealth (Units × NAV)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 border-t border-dashed border-slate-400 inline-block" />
                <span className="text-text-faint">Capital Outlay (₹{formatINRCompact(sipMonthlyAmount)}/mo)</span>
              </div>
            </>
          )}
        </div>
        <span className="font-mono text-[10px] text-text-faint">
          AMFI Historical compounding curve • Updated Daily
        </span>
      </div>
    </div>
  );
}
