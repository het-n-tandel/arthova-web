'use client';

import { formatINR, formatINRCompact, cn } from '@/lib/formatters';
import { Target, Calendar, Sparkles, ArrowRight } from 'lucide-react';

export interface GoalExecutionItem {
  goal: string;
  originalTarget: number;
  inflationAdjustedTarget: number;
  horizonYears: number;
  suggestedAssetClass: string;
  requiredMonthlySip: number;
}

interface Props {
  goals: GoalExecutionItem[];
  className?: string;
}

export function GoalExecutionCards({ goals, className }: Props) {
  if (!goals || goals.length === 0) {
    return (
      <div className="bg-bg-surface border border-border-default rounded-[12px] p-6 text-center text-[13px] text-text-faint">
        No specific financial goals added yet. Complete the AI Onboarding to map your goals.
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-medium text-text-primary flex items-center gap-2">
            <Target className="w-4 h-4 text-accent-brass" />
            AI Goal Execution Plan
          </h2>
          <p className="text-[12px] text-text-faint">Inflation-adjusted SIP requirements for your life goals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((item, i) => (
          <div
            key={i}
            className="bg-bg-surface border border-border-default hover:border-accent-brass/50 rounded-[12px] p-5 transition-all space-y-4 relative overflow-hidden group"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[15px] font-medium text-text-primary">{item.goal}</h3>
                <div className="flex items-center gap-2 mt-1 text-[12px] text-text-faint">
                  <Calendar className="w-3.5 h-3.5 text-accent-brass" />
                  <span>{item.horizonYears} Years Horizon</span>
                </div>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-accent-brass/10 text-accent-brass font-medium">
                Goal #{i + 1}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-bg-surface-2 p-3 rounded-[8px]">
              <div>
                <span className="text-[10px] text-text-faint uppercase tracking-wider block">Target (Today)</span>
                <span className="text-[13px] font-mono text-text-secondary">{formatINRCompact(item.originalTarget)}</span>
              </div>
              <div>
                <span className="text-[10px] text-text-faint uppercase tracking-wider block">Target (Inf. Adjusted 6%)</span>
                <span className="text-[13px] font-mono text-text-primary font-medium">{formatINRCompact(item.inflationAdjustedTarget)}</span>
              </div>
            </div>

            <div className="border-t border-border-default pt-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-text-faint flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-accent-brass" /> Recommended Asset
                </span>
                <span className="text-[12px] font-medium text-text-primary block mt-0.5">{item.suggestedAssetClass}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-text-faint uppercase tracking-wider block">Required SIP</span>
                <span className="text-[15px] font-mono text-positive font-medium">{formatINR(item.requiredMonthlySip)}/mo</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
