'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';
import { stockHoldings, generateCandlestickData, aiInsights } from '@/lib/mock-data';
import { useLedgerStore } from '@/lib/store';
import { formatINR, formatINRCompact, cn } from '@/lib/formatters';
import { DeltaBadge } from '@/components/ui/delta-badge';
import { PriceCell } from '@/components/ui/price-cell';
import { SummaryCard } from '@/components/ui/summary-card';
import { PriceCandlestick } from '@/components/charts/price-candlestick';
import { AIInsightCard } from '@/components/portfolio/ai-insight-card';

export default function StockDetailPage() {
  const params = useParams();
  const symbol = (params.symbol as string)?.toUpperCase() || 'RELIANCE';
  const stock = stockHoldings.find((s) => s.symbol === symbol) || stockHoldings[0];
  const livePrices = useLedgerStore((s) => s.livePrices);
  const favorites = useLedgerStore((s) => s.favorites);
  const toggleFavorite = useLedgerStore((s) => s.toggleFavorite);

  const live = livePrices.get(stock.symbol);
  const price = live?.price ?? stock.cmp;
  const prevPrice = live?.previousPrice;
  const dayChange = live?.change ?? stock.dayChange;
  const dayChangePercent = live?.changePercent ?? stock.dayChangePercent;
  const pnl = (price - stock.avgCost) * stock.quantity;
  const pnlPercent = ((price - stock.avgCost) / stock.avgCost) * 100;

  const candlestickData = useMemo(() => generateCandlestickData(90), []);
  const relatedInsights = aiInsights.filter((i) => i.relatedSymbol === stock.symbol);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/stocks" className="text-text-faint hover:text-text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[28px] text-text-primary">{stock.name}</h1>
            <button onClick={() => toggleFavorite(stock.symbol)} className="p-1">
              <Star className={cn('w-5 h-5', favorites.has(stock.symbol) ? 'fill-accent-brass text-accent-brass' : 'text-text-faint')} />
            </button>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[13px] text-text-faint" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{stock.symbol}</span>
            <span className="text-[12px] text-text-faint">· {stock.sector}</span>
          </div>
        </div>
        <div className="text-right">
          <PriceCell price={price} previousPrice={prevPrice} className="text-[28px] font-medium" />
          <div className="flex items-center justify-end gap-2 mt-1">
            <span className={cn('text-[13px]', dayChange >= 0 ? 'text-positive' : 'text-negative')} style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
              {dayChange >= 0 ? '+' : ''}{dayChange.toFixed(2)}
            </span>
            <DeltaBadge value={dayChangePercent} />
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-bg-surface border border-border-default rounded-[12px] p-6">
        <PriceCandlestick data={candlestickData} symbol={stock.symbol} />
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard label="P/E Ratio" value={stock.pe.toFixed(1)} />
        <SummaryCard label="Market Cap" value={formatINRCompact(stock.marketCap * 10000000)} />
        <SummaryCard label="52W High" value={formatINR(stock.weekHigh52)} />
        <SummaryCard label="52W Low" value={formatINR(stock.weekLow52)} />
      </div>

      {/* Holdings + AI section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-surface border border-border-default rounded-[12px] p-5">
          <h2 className="text-[16px] font-medium text-text-primary mb-4">Your Holdings</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-[13px] text-text-secondary">Quantity</span>
              <span className="text-[13px] text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{stock.quantity} shares</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[13px] text-text-secondary">Avg Cost</span>
              <span className="text-[13px] text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(stock.avgCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[13px] text-text-secondary">Invested</span>
              <span className="text-[13px] text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(stock.avgCost * stock.quantity)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[13px] text-text-secondary">Current Value</span>
              <span className="text-[13px] text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(price * stock.quantity)}</span>
            </div>
            <div className="border-t border-border-default pt-3 flex justify-between">
              <span className="text-[13px] font-medium text-text-primary">Total P&L</span>
              <div className="flex items-center gap-2">
                <span className={cn('text-[13px] font-medium', pnl >= 0 ? 'text-positive' : 'text-negative')} style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
                  {formatINR(pnl)}
                </span>
                <DeltaBadge value={pnlPercent} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-[16px] font-medium text-text-primary">AI Analysis</h2>
          {relatedInsights.length > 0 ? (
            relatedInsights.map((insight) => (
              <AIInsightCard key={insight.id} insight={insight} />
            ))
          ) : (
            <div className="bg-bg-surface border border-border-default rounded-[12px] p-5">
              <p className="text-[13px] text-text-faint">No specific AI insights for {stock.symbol} at this time.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
