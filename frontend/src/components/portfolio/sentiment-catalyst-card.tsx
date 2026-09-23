'use client';

import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Newspaper,
  Sparkles,
  ShieldCheck,
  Scale,
  ExternalLink,
} from 'lucide-react';
import { SentimentAnalysisResult } from '@/lib/strategies/sentiment-catalyst';

interface SentimentCatalystCardProps {
  symbol: string;
  className?: string;
}

export function SentimentCatalystCard({ symbol, className = '' }: SentimentCatalystCardProps) {
  const { data, isLoading, error } = useQuery<SentimentAnalysisResult>({
    queryKey: ['sentiment-catalyst', symbol],
    queryFn: async () => {
      const res = await fetch(`/api/ai/sentiment?symbol=${encodeURIComponent(symbol)}`);
      if (!res.ok) throw new Error('Failed to fetch sentiment analysis');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 mins cache
  });

  if (isLoading) {
    return (
      <div className={`bg-bg-surface border border-border-default rounded-[16px] p-6 animate-pulse space-y-4 ${className}`}>
        <div className="h-6 w-48 bg-bg-surface-2 rounded" />
        <div className="h-20 w-full bg-bg-surface-2 rounded-xl" />
        <div className="h-32 w-full bg-bg-surface-2 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const isBullish = data.polarityScore > 0.2;
  const isBearish = data.polarityScore < -0.2;

  const sentimentColor = isBullish
    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    : isBearish
    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    : 'text-amber-400 bg-amber-500/10 border-amber-500/30';

  const SentimentIcon = isBullish ? TrendingUp : isBearish ? TrendingDown : Minus;

  return (
    <div className={`bg-bg-surface border border-border-default rounded-[16px] p-6 space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-default pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-accent-brass bg-accent-brass/10 px-2 py-0.5 rounded border border-accent-brass/20">
              Dey et al. (2025) Sentiment NLP
            </span>
            <span className="text-[12px] text-text-faint font-mono">Gemini Indian News Catalyst Engine</span>
          </div>
          <h3 className="text-[18px] font-medium text-text-primary flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-accent-brass" />
            Market Catalyst & News Sentiment Analysis
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono border ${sentimentColor}`}>
            <SentimentIcon className="w-3.5 h-3.5" />
            {data.overallSentiment.toUpperCase()} ({data.polarityScore > 0 ? `+${data.polarityScore}` : data.polarityScore})
          </span>
        </div>
      </div>

      {/* Sizing Modulation & Polarity Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Polarity Bar */}
        <div className="bg-bg-surface-2 border border-border-default rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-faint uppercase font-mono tracking-wider">Polarity Index</span>
            <span className="font-mono font-bold text-text-primary">{Math.round((data.polarityScore + 1) * 50)}/100</span>
          </div>
          <div className="w-full h-2 bg-bg-surface-3 rounded-full overflow-hidden flex">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isBullish ? 'bg-emerald-400' : isBearish ? 'bg-rose-400' : 'bg-amber-400'
              }`}
              style={{ width: `${Math.max(5, Math.min(95, (data.polarityScore + 1) * 50))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-text-faint font-mono">
            <span>-1.0 Bearish</span>
            <span>0.0 Neutral</span>
            <span>+1.0 Bullish</span>
          </div>
        </div>

        {/* Quant Position Multiplier */}
        <div className="bg-bg-surface-2 border border-border-default rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-faint uppercase font-mono tracking-wider flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-accent-brass" /> Position Sizing
            </span>
            <span className="text-xs font-bold font-mono text-accent-brass">
              {data.quantPositionAdjustment.baseWeightMultiplier}x Weight
            </span>
          </div>
          <p className="text-xs font-medium text-text-primary">
            {data.quantPositionAdjustment.actionRecommendation}
          </p>
          <p className="text-[11px] text-text-secondary truncate">
            {data.quantPositionAdjustment.rationale}
          </p>
        </div>

        {/* AI Confidence */}
        <div className="bg-bg-surface-2 border border-border-default rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-faint uppercase font-mono tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> NLP Confidence
            </span>
            <span className="text-xs font-bold font-mono text-emerald-400">
              {data.confidenceScore}%
            </span>
          </div>
          <p className="text-xs text-text-primary font-mono mt-1">
            Indian Financial Corpus Match
          </p>
          <p className="text-[11px] text-text-faint">
            Evaluated via Gemini & Live Media feeds
          </p>
        </div>
      </div>

      {/* Catalysts Breakdown List */}
      <div className="space-y-2.5">
        <p className="text-xs uppercase font-mono tracking-wider text-text-faint flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-accent-brass" />
          Key Qualitative Catalysts & Regulatory Filings
        </p>

        <div className="space-y-2">
          {data.catalysts.map((cat) => (
            <div
              key={cat.id}
              className="bg-bg-surface-2/60 border border-border-default/80 hover:border-border-strong rounded-xl p-3.5 transition-all text-xs space-y-1.5"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-text-primary leading-snug">
                  {cat.headline}
                </p>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                    cat.impactScore > 0
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                  }`}
                >
                  {cat.impactScore > 0 ? `+${cat.impactScore}` : cat.impactScore} Impact
                </span>
              </div>

              <p className="text-text-secondary text-[12px] leading-relaxed">
                {cat.summary}
              </p>

              <div className="flex items-center justify-between pt-1 text-[11px] text-text-faint font-mono">
                <span className="capitalize">{cat.source} &bull; {cat.publishedAt}</span>
                <span className="uppercase text-accent-brass tracking-wider text-[10px]">
                  {cat.category.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
