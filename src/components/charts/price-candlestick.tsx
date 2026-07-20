'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/formatters';

interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PriceCandlestickProps {
  data: CandlestickData[];
  symbol: string;
  className?: string;
}

const timeRanges = ['1M', '3M', '6M', '1Y'] as const;

export function PriceCandlestick({ data, symbol, className }: PriceCandlestickProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState<typeof timeRanges[number]>('3M');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !chartContainerRef.current) return;

    let chart: any;

    const initChart = async () => {
      try {
        const { createChart, CandlestickSeries } = await import('lightweight-charts');

        if (!chartContainerRef.current) return;
        chartContainerRef.current.innerHTML = '';

        chart = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth,
          height: 400,
          layout: {
            background: { color: 'transparent' },
            textColor: '#6C756A',
            fontFamily: 'IBM Plex Mono',
            fontSize: 11,
          },
          grid: {
            vertLines: { color: '#2A322B' },
            horzLines: { color: '#2A322B' },
          },
          crosshair: {
            vertLine: { color: '#C9A227', width: 1, style: 2 },
            horzLine: { color: '#C9A227', width: 1, style: 2 },
          },
          rightPriceScale: { borderColor: '#2A322B' },
          timeScale: { borderColor: '#2A322B' },
        });

        const series = chart.addSeries(CandlestickSeries, {
          upColor: '#3FA88A',
          downColor: '#D9705C',
          borderUpColor: '#3FA88A',
          borderDownColor: '#D9705C',
          wickUpColor: '#3FA88A',
          wickDownColor: '#D9705C',
        });

        const filteredData = filterByRange(data, range);
        series.setData(filteredData);
        chart.timeScale().fitContent();

        const observer = new ResizeObserver(() => {
          if (chartContainerRef.current && chart) {
            chart.applyOptions({ width: chartContainerRef.current.clientWidth });
          }
        });
        observer.observe(chartContainerRef.current);

        return () => {
          observer.disconnect();
        };
      } catch (e) {
        console.error('Failed to load chart:', e);
      }
    };

    initChart();

    return () => {
      if (chart) {
        chart.remove();
      }
    };
  }, [mounted, data, range]);

  return (
    <div className={cn('', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-medium text-text-secondary">{symbol} Price Chart</h3>
        <div className="flex items-center gap-1">
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
      </div>
      <div ref={chartContainerRef} className="w-full rounded-[12px] overflow-hidden" />
    </div>
  );
}

function filterByRange(data: CandlestickData[], range: string): CandlestickData[] {
  const now = new Date();
  const months = range === '1M' ? 1 : range === '3M' ? 3 : range === '6M' ? 6 : 12;
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - months);
  return data.filter((d) => new Date(d.time) >= cutoff);
}
