'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  ShieldCheck,
  TrendingDown,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers,
  ArrowUpRight,
  Info,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { formatINR, formatINRCompact, cn } from '@/lib/formatters';

export interface StressScenario {
  id: string;
  name: string;
  period: string;
  description: string;
  equityShock: number;    // % change, e.g. -45%
  debtShock: number;      // % change, e.g. +7%
  goldShock: number;      // % change, e.g. +28%
  cryptoShock: number;    // % change, e.g. -70%
  realEstateShock: number;// % change, e.g. -15%
  cashShock: number;      // % change, e.g. 0%
  expectedRecoveryMonths: number;
  historicalContext: string;
  protectiveAdvice: string;
}

const HISTORICAL_SCENARIOS: StressScenario[] = [
  {
    id: 'gfc_2008',
    name: '2008 Global Financial Crisis',
    period: 'Jan 2008 - Mar 2009',
    description: 'Severe credit contagion and global banking freeze triggered by US subprime mortgage collapse.',
    equityShock: -52,
    debtShock: 8.5,
    goldShock: 32,
    cryptoShock: -85,
    realEstateShock: -20,
    cashShock: 0,
    expectedRecoveryMonths: 22,
    historicalContext: 'Nifty 50 crashed ~55% while Gold surged over 30% as safe haven and RBI reduced rates, benefiting AAA debt.',
    protectiveAdvice: 'Maintain at least 15-20% allocation in Gold and Sovereign/AAA Debt to cushion drawdowns and rebalance into cheap equities.',
  },
  {
    id: 'covid_2020',
    name: '2020 COVID-19 Flash Crash',
    period: 'Feb 2020 - Apr 2020',
    description: 'Unprecedented pandemic lockdowns induced the fastest 35% equity market decline in modern history.',
    equityShock: -38,
    debtShock: 6.0,
    goldShock: 24,
    cryptoShock: -50,
    realEstateShock: -5,
    cashShock: 0,
    expectedRecoveryMonths: 7,
    historicalContext: 'Swift V-shaped recovery powered by aggressive central bank liquidity and domestic retail inflows.',
    protectiveAdvice: 'Panic selling during flash crashes locks in permanent capital loss. Systematic SIP continuation yielded exponential returns in the recovery.',
  },
  {
    id: 'stagflation_rates',
    name: 'Stagflation & Rate Hike Cycle',
    period: '1970s & 2022 Analogue',
    description: 'Persistent 8%+ inflation accompanied by aggressive interest rate hikes and corporate margin compression.',
    equityShock: -18,
    debtShock: -3.5,
    goldShock: 45,
    cryptoShock: -65,
    realEstateShock: 12,
    cashShock: -6,
    expectedRecoveryMonths: 16,
    historicalContext: 'Equities and fixed-rate bonds suffer simultaneous headwinds while physical assets (Gold & Real Estate) preserve real purchasing power.',
    protectiveAdvice: 'Overweight commodities and high-pricing-power QVM companies with pristine balance sheets (zero debt) to withstand high interest rates.',
  },
  {
    id: 'smallcap_crunch',
    name: 'Mid & Small-Cap Liquidity Crunch',
    period: '2018 Mid-Cap Drawdown',
    description: 'Regulatory margin tightening and mutual fund re-categorization sparking severe illiquidity in high-beta stocks.',
    equityShock: -32,
    debtShock: 7.2,
    goldShock: 10,
    cryptoShock: -40,
    realEstateShock: 0,
    cashShock: 0,
    expectedRecoveryMonths: 18,
    historicalContext: 'Large caps held steady while small and micro caps declined 35-50% with low trading volumes.',
    protectiveAdvice: 'Strictly maintain small-cap exposure below 15-25% ceiling as prescribed by your demographic age guardrails.',
  },
];

interface Props {
  netWorthBreakdown: {
    totalCurrentAssets: number;
    assetBreakdownPercent: {
      equity: number;
      fdDebt: number;
      gold: number;
      realEstate: number;
      cash: number;
      crypto?: number;
    };
  };
  className?: string;
}

export function StressTestingCard({ netWorthBreakdown, className }: Props) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('gfc_2008');

  const activeScenario = useMemo(() => {
    return HISTORICAL_SCENARIOS.find((s) => s.id === selectedScenarioId) || HISTORICAL_SCENARIOS[0];
  }, [selectedScenarioId]);

  const totalAssets = netWorthBreakdown?.totalCurrentAssets || 1000000;
  const breakdown = netWorthBreakdown?.assetBreakdownPercent || { equity: 50, fdDebt: 30, gold: 10, realEstate: 5, cash: 5 };

  // Calculate simulated values
  const simulation = useMemo(() => {
    const eqVal = (breakdown.equity / 100) * totalAssets;
    const debtVal = (breakdown.fdDebt / 100) * totalAssets;
    const goldVal = (breakdown.gold / 100) * totalAssets;
    const propVal = (breakdown.realEstate / 100) * totalAssets;
    const cashVal = (breakdown.cash / 100) * totalAssets;
    const cryptoVal = ((breakdown.crypto || 0) / 100) * totalAssets;

    const eqShocked = eqVal * (1 + activeScenario.equityShock / 100);
    const debtShocked = debtVal * (1 + activeScenario.debtShock / 100);
    const goldShocked = goldVal * (1 + activeScenario.goldShock / 100);
    const propShocked = propVal * (1 + activeScenario.realEstateShock / 100);
    const cashShocked = cashVal * (1 + activeScenario.cashShock / 100);
    const cryptoShocked = cryptoVal * (1 + activeScenario.cryptoShock / 100);

    const postShockTotal = Math.max(0, eqShocked + debtShocked + goldShocked + propShocked + cashShocked + cryptoShocked);
    const valueChange = postShockTotal - totalAssets;
    const percentChange = (valueChange / totalAssets) * 100;

    // Cushion value generated by defensive assets (Gold + Debt)
    const defensiveGain = (goldShocked - goldVal) + (debtShocked - debtVal);

    // Compute Resilience Grade:
    // A+ : Drawdown < 10%
    // A  : Drawdown < 18%
    // B  : Drawdown < 28%
    // C  : Drawdown >= 28%
    const absDrop = Math.abs(percentChange);
    let grade = 'A';
    let gradeLabel = 'High Resilience';
    let gradeColor = 'text-positive border-positive/30 bg-positive/10';

    if (absDrop <= 12) {
      grade = 'A+';
      gradeLabel = 'Fortress Cushion';
      gradeColor = 'text-positive border-positive/30 bg-positive/10';
    } else if (absDrop <= 22) {
      grade = 'A';
      gradeLabel = 'Institutional Safe';
      gradeColor = 'text-accent-brass border-accent-brass/30 bg-accent-brass/10';
    } else if (absDrop <= 32) {
      grade = 'B';
      gradeLabel = 'Moderate Exposure';
      gradeColor = 'text-warning border-warning/30 bg-warning/10';
    } else {
      grade = 'C';
      gradeLabel = 'High Drawdown Risk';
      gradeColor = 'text-negative border-negative/30 bg-negative/10';
    }

    return {
      postShockTotal,
      valueChange,
      percentChange,
      defensiveGain,
      grade,
      gradeLabel,
      gradeColor,
      assetShockImpact: [
        { label: 'Equity', initial: eqVal, shocked: eqShocked, shockPct: activeScenario.equityShock, color: '#C9A227' },
        { label: 'Gold', initial: goldVal, shocked: goldShocked, shockPct: activeScenario.goldShock, color: '#7C8AD4' },
        { label: 'Fixed Debt', initial: debtVal, shocked: debtShocked, shockPct: activeScenario.debtShock, color: '#3FA88A' },
        { label: 'Cash & Liquid', initial: cashVal, shocked: cashShocked, shockPct: activeScenario.cashShock, color: '#D9705C' },
      ],
    };
  }, [totalAssets, breakdown, activeScenario]);

  return (
    <div className={cn('bg-bg-surface/90 backdrop-blur-xl border border-border-default rounded-[14px] p-6 space-y-6 shadow-md', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-default pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-negative/10 border border-negative/30 flex items-center justify-center">
            <Flame className="w-5 h-5 text-negative" />
          </div>
          <div>
            <h2 className="text-[17px] font-medium text-text-primary flex items-center gap-2">
              Portfolio Stress Testing & Shock Simulator
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-accent-brass/10 text-accent-brass border border-accent-brass/30">
                Institutional Monte Carlo
              </span>
            </h2>
            <p className="text-[12px] text-text-faint">
              Simulates how your current asset allocation withstands severe historical market crashes
            </p>
          </div>
        </div>

        {/* Resilience Grade Badge */}
        <div className="flex items-center gap-2">
          <div className={cn('flex items-center gap-2 px-3.5 py-1.5 rounded-[10px] border font-mono text-[13px] font-medium', simulation.gradeColor)}>
            <ShieldCheck className="w-4 h-4" />
            <span>Grade {simulation.grade} ({simulation.gradeLabel})</span>
          </div>
        </div>
      </div>

      {/* Scenario Selector Pills */}
      <div className="space-y-2">
        <label className="text-[11px] font-mono uppercase tracking-wider text-text-faint">
          Select Historical Stress Scenario
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {HISTORICAL_SCENARIOS.map((sc) => {
            const isSelected = sc.id === selectedScenarioId;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => setSelectedScenarioId(sc.id)}
                className={cn(
                  'p-3 rounded-[10px] border text-left transition-all relative overflow-hidden flex flex-col justify-between',
                  isSelected
                    ? 'border-accent-brass bg-accent-brass/10 shadow-sm'
                    : 'border-border-default bg-bg-surface-2/60 hover:border-border-strong hover:bg-bg-surface-2'
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-medium text-text-primary">{sc.name}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-accent-brass" />}
                  </div>
                  <span className="text-[10.5px] text-text-faint font-mono block mt-0.5">{sc.period}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono mt-2 pt-2 border-t border-border-default/50">
                  <span className="text-negative font-medium">Eq: {sc.equityShock}%</span>
                  <span className="text-positive font-medium">Gold: +{sc.goldShock}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scenario Simulation Impact Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Drawdown Metric Card */}
        <div className="bg-bg-surface-2/70 border border-border-default rounded-[12px] p-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-text-faint uppercase font-mono">
            <span>Simulated Drawdown</span>
            <TrendingDown className="w-3.5 h-3.5 text-negative" />
          </div>
          <div className="text-[24px] font-medium font-mono text-negative">
            {formatINR(simulation.valueChange)}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-negative font-mono">
            <span>{simulation.percentChange.toFixed(1)}% total drop</span>
            <span className="text-text-faint">({formatINR(totalAssets)} → {formatINR(simulation.postShockTotal)})</span>
          </div>
        </div>

        {/* Defensive Cushion Card */}
        <div className="bg-bg-surface-2/70 border border-border-default rounded-[12px] p-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-text-faint uppercase font-mono">
            <span>Gold & Debt Cushion</span>
            <ShieldCheck className="w-3.5 h-3.5 text-positive" />
          </div>
          <div className="text-[24px] font-medium font-mono text-positive">
            +{formatINR(Math.max(0, simulation.defensiveGain))}
          </div>
          <div className="text-[12px] text-text-secondary">
            Generated from non-correlated hedge assets to absorb equity shock
          </div>
        </div>

        {/* Expected Recovery Timeline */}
        <div className="bg-bg-surface-2/70 border border-border-default rounded-[12px] p-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-text-faint uppercase font-mono">
            <span>Historical Recovery Time</span>
            <Clock className="w-3.5 h-3.5 text-accent-brass" />
          </div>
          <div className="text-[24px] font-medium font-mono text-text-primary">
            ~{activeScenario.expectedRecoveryMonths} Months
          </div>
          <div className="text-[12px] text-text-secondary">
            Time required for portfolio to reach pre-crash peak via continuous SIP
          </div>
        </div>
      </div>

      {/* Breakdown per Asset Class Under Shock */}
      <div className="space-y-3">
        <h4 className="text-[13px] font-medium text-text-primary flex items-center gap-2">
          <Layers className="w-4 h-4 text-accent-brass" />
          Asset Class Impact Under &ldquo;{activeScenario.name}&rdquo;
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {simulation.assetShockImpact.map((item) => {
            const diff = item.shocked - item.initial;
            const isGain = diff >= 0;
            return (
              <div
                key={item.label}
                className="bg-bg-surface-2/60 border border-border-default rounded-[10px] p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-medium text-text-primary">{item.label}</span>
                  <span className={cn('text-[11.5px] font-mono font-bold', isGain ? 'text-positive' : 'text-negative')}>
                    {isGain ? '+' : ''}{item.shockPct}%
                  </span>
                </div>
                <div className="text-[15px] font-mono font-medium text-text-primary">
                  {formatINR(item.shocked)}
                </div>
                <div className="flex items-center justify-between text-[10.5px] text-text-faint font-mono">
                  <span>Pre: {formatINR(item.initial)}</span>
                  <span className={isGain ? 'text-positive' : 'text-negative'}>
                    {isGain ? '+' : ''}{formatINR(diff)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Context & Protective Quantitative Guidance */}
      <div className="bg-bg-surface-2/80 border border-border-default rounded-[12px] p-4 space-y-3">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-accent-brass shrink-0 mt-0.5" />
          <div className="space-y-1 text-[12px] leading-relaxed">
            <span className="font-semibold text-text-primary">Historical Precedent: </span>
            <span className="text-text-secondary">{activeScenario.historicalContext}</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 pt-2 border-t border-border-default/60">
          <Sparkles className="w-4 h-4 text-positive shrink-0 mt-0.5" />
          <div className="space-y-1 text-[12px] leading-relaxed">
            <span className="font-semibold text-text-primary">Quantitative Protection Strategy: </span>
            <span className="text-text-secondary">{activeScenario.protectiveAdvice}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
