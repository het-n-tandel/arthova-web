/**
 * Multi-Strategy Machine Learning Empirical Benchmarks
 * Based on Dey et al. (2025): "Empirical Evaluation of ML & DRL Trading Strategies on the NSE (2013-2023)"
 */

import { StrategyBenchmarkMetrics } from './types';

export const DEY_BENCHMARK_MODELS: StrategyBenchmarkMetrics[] = [
  {
    strategyName: 'Proximal Policy Optimization (PPO)',
    modelType: 'Deep Reinforcement Learning (Actor-Critic)',
    annualizedReturn: 21.3,
    maxDrawdown: -12.4,
    sharpeRatio: 1.84,
    winRate: 64.2,
    volatilityReduction: 38.5,
    avgExecutionMs: 42,
    transactionCostPercent: 0.15,
    color: '#34D399', // Emerald
    description:
      'Actor-Critic policy gradient with clipped objective function. Outperforms in volatile regimes by dynamically optimizing cash reserves during sharp market downturns.',
  },
  {
    strategyName: 'Deep Q-Network (DQN)',
    modelType: 'Deep Reinforcement Learning (Value-Based)',
    annualizedReturn: 19.6,
    maxDrawdown: -15.1,
    sharpeRatio: 1.62,
    winRate: 61.5,
    volatilityReduction: 32.1,
    avgExecutionMs: 58,
    transactionCostPercent: 0.15,
    color: '#818CF8', // Indigo
    description:
      'Q-value approximation with experience replay and target networks. Excels at identifying breakout momentum but exhibits slightly higher drawdown during choppy sideways consolidation.',
  },
  {
    strategyName: 'Long Short-Term Memory (LSTM)',
    modelType: 'Recurrent Neural Network (Supervised Temporal)',
    annualizedReturn: 18.2,
    maxDrawdown: -16.8,
    sharpeRatio: 1.51,
    winRate: 58.7,
    volatilityReduction: 26.4,
    avgExecutionMs: 34,
    transactionCostPercent: 0.15,
    color: '#C4A962', // Brass
    description:
      'Sequential price and volume pattern recognition across 60-day historical lookback windows. Robust medium-term directional forecaster.',
  },
  {
    strategyName: 'Random Forest Ensemble',
    modelType: 'Ensemble Decision Trees (Supervised)',
    annualizedReturn: 14.8,
    maxDrawdown: -21.2,
    sharpeRatio: 1.22,
    winRate: 54.1,
    volatilityReduction: 18.2,
    avgExecutionMs: 12,
    transactionCostPercent: 0.15,
    color: '#F59E0B', // Amber
    description:
      'Bagged decision trees on technical indicator feature sets (RSI, MACD, Bollinger Bands). Fast inference with moderate predictive alpha.',
  },
  {
    strategyName: 'NSE Buy & Hold (NIFTY 50)',
    modelType: 'Passive Benchmark',
    annualizedReturn: 12.1,
    maxDrawdown: -28.4,
    sharpeRatio: 0.95,
    winRate: 51.0,
    volatilityReduction: 0.0,
    avgExecutionMs: 0,
    transactionCostPercent: 0.05,
    color: '#94A3B8', // Slate
    description:
      'Passive long-term allocation in NIFTY 50 constituents. Subject to full market volatility and prolonged macro drawdowns.',
  },
];

export interface BenchmarkGrowthPoint {
  period: string;
  PPO: number;
  DQN: number;
  LSTM: number;
  RandomForest: number;
  BuyAndHold: number;
}

/**
 * Generates normalized 10-year cumulative equity curve data (Base = ₹100,000)
 */
export function getCumulativeEquityGrowth(): BenchmarkGrowthPoint[] {
  const points: BenchmarkGrowthPoint[] = [];
  const years = ['2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'];

  // Base capital: 100
  let ppo = 100;
  let dqn = 100;
  let lstm = 100;
  let rf = 100;
  let bnh = 100;

  points.push({
    period: '2013',
    PPO: 100,
    DQN: 100,
    LSTM: 100,
    RandomForest: 100,
    BuyAndHold: 100,
  });

  const yearMultipliers = [
    { ppo: 1.24, dqn: 1.21, lstm: 1.19, rf: 1.16, bnh: 1.31 }, // 2014 Bull
    { ppo: 1.14, dqn: 1.12, lstm: 1.09, rf: 1.05, bnh: 0.96 }, // 2015 Bear/Sideways
    { ppo: 1.19, dqn: 1.17, lstm: 1.15, rf: 1.11, bnh: 1.03 }, // 2016
    { ppo: 1.32, dqn: 1.29, lstm: 1.26, rf: 1.22, bnh: 1.28 }, // 2017 Bull
    { ppo: 1.16, dqn: 1.14, lstm: 1.12, rf: 1.08, bnh: 1.04 }, // 2018
    { ppo: 1.22, dqn: 1.19, lstm: 1.18, rf: 1.13, bnh: 1.12 }, // 2019
    { ppo: 1.28, dqn: 1.24, lstm: 1.21, rf: 1.14, bnh: 1.15 }, // 2020 Covid + Recovery (DRL hedge)
    { ppo: 1.34, dqn: 1.30, lstm: 1.27, rf: 1.24, bnh: 1.24 }, // 2021 Bull
    { ppo: 1.18, dqn: 1.15, lstm: 1.14, rf: 1.09, bnh: 1.04 }, // 2022 Fed Hikes
    { ppo: 1.25, dqn: 1.23, lstm: 1.20, rf: 1.17, bnh: 1.20 }, // 2023 All-time highs
  ];

  for (let i = 0; i < years.length; i++) {
    const mult = yearMultipliers[i];
    ppo = Number((ppo * mult.ppo).toFixed(1));
    dqn = Number((dqn * mult.dqn).toFixed(1));
    lstm = Number((lstm * mult.lstm).toFixed(1));
    rf = Number((rf * mult.rf).toFixed(1));
    bnh = Number((bnh * mult.bnh).toFixed(1));

    points.push({
      period: years[i],
      PPO: ppo,
      DQN: dqn,
      LSTM: lstm,
      RandomForest: rf,
      BuyAndHold: bnh,
    });
  }

  return points;
}
