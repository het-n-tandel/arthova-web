'use client';

import { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Cpu, TrendingUp, ShieldAlert, Award, Activity, Check } from 'lucide-react';
import {
  DEY_BENCHMARK_MODELS,
  getCumulativeEquityGrowth,
} from '@/lib/strategies/strategy-benchmarks';

export function StrategyBenchmarkCard() {
  const [selectedModel, setSelectedModel] = useState<string>(DEY_BENCHMARK_MODELS[0].strategyName);
  const growthData = getCumulativeEquityGrowth();

  const activeModelDetails =
    DEY_BENCHMARK_MODELS.find((m) => m.strategyName === selectedModel) || DEY_BENCHMARK_MODELS[0];

  return (
    <div className="bg-bg-surface border border-border-default rounded-[16px] p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-default pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-accent-brass bg-accent-brass/10 px-2 py-0.5 rounded border border-accent-brass/20">
              Dey et al. (2025) Empirical Backtest
            </span>
            <span className="text-[12px] text-text-faint font-mono">NSE Large-Cap 10-Year Study (2013–2023)</span>
          </div>
          <h2 className="text-[20px] font-medium text-text-primary flex items-center gap-2">
            <Cpu className="w-5 h-5 text-accent-brass" />
            AI & Deep Reinforcement Learning Strategy Benchmark
          </h2>
          <p className="text-[13px] text-text-secondary mt-1">
            Empirical comparative analysis of Deep RL (PPO, DQN) vs Recurrent Neural Networks (LSTM) and traditional Buy & Hold.
          </p>
        </div>

        {/* Paper Highlights Badge */}
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl text-emerald-400 text-xs">
          <Award className="w-4 h-4 shrink-0" />
          <span>
            <strong className="font-semibold">Top Performer: PPO</strong> (+21.3% CAGR, 1.84 Sharpe)
          </span>
        </div>
      </div>

      {/* Model Selection Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
        {DEY_BENCHMARK_MODELS.map((m) => {
          const isSelected = m.strategyName === selectedModel;
          return (
            <button
              key={m.strategyName}
              onClick={() => setSelectedModel(m.strategyName)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-bg-surface-2 border-accent-brass shadow-sm'
                  : 'bg-bg-surface border-border-default hover:border-border-strong hover:bg-bg-surface-2/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                {isSelected && <Check className="w-3.5 h-3.5 text-accent-brass" />}
              </div>
              <p className="text-xs font-semibold text-text-primary truncate">{m.strategyName.split(' ')[0]}</p>
              <p className="text-[10px] text-text-faint truncate">{m.annualizedReturn}% CAGR</p>
            </button>
          );
        })}
      </div>

      {/* Main Chart: Cumulative Growth (Base 100) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-text-faint font-mono">
          <span>Cumulative Wealth Growth (Normalized Base = 100, 2013-2023)</span>
          <span className="text-[11px] text-accent-brass">Transaction Cost Deducted: 0.15%</span>
        </div>

        <div className="h-[300px] w-full bg-bg-surface-2/40 border border-border-default rounded-xl p-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthData} margin={{ top: 15, right: 25, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" opacity={0.6} vertical={false} />
              <XAxis dataKey="period" stroke="var(--text-faint)" fontSize={11} tickLine={false} />
              <YAxis
                domain={['auto', 'auto']}
                stroke="var(--text-faint)"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => `₹${v}`}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-surface-2)',
                  borderColor: 'var(--border-default)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
                formatter={(val: any, name: any) => [`₹${Number(val).toFixed(1)}`, name]}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px', fontFamily: 'monospace' }}
              />

              <Line
                type="monotone"
                dataKey="PPO"
                name="PPO (DRL)"
                stroke="#34D399"
                strokeWidth={selectedModel.includes('PPO') ? 3 : 1.8}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="DQN"
                name="DQN (DRL)"
                stroke="#818CF8"
                strokeWidth={selectedModel.includes('DQN') ? 3 : 1.6}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="LSTM"
                name="LSTM"
                stroke="#C4A962"
                strokeWidth={selectedModel.includes('LSTM') ? 3 : 1.6}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="RandomForest"
                name="Random Forest"
                stroke="#F59E0B"
                strokeWidth={selectedModel.includes('Random Forest') ? 3 : 1.4}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="BuyAndHold"
                name="Buy & Hold (NSE)"
                stroke="#94A3B8"
                strokeWidth={selectedModel.includes('Buy & Hold') ? 3 : 1.2}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Selected Model Deep Dive Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
        <div className="bg-bg-surface-2 border border-border-default rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wider text-text-faint font-mono flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" /> Annualized Return
          </p>
          <p className="text-lg font-bold text-emerald-400 mt-1 font-mono">
            +{activeModelDetails.annualizedReturn}%
          </p>
          <p className="text-[10px] text-text-faint mt-0.5">NIFTY 50: +12.1%</p>
        </div>

        <div className="bg-bg-surface-2 border border-border-default rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wider text-text-faint font-mono flex items-center gap-1">
            <Activity className="w-3 h-3 text-accent-brass" /> Sharpe Ratio
          </p>
          <p className="text-lg font-bold text-accent-brass mt-1 font-mono">
            {activeModelDetails.sharpeRatio}
          </p>
          <p className="text-[10px] text-text-faint mt-0.5">Risk-adjusted return</p>
        </div>

        <div className="bg-bg-surface-2 border border-border-default rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wider text-text-faint font-mono flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-rose-400" /> Max Drawdown
          </p>
          <p className="text-lg font-bold text-rose-400 mt-1 font-mono">
            {activeModelDetails.maxDrawdown}%
          </p>
          <p className="text-[10px] text-text-faint mt-0.5">NSE benchmark: -28.4%</p>
        </div>

        <div className="bg-bg-surface-2 border border-border-default rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wider text-text-faint font-mono">Win Rate</p>
          <p className="text-lg font-bold text-text-primary mt-1 font-mono">
            {activeModelDetails.winRate}%
          </p>
          <p className="text-[10px] text-text-faint mt-0.5">Profitable trades</p>
        </div>

        <div className="bg-bg-surface-2 border border-border-default rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wider text-text-faint font-mono">Volatility Hedging</p>
          <p className="text-lg font-bold text-indigo-400 mt-1 font-mono">
            +{activeModelDetails.volatilityReduction}%
          </p>
          <p className="text-[10px] text-text-faint mt-0.5">Risk variance cut</p>
        </div>
      </div>

      {/* Model Rationale / Dey et al. Finding */}
      <div className="bg-bg-surface-2 border border-border-default rounded-xl p-4 flex items-start gap-3">
        <div
          className="w-3 h-3 rounded-full mt-1 shrink-0"
          style={{ backgroundColor: activeModelDetails.color }}
        />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-text-primary font-mono">
            {activeModelDetails.strategyName} ({activeModelDetails.modelType})
          </p>
          <p className="text-text-secondary leading-relaxed">{activeModelDetails.description}</p>
        </div>
      </div>
    </div>
  );
}
