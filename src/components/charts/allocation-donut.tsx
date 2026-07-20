'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatINRCompact, cn } from '@/lib/formatters';

interface AllocationItem {
  name: string;
  value: number;
  current: number;
  color: string;
}

interface AllocationDonutProps {
  data: AllocationItem[];
  totalValue: string;
  totalLabel?: string;
  className?: string;
}

const ALLOCATION_COLORS = [
  '#C9A227',
  '#3FA88A',
  '#7C8AD4',
  '#D9705C',
  '#E0B34C',
];

export function AllocationDonut({ data, totalValue, totalLabel = 'Total Value', className }: AllocationDonutProps) {
  const chartData = data.map((item, i) => ({
    ...item,
    color: item.color || ALLOCATION_COLORS[i % ALLOCATION_COLORS.length],
  }));

  return (
    <div className={cn('flex flex-col sm:flex-row items-center gap-8', className)}>
      <div className="relative w-[200px] h-[200px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const item = payload[0].payload;
                return (
                  <div className="bg-bg-surface-3 px-3 py-2 rounded-[6px] text-[12px]" style={{ boxShadow: 'var(--shadow-md)' }}>
                    <p className="text-text-primary font-medium">{item.name}</p>
                    <p className="text-text-secondary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
                      {formatINRCompact(item.current)} ({item.value.toFixed(1)}%)
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] text-text-faint uppercase tracking-wider">{totalLabel}</span>
          <span className="text-[18px] font-medium text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
            {totalValue}
          </span>
        </div>
      </div>

      <div className="space-y-3 flex-1 min-w-0">
        {chartData.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-text-secondary truncate">{item.name}</span>
                <span className="text-[13px] text-text-primary ml-2" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
                  {item.value.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
