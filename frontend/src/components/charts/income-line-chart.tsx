'use client';

import { useState } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { formatINRCompact, cn } from '@/lib/formatters';

interface DataPoint {
  date: string;
  value: number;
  projected?: number;
}

interface IncomeLineChartProps {
  data: DataPoint[];
  className?: string;
  height?: number;
}

const timeRanges = ['1M', '3M', '6M', '1Y', 'ALL'] as const;

export function IncomeLineChart({ data, className, height = 300 }: IncomeLineChartProps) {
  const [range, setRange] = useState<typeof timeRanges[number]>('6M');

  const filteredData = (() => {
    const now = new Date();
    const months = range === '1M' ? 1 : range === '3M' ? 3 : range === '6M' ? 6 : range === '1Y' ? 12 : 999;
    const cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() - months);
    return data.filter((d) => new Date(d.date) >= cutoff);
  })();

  return (
    <div className={cn('', className)}>
      <div className="flex items-center gap-1 mb-4">
        {timeRanges.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              'px-3 py-1 text-[12px] font-medium rounded-[6px] transition-colors duration-150',
              r === range
                ? 'bg-accent-brass text-bg-base'
                : 'text-text-faint hover:text-text-primary hover:bg-bg-surface-2'
            )}
          >
            {r}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={filteredData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-brass)" stopOpacity={0.08} />
              <stop offset="100%" stopColor="var(--accent-brass)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--text-faint)', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
            tickFormatter={(v) => {
              const d = new Date(v);
              return d.toLocaleDateString('en-IN', { month: 'short' });
            }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--text-faint)', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
            tickFormatter={(v) => formatINRCompact(v)}
            width={60}
          />
          <Tooltip
            content={({ payload, label }) => {
              if (!payload?.length) return null;
              return (
                <div className="bg-bg-surface-3 px-3 py-2 rounded-[6px] text-[12px]" style={{ boxShadow: 'var(--shadow-md)' }}>
                  <p className="text-text-faint mb-1">{label}</p>
                  {payload.map((p: any, i: number) => (
                    <p key={i} className="text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
                      {formatINRCompact(p.value as number)}
                    </p>
                  ))}
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--accent-brass)"
            strokeWidth={2}
            fill="url(#valueGradient)"
            dot={false}
            activeDot={{ r: 4, fill: 'var(--accent-brass)', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
