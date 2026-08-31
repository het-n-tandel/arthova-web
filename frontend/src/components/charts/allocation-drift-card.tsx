'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatINRCompact, cn } from '@/lib/formatters';
import { AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

interface AllocationData {
  equityPercent: number;
  debtPercent: number;
  goldPercent: number;
  cashPercent: number;
}

interface Props {
  current: AllocationData;
  recommended: RecommendedAllocationData;
  netWorth: number;
  className?: string;
}

interface RecommendedAllocationData {
  equityPercent: number;
  debtPercent: number;
  goldPercent: number;
  cashPercent: number;
}

const COLORS = ['#C9A227', '#3FA88A', '#7C8AD4', '#D9705C'];

export function AllocationDriftCard({ current, recommended, netWorth, className }: Props) {
  const currentItems = [
    { name: 'Equity (Stocks/MF)', value: current.equityPercent, rec: recommended.equityPercent, color: COLORS[0] },
    { name: 'Fixed Income (FD/Bonds)', value: current.debtPercent, rec: recommended.debtPercent, color: COLORS[1] },
    { name: 'Gold & Silver', value: current.goldPercent, rec: recommended.goldPercent, color: COLORS[2] },
    { name: 'Cash / Liquidity', value: current.cashPercent, rec: recommended.cashPercent, color: COLORS[3] },
  ];

  const hasHighDrift = currentItems.some((item) => Math.abs(item.value - item.rec) >= 5);

  return (
    <div className={cn('bg-bg-surface border border-border-default rounded-[12px] p-6 space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-medium text-text-primary flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent-brass" />
            AI Target vs Current Allocation
          </h2>
          <p className="text-[12px] text-text-faint">Smart multi-asset drift analysis</p>
        </div>
        <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium', hasHighDrift ? 'bg-warning-bg text-warning' : 'bg-positive-bg text-positive')}>
          {hasHighDrift ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
          <span>{hasHighDrift ? 'Rebalance Advised' : 'Optimal Allocation'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Current Donut */}
        <div className="relative w-[180px] h-[180px] mx-auto">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={currentItems}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {currentItems.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-bg-surface-3 px-3 py-2 rounded-[6px] text-[12px] shadow-md border border-border-default">
                      <p className="text-text-primary font-medium">{item.name}</p>
                      <p className="text-text-faint font-mono">
                        Current: {item.value.toFixed(1)}% | AI Target: {item.rec.toFixed(1)}%
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[9px] text-text-faint uppercase tracking-wider">Portfolio</span>
            <span className="text-[15px] font-medium text-text-primary font-mono">{formatINRCompact(netWorth)}</span>
          </div>
        </div>

        {/* Drift Progress Bars */}
        <div className="space-y-3.5">
          {currentItems.map((item) => {
            const diff = item.value - item.rec;
            return (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-[12px]">
                  <span className="text-text-secondary truncate">{item.name}</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-text-primary">{item.value.toFixed(0)}%</span>
                    <span className="text-text-faint">/ Target {item.rec.toFixed(0)}%</span>
                    {Math.abs(diff) >= 3 && (
                      <span className={cn('text-[10px] px-1.5 py-0.2 rounded', diff > 0 ? 'bg-warning-bg text-warning' : 'bg-info-indigo-bg text-info-indigo')}>
                        {diff > 0 ? `+${diff.toFixed(0)}%` : `${diff.toFixed(0)}%`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-2 bg-bg-surface-2 rounded-full overflow-hidden relative">
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, item.value)}%`, backgroundColor: item.color }} />
                  <div className="absolute top-0 bottom-0 w-0.5 bg-text-primary" style={{ left: `${Math.min(100, item.rec)}%` }} title="AI Target Weight" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
