'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Layers,
  Search,
  Target,
  Cpu,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Sparkles,
  BarChart2,
} from 'lucide-react';
import { cn, formatINR } from '@/lib/formatters';
import { INDIAN_EQUITY_PRICE_REGISTRY } from '@/lib/stock-prices';
import { generateCandlestickData } from '@/lib/mock-data';
import {
  calculateConfluenceMatrix,
  type ConfluenceMatrixResult,
} from '@/lib/strategies/pattern-confluence-engine';

interface ScannedStockItem {
  symbol: string;
  cmp: number;
  dayChange: number;
  dayChangePercent: number;
  marketCapCr: number;
  pe: number;
  confluence: ConfluenceMatrixResult;
}

export function MarketPatternScanner() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<
    'all' | 'high_conviction' | 'vcp_triggered' | 'double_bottom' | 'traps'
  >('all');

  // Scan universe across registered Indian equities
  const scannedStocks: ScannedStockItem[] = useMemo(() => {
    const keys = Object.keys(INDIAN_EQUITY_PRICE_REGISTRY);

    return keys.map((ticker) => {
      const quote = INDIAN_EQUITY_PRICE_REGISTRY[ticker];
      const bars = generateCandlestickData(90, quote.cmp);
      const confluence = calculateConfluenceMatrix(`${ticker}.NS`, bars);

      return {
        symbol: ticker,
        cmp: quote.cmp,
        dayChange: quote.dayChange,
        dayChangePercent: quote.dayChangePercent,
        marketCapCr: quote.marketCapCr,
        pe: quote.pe,
        confluence,
      };
    });
  }, []);

  // Summary statistics across scanned stocks
  const stats = useMemo(() => {
    const total = scannedStocks.length;
    const highConviction = scannedStocks.filter(
      (s) => s.confluence.confluenceScore >= 75
    ).length;
    const vcpActive = scannedStocks.filter(
      (s) =>
        s.confluence.layer2.status === 'Triggered' ||
        s.confluence.layer2.status === 'Compression Active'
    ).length;
    const doubleBottoms = scannedStocks.filter((s) =>
      s.confluence.layer1.patterns.some((p) => p.id.includes('double_bottom'))
    ).length;
    const traps = scannedStocks.filter(
      (s) => s.confluence.layer3.filter.falseBreakoutRisk === 'High'
    ).length;

    return { total, highConviction, vcpActive, doubleBottoms, traps };
  }, [scannedStocks]);

  // Filtered and searched list
  const filteredList = useMemo(() => {
    return scannedStocks.filter((stock) => {
      const matchesSearch =
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterType === 'high_conviction') {
        return stock.confluence.confluenceScore >= 75;
      }
      if (filterType === 'vcp_triggered') {
        return stock.confluence.layer2.status === 'Triggered';
      }
      if (filterType === 'double_bottom') {
        return stock.confluence.layer1.patterns.some((p) =>
          p.id.includes('double_bottom')
        );
      }
      if (filterType === 'traps') {
        return stock.confluence.layer3.filter.falseBreakoutRisk === 'High';
      }

      return true;
    }).sort((a, b) => b.confluence.confluenceScore - a.confluence.confluenceScore);
  }, [scannedStocks, searchQuery, filterType]);

  return (
    <div className="space-y-6">
      {/* ── Top Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-bg-surface p-4 rounded-[12px] border border-border-default">
          <span className="text-[11px] font-mono uppercase text-text-faint block">
            Universe Scanned
          </span>
          <span className="text-[22px] font-mono font-bold text-text-primary">
            {stats.total}
          </span>
          <span className="text-[11px] text-text-faint block mt-0.5">NSE Bluechips</span>
        </div>

        <div className="bg-bg-surface p-4 rounded-[12px] border border-emerald-500/25 bg-emerald-500/5">
          <span className="text-[11px] font-mono uppercase text-emerald-400 block">
            High Conviction (≥75%)
          </span>
          <span className="text-[22px] font-mono font-bold text-emerald-400">
            {stats.highConviction}
          </span>
          <span className="text-[11px] text-emerald-400/80 block mt-0.5">3-Layer Aligned</span>
        </div>

        <div className="bg-bg-surface p-4 rounded-[12px] border border-violet-500/25 bg-violet-500/5">
          <span className="text-[11px] font-mono uppercase text-violet-400 block">
            VCP Squeeze Active
          </span>
          <span className="text-[22px] font-mono font-bold text-violet-400">
            {stats.vcpActive}
          </span>
          <span className="text-[11px] text-violet-400/80 block mt-0.5">Vol. Compression</span>
        </div>

        <div className="bg-bg-surface p-4 rounded-[12px] border border-blue-500/25 bg-blue-500/5">
          <span className="text-[11px] font-mono uppercase text-blue-400 block">
            Double Bottoms (W)
          </span>
          <span className="text-[22px] font-mono font-bold text-blue-400">
            {stats.doubleBottoms}
          </span>
          <span className="text-[11px] text-blue-400/80 block mt-0.5">Structural Support</span>
        </div>

        <div className="bg-bg-surface p-4 rounded-[12px] border border-rose-500/25 bg-rose-500/5">
          <span className="text-[11px] font-mono uppercase text-rose-400 block">
            Breakout Traps
          </span>
          <span className="text-[22px] font-mono font-bold text-rose-400">
            {stats.traps}
          </span>
          <span className="text-[11px] text-rose-400/80 block mt-0.5">Low Volume Shield</span>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-bg-surface p-3 rounded-[12px] border border-border-default">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-faint absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ticker (e.g. RELIANCE, TCS, TATAMOTORS)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-bg-surface-2 border border-border-default rounded-[8px] text-[13px] text-text-primary placeholder:text-text-faint focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Stocks' },
            { id: 'high_conviction', label: 'High Conviction (≥75%)' },
            { id: 'vcp_triggered', label: 'VCP Breakouts' },
            { id: 'double_bottom', label: 'Double Bottoms' },
            { id: 'traps', label: 'Breakout Traps' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={cn(
                'px-3 py-1.5 rounded-[7px] text-[12px] font-medium whitespace-nowrap transition-all cursor-pointer',
                filterType === tab.id
                  ? 'bg-cyan-600 text-white shadow-xs font-semibold'
                  : 'bg-bg-surface-2 text-text-faint hover:text-text-primary'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scanned Stocks Table / Grid ── */}
      <div className="bg-bg-surface border border-border-default rounded-[12px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-default bg-bg-surface-2/60 text-[11px] font-mono text-text-faint uppercase">
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Price / Day Change</th>
                <th className="py-3 px-4">Layer 1: Structure</th>
                <th className="py-3 px-4">Layer 2: Custom VCP</th>
                <th className="py-3 px-4">Layer 3: Volume Shield</th>
                <th className="py-3 px-4 text-center">Confluence Score</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default text-[13px]">
              {filteredList.map((item) => {
                const conf = item.confluence;
                const bestL1 = conf.layer1.patterns[0];
                const isHighConviction = conf.confluenceScore >= 75;

                return (
                  <tr
                    key={item.symbol}
                    className="hover:bg-bg-surface-2/50 transition-colors"
                  >
                    {/* Stock Symbol */}
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/dashboard/stocks/${item.symbol}`}
                        className="font-bold text-text-primary hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                      >
                        <span>{item.symbol}</span>
                        <span className="text-[10px] font-mono text-text-faint">.NS</span>
                      </Link>
                    </td>

                    {/* Price & Change */}
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-semibold text-text-primary block">
                        {formatINR(item.cmp)}
                      </span>
                      <span
                        className={cn(
                          'text-[11.5px]',
                          item.dayChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        )}
                      >
                        {item.dayChange >= 0 ? '+' : ''}
                        {item.dayChange.toFixed(2)} ({item.dayChangePercent >= 0 ? '+' : ''}
                        {item.dayChangePercent}%)
                      </span>
                    </td>

                    {/* Layer 1 */}
                    <td className="py-3.5 px-4">
                      {bestL1 ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                            <Target className="w-3 h-3" />
                            {bestL1.name}
                          </span>
                          <span className="text-[10.5px] font-mono text-text-faint block">
                            Target: {formatINR(bestL1.targetPrice)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-text-faint">
                          Scanning support...
                        </span>
                      )}
                    </td>

                    {/* Layer 2 */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border',
                            conf.layer2.status === 'Triggered'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold'
                              : conf.layer2.status === 'Compression Active'
                              ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                              : 'bg-bg-surface-3 text-text-faint border-border-default'
                          )}
                        >
                          <Cpu className="w-3 h-3" />
                          {conf.layer2.status}
                        </span>
                        <span className="text-[10.5px] font-mono text-text-faint block">
                          Win Prob: {conf.layer2.customPattern.winProbability}%
                        </span>
                      </div>
                    </td>

                    {/* Layer 3 */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border',
                            conf.layer3.filter.volumeConfirmed
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : conf.layer3.filter.falseBreakoutRisk === 'High'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          )}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          {conf.layer3.filter.volumeRatio20}x Vol · {conf.layer3.filter.falseBreakoutRisk} Risk
                        </span>
                        <span className="text-[10.5px] font-mono text-text-faint block">
                          Trend: {conf.layer3.filter.trendAlignment}
                        </span>
                      </div>
                    </td>

                    {/* Confluence Score */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={cn(
                            'font-mono font-bold text-[14px] px-2.5 py-0.5 rounded-full border',
                            isHighConviction
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              : conf.confluenceScore >= 55
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                              : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                          )}
                        >
                          {conf.confluenceScore}%
                        </span>
                        <span className="text-[10px] font-mono text-text-faint mt-0.5">
                          {conf.verdict}
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/dashboard/stocks/${item.symbol}`}
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-[6px] border border-cyan-500/20 cursor-pointer"
                      >
                        <span>View Chart &amp; Plan</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredList.length === 0 && (
          <div className="py-12 text-center space-y-2">
            <Layers className="w-8 h-8 text-text-faint mx-auto opacity-50" />
            <p className="text-[13px] text-text-secondary">
              No stocks matched the filter &quot;{filterType}&quot;
            </p>
            <button
              onClick={() => {
                setFilterType('all');
                setSearchQuery('');
              }}
              className="text-[12px] text-cyan-400 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
