/**
 * Quantitative Strategy Types & Contracts
 * Adheres to Interface Segregation Principle (ISP) and Open/Closed Principle (OCP).
 */

export type SignalType = 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';

export type StrategyCategory = 'momentum' | 'mean_reversion' | 'stat_arb' | 'sentiment_hybrid' | 'rl_policy';

export interface TechnicalIndicatorSet {
  rsi14: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  };
  zScore20: number; // Price deviation from 20-day SMA in standard deviations
  emaTrend: 'bullish' | 'bearish' | 'neutral';
}

export interface QuantitativeSignal {
  symbol: string;
  category: StrategyCategory;
  signal: SignalType;
  confidencePercent: number;
  label: string;
  reasoning: string;
  indicators: TechnicalIndicatorSet;
  updatedAt: string;
}

export interface CointegratedPair {
  id: string;
  symbolA: string;
  symbolB: string;
  nameA: string;
  nameB: string;
  sector: string;
  correlation: number;
  hedgeRatio: number;
  currentSpreadZ: number;
  opportunity: 'buy_a_sell_b' | 'buy_b_sell_a' | 'neutral_in_band';
  description: string;
  history: {
    date: string;
    ratio: number;
    spreadZ: number;
    upperBand: number;
    lowerBand: number;
    mean: number;
  }[];
}

export interface StrategyBenchmarkMetrics {
  strategyName: string;
  modelType: string;
  annualizedReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  volatilityReduction: number;
  avgExecutionMs: number;
  transactionCostPercent: number;
  color: string;
  description: string;
}
