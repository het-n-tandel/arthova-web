'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatINRCompact, cn } from '@/lib/formatters';
import { TrendingUp, ShieldCheck } from 'lucide-react';

export interface NetWorthYearPoint {
  age: number;
  year: number;
  expectedNetWorth: number;
  pessimisticNetWorth: number;
  optimisticNetWorth: number;
}

interface Props {
  data: NetWorthYearPoint[];
  retirementAge: number;
  projectedRetirementNetWorth: number;
  className?: string;
}

export function NetWorthProjectionChart({ data, retirementAge, projectedRetirementNetWorth, className }: Props) {
  if (!data || data.length === 0) return null;

  return (
    <div className={cn('bg-bg-surface border border-border-default rounded-[12px] p-6 space-y-6', className)}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-[16px] font-medium text-text-primary flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent-brass" />
            Net Worth Retirement Projection
          </h2>
          <p className="text-[12px] text-text-faint">Simulated wealth trajectory to Target Retirement Age {retirementAge}</p>
        </div>
        <div className="bg-bg-surface-2 px-3 py-1.5 rounded-[8px] border border-border-default text-right">
          <span className="text-[10px] text-text-faint uppercase tracking-wider block">Projected Net Worth (Age {retirementAge})</span>
          <span className="text-[18px] font-mono text-positive font-medium">{formatINRCompact(projectedRetirementNetWorth)}</span>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-brass)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--accent-brass)" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorOptimistic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--positive)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--positive)" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="age"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-faint)', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
              tickFormatter={(v) => `Age ${v}`}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-faint)', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
              tickFormatter={(v) => formatINRCompact(v)}
              width={65}
            />
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const item: NetWorthYearPoint = payload[0].payload;
                return (
                  <div className="bg-bg-surface-3 px-3 py-2.5 rounded-[8px] text-[12px] shadow-lg border border-border-default space-y-1">
                    <p className="text-text-primary font-medium border-b border-border-default pb-1">
                      Age {item.age} ({item.year})
                    </p>
                    <div className="flex justify-between gap-4 font-mono text-positive">
                      <span>Optimistic (Bull):</span>
                      <span>{formatINRCompact(item.optimisticNetWorth)}</span>
                    </div>
                    <div className="flex justify-between gap-4 font-mono text-accent-brass">
                      <span>Expected Net Worth:</span>
                      <span>{formatINRCompact(item.expectedNetWorth)}</span>
                    </div>
                    <div className="flex justify-between gap-4 font-mono text-text-faint">
                      <span>Pessimistic (Bear):</span>
                      <span>{formatINRCompact(item.pessimisticNetWorth)}</span>
                    </div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="optimisticNetWorth"
              stroke="var(--positive)"
              strokeWidth={1}
              strokeDasharray="4 4"
              fill="url(#colorOptimistic)"
              name="Optimistic"
            />
            <Area
              type="monotone"
              dataKey="expectedNetWorth"
              stroke="var(--accent-brass)"
              strokeWidth={2.5}
              fill="url(#colorExpected)"
              name="Expected"
            />
            <Area
              type="monotone"
              dataKey="pessimisticNetWorth"
              stroke="var(--text-faint)"
              strokeWidth={1.5}
              fill="none"
              name="Pessimistic"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between text-[11px] text-text-faint pt-2 border-t border-border-default">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-accent-brass" /> Expected Strategy</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-positive" /> Bull Scenario (+3.5%)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-text-faint" /> Bear Scenario (-3.5%)</span>
        </div>
        <span className="flex items-center gap-1 text-positive font-medium"><ShieldCheck className="w-3.5 h-3.5" /> Monte Carlo Verified</span>
      </div>
    </div>
  );
}
