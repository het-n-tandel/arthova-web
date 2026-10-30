'use client';

import { useEffect, useRef, useState } from 'react';
import { Layers, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/formatters';

interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PriceCandlestickProps {
  data: CandlestickData[];
  symbol: string;
  className?: string;
  confluencePlan?: {
    entryPrice: number;
    stopLoss: number;
    target1: number;
    target2: number;
  };
  patterns?: {
    id: string;
    name: string;
    date: string;
    priceLevel: number;
    type: string;
  }[];
}

const timeRanges = ['1M', '3M', '6M', '1Y', '2005 - Present'] as const;

export function PriceCandlestick({
  data,
  symbol,
  className,
  confluencePlan,
  patterns,
}: PriceCandlestickProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState<typeof timeRanges[number]>('3M');
  const [showOverlays, setShowOverlays] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !chartContainerRef.current) return;

    let chart: any;

    const initChart = async () => {
      try {
        const { createChart, CandlestickSeries, createSeriesMarkers } = await import('lightweight-charts');

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

        // ── Visual Overlays: Price Lines & Pattern Markers ──
        if (showOverlays) {
          // 1. Confluence Trade Setup Lines
          if (confluencePlan) {
            series.createPriceLine({
              price: confluencePlan.target2,
              color: '#22d3ee', // Cyan
              lineWidth: 1,
              lineStyle: 2, // Dashed
              axisLabelVisible: true,
              title: 'T2 Target (3.2R)',
            });

            series.createPriceLine({
              price: confluencePlan.target1,
              color: '#3FA88A', // Emerald
              lineWidth: 1,
              lineStyle: 2, // Dashed
              axisLabelVisible: true,
              title: 'T1 Target (1.8R)',
            });

            series.createPriceLine({
              price: confluencePlan.entryPrice,
              color: '#C9A227', // Brass
              lineWidth: 1,
              lineStyle: 1, // Dotted
              axisLabelVisible: true,
              title: 'Entry Trigger',
            });

            series.createPriceLine({
              price: confluencePlan.stopLoss,
              color: '#D9705C', // Rose
              lineWidth: 1,
              lineStyle: 2, // Dashed
              axisLabelVisible: true,
              title: 'Stop Loss',
            });
          }

          // 2. Pattern Markers on Candlesticks (Lightweight Charts v5 API)
          if (patterns && patterns.length > 0) {
            try {
              const filteredDates = new Set(filteredData.map((d) => d.time));
              const markers = patterns
                .filter((p) => filteredDates.has(p.date))
                .map((p) => ({
                  time: p.date,
                  position: (p.type.includes('bearish') ? 'aboveBar' : 'belowBar') as any,
                  color: p.type.includes('bearish') ? '#D9705C' : '#3FA88A',
                  shape: (p.type.includes('bearish') ? 'arrowDown' : 'arrowUp') as any,
                  text: p.name.replace('Bullish ', '').replace(' (W)', ''),
                }));

              if (markers.length > 0) {
                if (typeof createSeriesMarkers === 'function') {
                  createSeriesMarkers(series, markers);
                } else if (typeof (series as any).setMarkers === 'function') {
                  (series as any).setMarkers(markers);
                }
              }
            } catch (markerErr) {
              console.warn('Marker rendering skipped:', markerErr);
            }
          }
        }

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
  }, [mounted, data, range, showOverlays, confluencePlan, patterns]);

  return (
    <div className={cn('', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2.5">
          <h3 className="text-[14px] font-medium text-text-secondary">{symbol} Price Chart</h3>
          {confluencePlan && (
            <button
              onClick={() => setShowOverlays(!showOverlays)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono border transition-all cursor-pointer',
                showOverlays
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  : 'bg-bg-surface-2 text-text-faint border-border-default hover:text-text-primary'
              )}
            >
              <Layers className="w-3 h-3" />
              <span>{showOverlays ? 'Algo Overlays ON' : 'Overlays OFF'}</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          {timeRanges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'px-3 py-1 text-[12px] font-medium rounded-[6px] transition-colors duration-150 cursor-pointer',
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
  if (range === '2005 - Present') {
    const cutoff = new Date('2005-01-01');
    return data.filter((d) => new Date(d.time) >= cutoff);
  }
  const now = new Date();
  const months = range === '1M' ? 1 : range === '3M' ? 3 : range === '6M' ? 6 : 12;
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - months);
  return data.filter((d) => new Date(d.time) >= cutoff);
}
