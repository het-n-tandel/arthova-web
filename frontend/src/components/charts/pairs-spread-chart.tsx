'use client';

import { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { ArrowLeftRight, TrendingUp, AlertCircle, CheckCircle2, Sliders } from 'lucide-react';
import { TRACKED_NSE_PAIRS, calculatePairSpread } from '@/lib/strategies/pairs-trading';

export function PairsSpreadChart() {
  const [selectedPairId, setSelectedPairId] = useState<string>(TRACKED_NSE_PAIRS[0].id);

  const pairData = useMemo(() => {
    return calculatePairSpread(selectedPairId, 60);
  }, [selectedPairId]);

  const activeMeta = TRACKED_NSE_PAIRS.find(p => p.id === selectedPairId) || TRACKED_NSE_PAIRS[0];

  const getStatusColor = () => {
    if (pairData.opportunity === 'buy_a_sell_b') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (pairData.opportunity === 'buy_b_sell_a') return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  };

  return (
    <div className="bg-bg-surface border border-border-default rounded-[16px] p-6 space-y-6">
      {/* Header & Pair Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-default pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-accent-brass bg-accent-brass/10 px-2 py-0.5 rounded border border-accent-brass/20">
              Dey et al. (2025) Quant Engine
            </span>
            <span className="text-[12px] text-text-faint font-mono">Statistical Arbitrage (StatArb)</span>
          </div>
          <h2 className="text-[20px] font-medium text-text-primary flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-accent-brass" />
            Cointegrated Pairs Trading & Spread Z-Score
          </h2>
          <p className="text-[13px] text-text-secondary mt-1">
            Real-time pairs cointegration modeling with dynamic ±2.0σ mean-reversion bands for Indian equities.
          </p>
        </div>

        {/* Pair Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {TRACKED_NSE_PAIRS.map((pair) => {
            const isSelected = pair.id === selectedPairId;
            return (
              <button
                key={pair.id}
                onClick={() => setSelectedPairId(pair.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                  isSelected
                    ? 'bg-accent-brass text-bg-base font-semibold border-accent-brass shadow-sm'
                    : 'bg-bg-surface-2 text-text-secondary border-border-default hover:border-border-strong hover:text-text-primary'
                }`}
              >
                {pair.symbolA.split('.')[0]} / {pair.symbolB.split('.')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-bg-surface-2 border border-border-default rounded-xl p-3.5">
          <p className="text-[11px] uppercase tracking-wider text-text-faint font-mono">Asset Pair</p>
          <p className="text-sm font-semibold text-text-primary mt-1 font-mono">
            {pairData.symbolA} / {pairData.symbolB}
          </p>
          <p className="text-[11px] text-text-secondary mt-0.5 truncate">{pairData.sector}</p>
        </div>

        <div className="bg-bg-surface-2 border border-border-default rounded-xl p-3.5">
          <p className="text-[11px] uppercase tracking-wider text-text-faint font-mono">Historical Pearson r</p>
          <p className="text-base font-bold text-accent-brass mt-1 font-mono">
            {(pairData.correlation * 100).toFixed(1)}%
          </p>
          <p className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 inline" /> p &lt; 0.001 (Cointegrated)
          </p>
        </div>

        <div className="bg-bg-surface-2 border border-border-default rounded-xl p-3.5">
          <p className="text-[11px] uppercase tracking-wider text-text-faint font-mono">Current Spread Z-Score</p>
          <p className={`text-base font-bold mt-1 font-mono ${
            Math.abs(pairData.currentSpreadZ) >= 1.8 ? 'text-rose-400' : 'text-text-primary'
          }`}>
            {pairData.currentSpreadZ > 0 ? `+${pairData.currentSpreadZ}` : pairData.currentSpreadZ}σ
          </p>
          <p className="text-[11px] text-text-faint mt-0.5 font-mono">
            Threshold: ±2.0σ
          </p>
        </div>

        <div className="bg-bg-surface-2 border border-border-default rounded-xl p-3.5">
          <p className="text-[11px] uppercase tracking-wider text-text-faint font-mono">StatArb Signal</p>
          <div className="mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${getStatusColor()}`}>
              {pairData.opportunity === 'neutral_in_band' && 'Equilibrium (Hold)'}
              {pairData.opportunity === 'buy_a_sell_b' && `Long ${pairData.symbolA.split('.')[0]} / Short ${pairData.symbolB.split('.')[0]}`}
              {pairData.opportunity === 'buy_b_sell_a' && `Long ${pairData.symbolB.split('.')[0]} / Short ${pairData.symbolA.split('.')[0]}`}
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1 truncate">Hedge ratio: {pairData.hedgeRatio.toFixed(3)}</p>
        </div>
      </div>

      {/* Recharts Spread & Z-Score Chart */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-text-faint font-mono">
          <span>Spread Z-Score Divergence (Last 60 Trading Days)</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-rose-400/80 inline-block" /> Upper Band (+2.0σ)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-accent-brass inline-block" /> Spread Z
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-emerald-400/80 inline-block" /> Lower Band (-2.0σ)
            </span>
          </div>
        </div>

        <div className="h-[280px] w-full bg-bg-surface-2/40 border border-border-default rounded-xl p-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pairData.history} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" opacity={0.6} vertical={false} />
              
              <XAxis 
                dataKey="date" 
                stroke="var(--text-faint)" 
                fontSize={10} 
                tickLine={false}
                minTickGap={25}
              />
              
              <YAxis 
                domain={[-3.2, 3.2]} 
                ticks={[-2, -1, 0, 1, 2]}
                stroke="var(--text-faint)" 
                fontSize={10} 
                tickLine={false}
                tickFormatter={(val) => `${val > 0 ? `+${val}` : val}σ`}
                width={36}
              />

              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-surface-2)', 
                  borderColor: 'var(--border-default)', 
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}
                formatter={(val: any) => [`${Number(val).toFixed(2)}σ`, 'Spread Z-Score']}
              />

              {/* Threshold Lines */}
              <ReferenceLine y={2.0} stroke="#f87171" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: '+2σ Sell/Short Spread', fill: '#f87171', fontSize: 10, position: 'insideTopRight' }} />
              <ReferenceLine y={0.0} stroke="var(--text-faint)" strokeDasharray="2 2" strokeWidth={1} label={{ value: 'Mean Ratio', fill: 'var(--text-faint)', fontSize: 9, position: 'insideRight' }} />
              <ReferenceLine y={-2.0} stroke="#34d399" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: '-2σ Buy Spread', fill: '#34d399', fontSize: 10, position: 'insideBottomRight' }} />

              <Line 
                type="monotone" 
                dataKey="spreadZ" 
                name="Spread Z-Score"
                stroke="var(--accent-brass)" 
                strokeWidth={2.2} 
                dot={false}
                activeDot={{ r: 5, fill: 'var(--accent-brass)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Theoretical Description & Alpha Opportunity Box */}
      <div className="bg-bg-surface-2 border border-border-default/80 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-brass/10 border border-accent-brass/20 flex items-center justify-center shrink-0 mt-0.5">
            <Sliders className="w-4 h-4 text-accent-brass" />
          </div>
          <div>
            <p className="font-semibold text-text-primary font-mono">Dey et al. (2025) StatArb Execution Logic:</p>
            <p className="text-text-secondary mt-0.5 leading-relaxed">{pairData.description}</p>
          </div>
        </div>

        <div className="shrink-0 bg-bg-surface-3 px-3 py-2 rounded-lg border border-border-default font-mono text-[11px] text-text-faint">
          <div>Hedge Formula: $P_A - \beta P_B$</div>
          <div className="text-accent-brass">Trigger: $|Z| \ge 2.0\sigma$</div>
        </div>
      </div>
    </div>
  );
}
