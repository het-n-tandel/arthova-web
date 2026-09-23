'use client';
import { useState } from 'react';
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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartData = data.map((item, i) => ({
    ...item,
    color: item.color || ALLOCATION_COLORS[i % ALLOCATION_COLORS.length],
  }));

  return (
    <div className={cn('flex flex-col sm:flex-row items-center gap-7', className)}>
      <div className="relative w-[210px] h-[210px] shrink-0">
        {/* Soft background glow */}
        <div className="absolute inset-4 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={64}
              outerRadius={92}
              paddingAngle={3}
              dataKey="value"
              stroke="rgba(14, 21, 36, 0.8)"
              strokeWidth={2}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                  style={{ transition: 'opacity 0.2s ease' }}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const item = payload[0].payload;
                return (
                  <div className="glass-card-elevated px-3 py-2 rounded-lg text-[12px] border border-border shadow-xl z-50">
                    <p className="text-text-primary font-semibold">{item.name}</p>
                    <p className="text-emerald-600 dark:text-emerald-400 font-mono mt-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatINRCompact(item.current)} ({item.value.toFixed(1)}%)
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div 
          className={cn(
            'absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-300',
            activeIndex !== null ? 'opacity-15 blur-[3px] scale-95' : 'opacity-100 blur-0 scale-100'
          )}
        >
          <span className="text-[10px] text-text-faint uppercase font-mono tracking-widest">{totalLabel}</span>
          <span className="text-[20px] font-bold text-text-primary tracking-tight mt-0.5" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
            {totalValue}
          </span>
        </div>
      </div>

      <div className="space-y-2 flex-1 min-w-0">
        {chartData.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 px-2.5 py-1 rounded-lg hover:bg-white/[0.04] transition-colors">
            <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.color }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-text-secondary truncate font-medium">{item.name}</span>
                <span className="text-white ml-2 font-mono font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>
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
