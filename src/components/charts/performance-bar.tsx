'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatPercentRaw, cn } from '@/lib/formatters';

interface PerformanceItem {
  name: string;
  value: number;
}

interface PerformanceBarProps {
  data: PerformanceItem[];
  className?: string;
  height?: number;
}

export function PerformanceBar({ data, className, height = 250 }: PerformanceBarProps) {
  const sorted = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className={cn('', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--text-faint)', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            width={120}
          />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const item = payload[0].payload;
              return (
                <div className="bg-bg-surface-3 px-3 py-2 rounded-[6px] text-[12px]" style={{ boxShadow: 'var(--shadow-md)' }}>
                  <p className="text-text-primary font-medium">{item.name}</p>
                  <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums', color: item.value >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                    {formatPercentRaw(item.value)}
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
            {sorted.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.value >= 0 ? 'var(--positive)' : 'var(--negative)'}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
