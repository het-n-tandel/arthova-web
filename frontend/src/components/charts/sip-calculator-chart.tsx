'use client';

import { useMemo, useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatINR, formatINRCompact, cn } from '@/lib/formatters';
import { TrendingUp, Sparkles } from 'lucide-react';

interface SipCalculatorChartProps {
  monthlyInvestment: number;
  years: number;
  annualRate: number;
  className?: string;
}

export function SipCalculatorChart({
  monthlyInvestment,
  years,
  annualRate,
  className,
}: SipCalculatorChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = useMemo(() => {
    const data = [];
    const monthlyRate = annualRate / 100 / 12;

    for (let yr = 1; yr <= years; yr++) {
      const months = yr * 12;
      const futureValue =
        monthlyInvestment *
        ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) *
        (1 + monthlyRate);
      const invested = monthlyInvestment * months;
      const profit = Math.max(0, futureValue - invested);

      data.push({
        yearLabel: `Yr ${yr}`,
        year: yr,
        invested: Math.round(invested),
        futureValue: Math.round(futureValue),
        profit: Math.round(profit),
        multiplier: (futureValue / (invested || 1)).toFixed(2),
      });
    }

    return data;
  }, [monthlyInvestment, years, annualRate]);

  const finalPoint = chartData[chartData.length - 1] || { invested: 0, futureValue: 0, profit: 0, multiplier: '1.0' };
  const wealthMultiplier = finalPoint.multiplier;

  if (!mounted) {
    return (
      <div className={cn('h-[250px] w-full bg-bg-surface-2 rounded-xl animate-pulse', className)} />
    );
  }

  return (
    <div className={cn('bg-bg-surface-2/60 border border-border-default/60 rounded-[12px] p-4 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent-brass" />
          <span className="text-[13px] font-medium text-text-primary">
            SIP Compounding Trajectory ({years} Years)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">
            {wealthMultiplier}x Wealth Multiplier
          </span>
        </div>
      </div>

      <div className="h-[210px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="calcFutureGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C9A227" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#C9A227" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="calcInvestedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#64748B" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#64748B" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#2A322B" strokeDasharray="3 3" vertical={false} opacity={0.6} />
            <XAxis
              dataKey="yearLabel"
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
              width={62}
            />
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const item = payload[0].payload;
                return (
                  <div className="bg-bg-surface-3 px-3.5 py-2.5 rounded-[8px] text-[12px] shadow-xl border border-border-default space-y-1.5 min-w-[210px]">
                    <div className="flex items-center justify-between border-b border-border-default pb-1">
                      <span className="text-text-primary font-medium">End of Year {item.year}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-accent-brass/20 text-accent-brass font-bold">
                        {item.multiplier}x
                      </span>
                    </div>
                    <div className="flex justify-between font-mono text-accent-brass font-bold">
                      <span>Corpus:</span>
                      <span>{formatINR(item.futureValue)}</span>
                    </div>
                    <div className="flex justify-between font-mono text-text-secondary text-[11px]">
                      <span>Invested:</span>
                      <span>{formatINR(item.invested)}</span>
                    </div>
                    <div className="flex justify-between font-mono text-positive text-[11px] pt-1 border-t border-border-default/60">
                      <span>Returns Earned:</span>
                      <span>+{formatINR(item.profit)}</span>
                    </div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="futureValue"
              stroke="#C9A227"
              strokeWidth={2}
              fill="url(#calcFutureGradient)"
              name="Future Corpus"
            />
            <Area
              type="monotone"
              dataKey="invested"
              stroke="#64748B"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="url(#calcInvestedGradient)"
              name="Total Invested"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-text-faint pt-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-brass inline-block" />
            <span className="text-text-secondary">Expected Wealth</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 border-t border-dashed border-slate-400 inline-block" />
            <span className="text-text-faint">Invested Principal</span>
          </div>
        </div>
        <span className="font-mono text-[10px]">
          Rule of 72: Doubling every {(72 / annualRate).toFixed(1)} yrs
        </span>
      </div>
    </div>
  );
}
