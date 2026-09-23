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
      <div className="flex items-center gap-1.5 mb-5 p-1 rounded-lg bg-bg-surface-2/60 border border-border w-fit">
        {timeRanges.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              'px-3 py-1 text-[11.5px] font-mono font-medium rounded-md transition-all duration-150',
              r === range
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-text-faint hover:text-text-primary hover:bg-bg-surface-2'
            )}
          >
            {r}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={filteredData} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.28} />
              <stop offset="60%" stopColor="#10B981" stopOpacity={0.06} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" vertical={false} />
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
            width={65}
          />
          <Tooltip
            content={({ payload, label }) => {
              if (!payload?.length) return null;
              return (
                <div className="glass-card-elevated px-3.5 py-2.5 rounded-lg text-[12px] border border-border shadow-xl">
                  <p className="text-text-faint font-mono text-[11px] mb-1">{label}</p>
                  {payload.map((p: any, i: number) => (
                    <p key={i} className="text-emerald-400 font-bold text-[14px]" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
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
            stroke="#10B981"
            strokeWidth={2.5}
            fill="url(#valueGradient)"
            dot={false}
            activeDot={{ r: 5, fill: '#34D399', stroke: '#080C14', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
