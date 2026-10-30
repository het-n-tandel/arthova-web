'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';
import { generateCandlestickData, aiInsights, stockHoldings as staticStockHoldings } from '@/lib/mock-data';
import { INDIAN_EQUITY_FACTOR_REGISTRY } from '@/lib/factor-scoring';
import { getEquityMarketQuote } from '@/lib/stock-prices';
import { useLedgerStore } from '@/lib/store';
import { usePortfolio } from '@/lib/hooks/use-portfolio';
import { formatINR, formatINRCompact, cn } from '@/lib/formatters';
import { DeltaBadge } from '@/components/ui/delta-badge';
import { PriceCell } from '@/components/ui/price-cell';
import { SummaryCard } from '@/components/ui/summary-card';
import { PriceCandlestick } from '@/components/charts/price-candlestick';
import { PricePredictionCard } from '@/components/charts/price-prediction-card';
import { PatternConfluenceCard } from '@/components/charts/pattern-confluence-card';
import { calculateConfluenceMatrix } from '@/lib/strategies/pattern-confluence-engine';
import { StockSignalAdvisor } from '@/components/charts/stock-signal-advisor';
import { AIInsightCard } from '@/components/portfolio/ai-insight-card';
import { evaluateQuantitativeSignal } from '@/lib/strategies/technical-signals';
import { AlgoSignalBadge } from '@/components/portfolio/algo-signal-badge';
import { SentimentCatalystCard } from '@/components/portfolio/sentiment-catalyst-card';
import { TradeModal } from '@/components/portfolio/trade-modal';
import { DisclosureCard } from '@/components/ui/disclosure-card';
import { Cpu, ShieldCheck, SlidersHorizontal, ArrowRight, ExternalLink, Scale } from 'lucide-react';

export default function StockDetailPage() {
  const params = useParams();
  const rawSymbol = (params.symbol as string)?.toUpperCase() || 'RELIANCE';
  const cleanSym = rawSymbol.replace('.NS', '').replace('.BO', '');
  const symbol = `${cleanSym}.NS`;

  const { stockHoldings } = usePortfolio();

  const userStock = stockHoldings.find((s: any) => {
    const sSym = (s.symbol || '').toUpperCase().replace('.NS', '').replace('.BO', '');
    return sSym === cleanSym;
  });

  const staticStock = staticStockHoldings.find((s) => {
    const sSym = s.symbol.toUpperCase().replace('.NS', '').replace('.BO', '');
    return sSym === cleanSym;
  });

  const registryStock = INDIAN_EQUITY_FACTOR_REGISTRY[symbol] || INDIAN_EQUITY_FACTOR_REGISTRY[`${cleanSym}.NS`];
  const marketQuote = useMemo(() => getEquityMarketQuote(cleanSym), [cleanSym]);

  // Client-side real-time live market quote fetch
  const [liveQuote, setLiveQuote] = useState<{
    price: number;
    change: number;
    changePercent: number;
    weekHigh52?: number;
    weekLow52?: number;
    marketCapCr?: number;
    pe?: number;
    name?: string;
    isRealTime?: boolean;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchLiveQuote() {
      try {
        const res = await fetch(`/api/market/quote?symbol=${encodeURIComponent(cleanSym)}`);
        if (res.ok) {
          const json = await res.json();
          if (json && json.price && isMounted) {
            setLiveQuote(json);
            useLedgerStore.getState().updatePrice({
              symbol,
              price: json.price,
              previousPrice: json.price - (json.change ?? 0),
              change: json.change ?? 0,
              changePercent: json.changePercent ?? 0,
              timestamp: Date.now(),
            });
          }
        }
      } catch (err) {
        console.warn('Failed to fetch live quote:', err);
      }
    }
    fetchLiveQuote();
    const interval = setInterval(fetchLiveQuote, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [cleanSym, symbol]);

  // Real historical candlestick fetch from Yahoo Finance
  const [realCandles, setRealCandles] = useState<any[]>([]);
  const [isCandlesLoading, setIsCandlesLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchRealCandles() {
      try {
        setIsCandlesLoading(true);
        const res = await fetch(`/api/market/candles?symbol=${encodeURIComponent(cleanSym)}&range=2005 - Present`);
        if (res.ok) {
          const json = await res.json();
          if (json.candles && json.candles.length > 10 && isMounted) {
            setRealCandles(json.candles);
            setIsCandlesLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Real candle fetch failed:', e);
      }
      if (isMounted) {
        setIsCandlesLoading(false);
      }
    }
    fetchRealCandles();
    return () => { isMounted = false; };
  }, [cleanSym]);

  const stock = {
    symbol: marketQuote.symbol,
    name: liveQuote?.name || userStock?.name || staticStock?.name || registryStock?.name || cleanSym,
    quantity: userStock?.quantity || 0,
    avgCost: userStock?.avgCost || 0,
    cmp: liveQuote?.price || marketQuote.cmp,
    dayChange: liveQuote?.change ?? marketQuote.dayChange,
    dayChangePercent: liveQuote?.changePercent ?? marketQuote.dayChangePercent,
    sector: registryStock?.sector || 'Equities',
    pe: liveQuote?.pe || marketQuote.pe,
    marketCap: liveQuote?.marketCapCr || marketQuote.marketCapCr,
    weekHigh52: liveQuote?.weekHigh52 || marketQuote.weekHigh52,
    weekLow52: liveQuote?.weekLow52 || marketQuote.weekLow52,
  };

  const livePrices = useLedgerStore((s) => s.livePrices);
  const favorites = useLedgerStore((s) => s.favorites);
  const toggleFavorite = useLedgerStore((s) => s.toggleFavorite);

  const live = livePrices.get(stock.symbol);
  const price = live?.price ?? liveQuote?.price ?? stock.cmp ?? marketQuote.cmp;
  const prevPrice = live?.previousPrice;
  const dayChange = live?.change ?? liveQuote?.change ?? stock.dayChange ?? marketQuote.dayChange;
  const dayChangePercent = live?.changePercent ?? liveQuote?.changePercent ?? stock.dayChangePercent ?? marketQuote.dayChangePercent;
  const pnl = stock.quantity > 0 ? (price - stock.avgCost) * stock.quantity : 0;
  const pnlPercent = stock.quantity > 0 && stock.avgCost > 0 ? ((price - stock.avgCost) / stock.avgCost) * 100 : 0;

  // Use real historical candles if available, else smooth baseline
  const candlestickData = useMemo(() => {
    if (realCandles.length > 0) return realCandles;
    return generateCandlestickData(5500, price);
  }, [realCandles, price]);
  const relatedInsights = aiInsights.filter((i) => i.relatedSymbol === stock.symbol);

  // Phase 1: Pure Quantitative Signal Evaluation (Dey et al., 2025)
  const algoSignal = useMemo(() => {
    const historicalCloses = candlestickData.slice(-90).map(c => c.close);
    return evaluateQuantitativeSignal(stock.symbol, price, historicalCloses);
  }, [stock.symbol, price, candlestickData]);

  // Phase 2: 3-Layer Algorithmic Pattern Confluence Matrix
  const confluenceResult = useMemo(
    () => calculateConfluenceMatrix(stock.symbol, candlestickData),
    [stock.symbol, candlestickData]
  );

  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell'>('buy');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Institutional Breadcrumb */}
      <div className="flex items-center justify-between text-[12px] text-text-faint">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="hover:text-text-primary transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/dashboard/stocks" className="hover:text-text-primary transition-colors">
            Stocks
          </Link>
          <span>/</span>
          <span className="text-text-primary font-mono font-medium">{stock.symbol}</span>
        </div>

        <Link
          href={`/dashboard/compare?symbols=${stock.symbol.replace('.NS', '')}`}
          className="flex items-center gap-1.5 text-text-faint hover:text-text-primary transition-colors font-medium"
        >
          <Scale className="w-3.5 h-3.5 text-accent-brass" />
          <span>Compare vs Peers</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/dashboard/stocks" className="text-text-faint hover:text-text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[28px] text-text-primary">{stock.name}</h1>
            <button onClick={() => toggleFavorite(stock.symbol)} className="p-1">
              <Star className={cn('w-5 h-5', favorites.has(stock.symbol) ? 'fill-accent-brass text-accent-brass' : 'text-text-faint')} />
            </button>
            <AlgoSignalBadge signal={algoSignal} showDetails />
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-[13px] text-text-faint" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{stock.symbol}</span>
            <span className="text-[12px] text-text-faint">· {stock.sector}</span>
            {liveQuote?.isRealTime && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Market API
              </span>
            )}
            {isCandlesLoading && (
              <span className="text-[10.5px] font-mono text-cyan-400 animate-pulse">
                Syncing real candles...
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-4">
          <div className="text-right">
            <PriceCell price={price} previousPrice={prevPrice} className="text-[28px] font-medium" />
            <div className="flex items-center justify-end gap-2 mt-1">
              <span className={cn('text-[13px]', dayChange >= 0 ? 'text-positive' : 'text-negative')} style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
                {dayChange >= 0 ? '+' : ''}{dayChange.toFixed(2)}
              </span>
              <DeltaBadge value={dayChangePercent} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              onClick={() => {
                setTradeAction('buy');
                setIsTradeOpen(true);
              }}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-positive hover:bg-positive/90 text-white shadow-sm transition-all cursor-pointer"
            >
              Buy
            </button>
            <button
              onClick={() => {
                setTradeAction('sell');
                setIsTradeOpen(true);
              }}
              disabled={stock.quantity <= 0}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer',
                stock.quantity > 0
                  ? 'bg-negative hover:bg-negative/90 text-white'
                  : 'bg-bg-surface-2 text-text-faint opacity-50 cursor-not-allowed'
              )}
            >
              Sell
            </button>
          </div>
        </div>
      </div>

      {/* Chart with Visual Pattern & Confluence Overlays */}
      <div className="bg-bg-surface border border-border-default rounded-[12px] p-6">
        <PriceCandlestick
          data={candlestickData}
          symbol={stock.symbol}
          confluencePlan={confluenceResult.tradePlan}
          patterns={confluenceResult.layer1.patterns}
        />
      </div>

      {/* Trader-Grade Signal Frequency Advisor — Historical Probability Engine */}
      <StockSignalAdvisor
        symbol={stock.symbol}
        currentPrice={price}
      />

      {/* ML Price Prediction — dynamic training period, on-demand */}
      <PricePredictionCard
        symbol={stock.symbol}
        currentPrice={price}
      />

      {/* 3-Layer Algorithmic Pattern Confluence Matrix */}
      <PatternConfluenceCard
        symbol={stock.symbol}
        bars={candlestickData}
        currentPrice={price}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard label="P/E Ratio" value={stock.pe ? stock.pe.toFixed(1) : 'N/A'} />
        <SummaryCard label="Market Cap" value={stock.marketCap ? formatINRCompact(stock.marketCap * 10000000) : 'N/A'} />
        <SummaryCard label="52W High" value={stock.weekHigh52 ? formatINR(stock.weekHigh52) : 'N/A'} />
        <SummaryCard label="52W Low" value={stock.weekLow52 ? formatINR(stock.weekLow52) : 'N/A'} />
      </div>

      {/* Holdings + AI section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-surface border border-border-default rounded-[12px] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-medium text-text-primary">Your Holdings</h2>
            {stock.quantity === 0 && (
              <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-semibold">
                Watchlist / Research Mode
              </span>
            )}
          </div>

          {stock.quantity > 0 ? (
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
          ) : (
            <div className="bg-bg-surface-2 p-4 rounded-[10px] border border-border-default space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase font-semibold text-text-faint">
                  Portfolio Position
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-bg-surface-3 text-text-faint">
                  0 Shares Held
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[11px] text-text-faint block font-mono uppercase">Current Market Price</span>
                  <span className="text-[16px] font-mono font-bold text-text-primary">{formatINR(price)}</span>
                </div>
                <button
                  onClick={() => {
                    setTradeAction('buy');
                    setIsTradeOpen(true);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-positive hover:bg-positive/90 text-white shadow-sm transition-all cursor-pointer"
                >
                  Place Buy Order
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-medium text-text-primary flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-500" />
              ML Quant Strategy Engine (Dey et al.)
            </h2>
            <span className="text-[11px] font-mono uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              PPO Policy Active
            </span>
          </div>

          <div className="bg-bg-surface border border-border-default rounded-[12px] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border-default pb-3">
              <div>
                <p className="text-[12px] text-text-faint uppercase font-mono">Regime Category</p>
                <p className="text-[14px] font-semibold text-text-primary capitalize">{algoSignal.category.replace('_', ' ')}</p>
              </div>
              <div className="text-right">
                <p className="text-[12px] text-text-faint uppercase font-mono">Policy Confidence</p>
                <p className="text-[14px] font-bold text-emerald-400 font-mono">{algoSignal.confidencePercent}%</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-bg-surface-2 p-2.5 rounded-lg border border-border-default/40">
                <span className="text-[10px] text-text-faint block font-mono">RSI (14)</span>
                <span className={cn('text-[13.5px] font-mono font-bold', algoSignal.indicators.rsi14 < 35 ? 'text-emerald-400' : algoSignal.indicators.rsi14 > 68 ? 'text-rose-400' : 'text-text-primary')}>
                  {algoSignal.indicators.rsi14}
                </span>
              </div>
              <div className="bg-bg-surface-2 p-2.5 rounded-lg border border-border-default/40">
                <span className="text-[10px] text-text-faint block font-mono">Z-Score (20)</span>
                <span className={cn('text-[13.5px] font-mono font-bold', Math.abs(algoSignal.indicators.zScore20) >= 1.8 ? 'text-amber-400' : 'text-text-primary')}>
                  {algoSignal.indicators.zScore20 > 0 ? `+${algoSignal.indicators.zScore20}` : algoSignal.indicators.zScore20}σ
                </span>
              </div>
              <div className="bg-bg-surface-2 p-2.5 rounded-lg border border-border-default/40">
                <span className="text-[10px] text-text-faint block font-mono">MACD Accel</span>
                <span className={cn('text-[13.5px] font-mono font-bold', algoSignal.indicators.macd.histogram >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                  {algoSignal.indicators.macd.histogram >= 0 ? '+' : ''}{algoSignal.indicators.macd.histogram}
                </span>
              </div>
            </div>

            <DisclosureCard
              title="Quant Regime Formulation & Policy Reasoning"
              subtitle="Reinforcement learning policy analysis across state spaces"
              badge="Dey et al. (2025)"
              icon={<Cpu className="w-4 h-4 text-emerald-400" />}
              variant="default"
            >
              <p className="text-[12.5px] text-text-secondary leading-relaxed pt-1">
                {algoSignal.reasoning}
              </p>
            </DisclosureCard>
          </div>

          <SentimentCatalystCard symbol={stock.symbol} />

          <h2 className="text-[16px] font-medium text-text-primary pt-2">AI Market Insights</h2>
          {relatedInsights.length > 0 ? (
            relatedInsights.map((insight) => (
              <AIInsightCard key={insight.id} insight={insight} />
            ))
          ) : (
            <div className="bg-bg-surface border border-border-default rounded-[12px] p-5">
              <p className="text-[13px] text-text-faint">No specific news alerts for {stock.symbol} at this time.</p>
            </div>
          )}
        </div>
      </div>

      {/* Trade Modal */}
      <TradeModal
        isOpen={isTradeOpen}
        onClose={() => setIsTradeOpen(false)}
        symbol={stock.symbol}
        name={stock.name}
        currentPrice={price}
        initialAction={tradeAction}
        assetType="stock"
      />
    </motion.div>
  );
}
