'use client';

import { useState } from 'react';
import { formatINR, formatINRCompact, cn } from '@/lib/formatters';
import { 
  Target, 
  Calendar, 
  Sparkles, 
  Plus, 
  Trash2, 
  X, 
  Check, 
  ShieldCheck, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  onAddGoal?: (goal: { type: string; targetAmount: number; horizonYears: number }) => Promise<void> | void;
  onDeleteGoal?: (index: number) => Promise<void> | void;
  className?: string;
}

const PRESET_GOALS = [
  { name: 'House Downpayment', amount: 2500000, horizon: 5 },
  { name: 'Child Education', amount: 3000000, horizon: 10 },
  { name: 'Retirement Corpus', amount: 10000000, horizon: 15 },
  { name: 'International Vacation', amount: 600000, horizon: 2 },
  { name: 'Vehicle Upgrade', amount: 1500000, horizon: 3 },
  { name: 'Emergency Sinking Fund', amount: 500000, horizon: 1 },
];

export function GoalExecutionCards({ goals, onAddGoal, onDeleteGoal, className }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState<number>(1000000);
  const [horizonYears, setHorizonYears] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePresetSelect = (preset: typeof PRESET_GOALS[0]) => {
    setGoalName(preset.name);
    setTargetAmount(preset.amount);
    setHorizonYears(preset.horizon);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim() || targetAmount <= 0 || horizonYears <= 0) return;

    setIsSubmitting(true);
    try {
      if (onAddGoal) {
        await onAddGoal({
          type: goalName.trim(),
          targetAmount: Number(targetAmount),
          horizonYears: Number(horizonYears),
        });
      }
      setIsModalOpen(false);
      setGoalName('');
      setTargetAmount(1000000);
      setHorizonYears(5);
    } catch (err) {
      console.error('Error adding goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with Title and Add Goal Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-medium text-text-primary flex items-center gap-2">
            <Target className="w-4 h-4 text-accent-brass" />
            AI Goal Sinking Fund & Execution Plan
          </h2>
          <p className="text-[12px] text-text-faint">
            6% inflation-compounded target mapping and monthly required SIP allocations
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-accent-brass hover:bg-accent-brass-dim text-bg-base font-semibold text-[12.5px] transition-all self-start sm:self-auto cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Financial Goal</span>
        </button>
      </div>

      {/* Goal Cards Grid or Empty State */}
      {!goals || goals.length === 0 ? (
        <div className="bg-bg-surface border border-border-default rounded-[12px] p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-accent-brass/10 flex items-center justify-center mx-auto text-accent-brass">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[14px] font-medium text-text-primary">No Financial Goals Added Yet</h3>
            <p className="text-[12px] text-text-faint max-w-md mx-auto mt-1">
              Add goals like a House Downpayment, Child Education, or Retirement to simulate goal maturity outflows and SIP requirements.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-accent-brass hover:bg-accent-brass-dim text-bg-base font-semibold text-[12.5px] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Your First Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((item, i) => (
            <div
              key={i}
              className="bg-bg-surface border border-border-default hover:border-accent-brass/50 rounded-[12px] p-5 transition-all space-y-4 relative overflow-hidden group shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[15px] font-medium text-text-primary">{item.goal}</h3>
                  <div className="flex items-center gap-2 mt-1 text-[12px] text-text-faint">
                    <Calendar className="w-3.5 h-3.5 text-accent-brass" />
                    <span>{item.horizonYears} Years Horizon</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-accent-brass/10 text-accent-brass font-medium">
                    Goal #{i + 1}
                  </span>
                  {onDeleteGoal && (
                    <button
                      type="button"
                      onClick={() => onDeleteGoal(i)}
                      className="text-text-faint hover:text-negative p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-bg-surface-2/70 p-3 rounded-[8px] border border-border-default/60">
                <div>
                  <span className="text-[10px] text-text-faint uppercase tracking-wider block font-mono">Target (Today)</span>
                  <span className="text-[13px] font-mono text-text-secondary">{formatINRCompact(item.originalTarget)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-faint uppercase tracking-wider block font-mono">Target (Inf. Adjusted 6%)</span>
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
                  <span className="text-[10px] text-text-faint uppercase tracking-wider block font-mono">Required SIP</span>
                  <span className="text-[15px] font-mono text-positive font-bold">{formatINR(item.requiredMonthlySip)}/mo</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Goal Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-base/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-surface border border-border-default rounded-[16px] max-w-lg w-full overflow-hidden shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-border-default pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent-brass/10 flex items-center justify-center text-accent-brass">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-text-primary">Add New Financial Goal</h3>
                    <p className="text-[11.5px] text-text-faint">Map target cost & horizon to calculate required SIP</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-text-faint hover:text-text-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-text-faint block">Quick Goal Presets</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_GOALS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className={cn(
                        'text-[11px] px-2.5 py-1 rounded-[6px] border transition-all cursor-pointer',
                        goalName === preset.name
                          ? 'border-accent-brass bg-accent-brass/10 text-accent-brass font-medium'
                          : 'border-border-default bg-bg-surface-2 text-text-secondary hover:text-text-primary'
                      )}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal Form */}
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-text-primary block">Goal Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. House Downpayment, Child Education"
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    className="w-full bg-bg-surface-2 border border-border-default rounded-[8px] px-3.5 py-2 text-[13px] text-text-primary focus:outline-none focus:border-accent-brass"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[12px] font-medium text-text-primary block">Target Cost Today (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint font-mono text-[13px]">₹</span>
                      <input
                        type="number"
                        min="10000"
                        step="10000"
                        required
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(Math.max(10000, Number(e.target.value)))}
                        className="w-full bg-bg-surface-2 border border-border-default rounded-[8px] pl-7 pr-3 py-2 text-[13px] font-mono text-text-primary focus:outline-none focus:border-accent-brass"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] font-medium text-text-primary block">Timeline (Years)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="40"
                        required
                        value={horizonYears}
                        onChange={(e) => setHorizonYears(Math.max(1, Math.min(40, Number(e.target.value))))}
                        className="w-full bg-bg-surface-2 border border-border-default rounded-[8px] px-3.5 py-2 text-[13px] font-mono text-text-primary focus:outline-none focus:border-accent-brass"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint text-[12px]">yrs</span>
                    </div>
                  </div>
                </div>

                {/* Live Preview Info */}
                <div className="bg-bg-surface-2/60 border border-border-default rounded-[8px] p-3 text-[11.5px] text-text-secondary leading-relaxed space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Inflation-Compounded Target (at 6% p.a.):</span>
                    <strong className="text-text-primary font-mono">
                      {formatINR(Math.round(targetAmount * Math.pow(1.06, horizonYears)))}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Estimated Monthly SIP (at 12% p.a.):</span>
                    <strong className="text-positive font-mono">
                      ~{formatINR(Math.round((targetAmount * Math.pow(1.06, horizonYears)) / (horizonYears * 12 * 1.5)))}/mo
                    </strong>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border-default">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-[8px] text-[12.5px] font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !goalName.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-accent-brass hover:bg-accent-brass-dim text-bg-base font-semibold text-[12.5px] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Adding Goal...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save & Recalculate SIP</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
