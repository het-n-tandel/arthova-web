'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, User, Wallet, Target, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { formatINR } from '@/lib/formatters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
  userId?: string;
}

export function AIOnboardingWizard({ isOpen, onClose, onSuccess, userId }: Props) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [age, setAge] = useState(28);
  const [targetRetirementAge, setTargetRetirementAge] = useState(55);
  const [maritalStatus, setMaritalStatus] = useState('married');
  const [childrenCount, setChildrenCount] = useState(1);
  const [dependentParents, setDependentParents] = useState(true);

  const [monthlyIncome, setMonthlyIncome] = useState(120000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(45000);
  const [monthlyEmis, setMonthlyEmis] = useState(22000);
  const [taxBracketPercent, setTaxBracketPercent] = useState(30);

  const [totalCurrentAssets, setTotalCurrentAssets] = useState(1000000);
  const [equityPct, setEquityPct] = useState(20);
  const [fdDebtPct, setFdDebtPct] = useState(60);
  const [goldPct, setGoldPct] = useState(10);
  const [realEstatePct, setRealEstatePct] = useState(10);
  const [totalLiabilities, setTotalLiabilities] = useState(1500000);
  const [hasHighInterestDebt, setHasHighInterestDebt] = useState(false);

  const [riskAppetite, setRiskAppetite] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [hasHealthInsurance, setHasHealthInsurance] = useState(true);
  const [hasLifeInsurance, setHasLifeInsurance] = useState(true);
  const [hasEmergencyFund, setHasEmergencyFund] = useState(false);

  const [goals, setGoals] = useState([
    { type: 'Car Purchase', targetAmount: 800000, horizonYears: 2 },
    { type: 'Child Education', targetAmount: 2500000, horizonYears: 12 },
  ]);

  if (!isOpen) return null;

  const handleAddGoal = () => {
    setGoals([...goals, { type: 'New Goal', targetAmount: 500000, horizonYears: 5 }]);
  };

  const handleRemoveGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const handleGoalChange = (index: number, field: string, value: any) => {
    const updated = [...goals];
    (updated[index] as any)[field] = value;
    setGoals(updated);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const payload = {
      userDemographics: {
        age: Number(age),
        targetRetirementAge: Number(targetRetirementAge),
        maritalStatus,
        childrenCount: Number(childrenCount),
        dependentParents,
      },
      financialCashflow: {
        monthlyIncome: Number(monthlyIncome),
        monthlyExpenses: Number(monthlyExpenses),
        monthlyEmis: Number(monthlyEmis),
        taxBracketPercent: Number(taxBracketPercent),
      },
      netWorthBreakdown: {
        totalCurrentAssets: Number(totalCurrentAssets),
        assetBreakdownPercent: {
          equity: Number(equityPct),
          fdDebt: Number(fdDebtPct),
          gold: Number(goldPct),
          realEstate: Number(realEstatePct),
        },
        totalLiabilities: Number(totalLiabilities),
        hasHighInterestDebt,
      },
      riskAndInsurance: {
        riskAppetite,
        hasHealthInsurance,
        hasLifeInsurance,
        hasEmergencyFund,
      },
      financialGoals: goals.map((g) => ({
        type: g.type,
        targetAmount: Number(g.targetAmount),
        horizonYears: Number(g.horizonYears),
      })),
    };

    try {
      const url = userId
        ? `http://localhost:8080/api/public/ai/profile/${userId}`
        : '/api/ai/recommendation';

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (onSuccess) onSuccess(data);
        onClose();
      }
    } catch (err) {
      console.error('Failed to run AI onboarding', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-base/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-bg-surface border border-border-default rounded-[16px] max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="bg-bg-surface-2 px-6 py-4 border-b border-border-default flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent-brass/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent-brass" />
            </div>
            <div>
              <h2 className="text-[16px] font-medium text-text-primary">AI Portfolio Onboarding</h2>
              <p className="text-[11px] text-text-faint">Step {step} of 3 — Profile & Financial Calibration</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-[6px] text-text-faint hover:text-text-primary hover:bg-bg-surface-3 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="h-1 bg-bg-surface-2 w-full flex">
          <div className="h-full bg-accent-brass transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h3 className="text-[14px] font-medium text-text-primary flex items-center gap-2">
                <User className="w-4 h-4 text-accent-brass" /> Demographics & Family Profile
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] text-text-faint block mb-1">Current Age</label>
                  <input type="number" min={18} max={60} value={age} onChange={(e) => setAge(Number(e.target.value))} className="w-full bg-bg-base border border-border-default rounded-[6px] px-3 py-2 text-[13px] font-mono text-text-primary" />
                </div>
                <div>
                  <label className="text-[12px] text-text-faint block mb-1">Target Retirement Age</label>
                  <input type="number" min={age + 1} max={75} value={targetRetirementAge} onChange={(e) => setTargetRetirementAge(Number(e.target.value))} className="w-full bg-bg-base border border-border-default rounded-[6px] px-3 py-2 text-[13px] font-mono text-text-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] text-text-faint block mb-1">Marital Status</label>
                  <select value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} className="w-full bg-bg-base border border-border-default rounded-[6px] px-3 py-2 text-[13px] text-text-primary">
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                  </select>
                </div>
                <div>
                  <label className="text-[12px] text-text-faint block mb-1">Children Count</label>
                  <input type="number" min={0} max={5} value={childrenCount} onChange={(e) => setChildrenCount(Number(e.target.value))} className="w-full bg-bg-base border border-border-default rounded-[6px] px-3 py-2 text-[13px] font-mono text-text-primary" />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input type="checkbox" id="depParents" checked={dependentParents} onChange={(e) => setDependentParents(e.target.checked)} className="accent-[#C9A227] w-4 h-4 rounded" />
                <label htmlFor="depParents" className="text-[13px] text-text-secondary cursor-pointer">Financially dependent parents</label>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h3 className="text-[14px] font-medium text-text-primary flex items-center gap-2">
                <Wallet className="w-4 h-4 text-accent-brass" /> Cash Flow, Tax & Net Worth
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-text-faint block mb-1">Monthly Income (₹)</label>
                  <input type="number" step={5000} value={monthlyIncome} onChange={(e) => setMonthlyIncome(Number(e.target.value))} className="w-full bg-bg-base border border-border-default rounded-[6px] px-3 py-2 text-[13px] font-mono text-text-primary" />
                </div>
                <div>
                  <label className="text-[11px] text-text-faint block mb-1">Monthly Expenses (₹)</label>
                  <input type="number" step={1000} value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(Number(e.target.value))} className="w-full bg-bg-base border border-border-default rounded-[6px] px-3 py-2 text-[13px] font-mono text-text-primary" />
                </div>
                <div>
                  <label className="text-[11px] text-text-faint block mb-1">Monthly EMIs (₹)</label>
                  <input type="number" step={1000} value={monthlyEmis} onChange={(e) => setMonthlyEmis(Number(e.target.value))} className="w-full bg-bg-base border border-border-default rounded-[6px] px-3 py-2 text-[13px] font-mono text-text-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] text-text-faint block mb-1">Income Tax Slab</label>
                  <select value={taxBracketPercent} onChange={(e) => setTaxBracketPercent(Number(e.target.value))} className="w-full bg-bg-base border border-border-default rounded-[6px] px-3 py-2 text-[13px] text-text-primary">
                    <option value={0}>0% Slab</option>
                    <option value={10}>10% Slab</option>
                    <option value={20}>20% Slab</option>
                    <option value={30}>30% Slab (High Tax)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[12px] text-text-faint block mb-1">Total Current Assets (₹)</label>
                  <input type="number" step={50000} value={totalCurrentAssets} onChange={(e) => setTotalCurrentAssets(Number(e.target.value))} className="w-full bg-bg-base border border-border-default rounded-[6px] px-3 py-2 text-[13px] font-mono text-text-primary" />
                </div>
              </div>

              <div className="space-y-2 bg-bg-surface-2 p-3 rounded-[8px] border border-border-default">
                <span className="text-[11px] text-text-faint block">Current Asset Distribution (%)</span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-text-faint block">Equity %</span>
                    <input type="number" value={equityPct} onChange={(e) => setEquityPct(Number(e.target.value))} className="w-full bg-bg-base border border-border-default rounded px-2 py-1 text-[12px] font-mono text-text-primary" />
                  </div>
                  <div>
                    <span className="text-[10px] text-text-faint block">FD/Debt %</span>
                    <input type="number" value={fdDebtPct} onChange={(e) => setFdDebtPct(Number(e.target.value))} className="w-full bg-bg-base border border-border-default rounded px-2 py-1 text-[12px] font-mono text-text-primary" />
                  </div>
                  <div>
                    <span className="text-[10px] text-text-faint block">Gold %</span>
                    <input type="number" value={goldPct} onChange={(e) => setGoldPct(Number(e.target.value))} className="w-full bg-bg-base border border-border-default rounded px-2 py-1 text-[12px] font-mono text-text-primary" />
                  </div>
                  <div>
                    <span className="text-[10px] text-text-faint block">Property %</span>
                    <input type="number" value={realEstatePct} onChange={(e) => setRealEstatePct(Number(e.target.value))} className="w-full bg-bg-base border border-border-default rounded px-2 py-1 text-[12px] font-mono text-text-primary" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="highDebt" checked={hasHighInterestDebt} onChange={(e) => setHasHighInterestDebt(e.target.checked)} className="accent-[#C9A227] w-4 h-4 rounded" />
                  <label htmlFor="highDebt" className="text-[12px] text-text-secondary cursor-pointer">Has 24%+ Credit Card / Personal Debt</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="emFund" checked={hasEmergencyFund} onChange={(e) => setHasEmergencyFund(e.target.checked)} className="accent-[#C9A227] w-4 h-4 rounded" />
                  <label htmlFor="emFund" className="text-[12px] text-text-secondary cursor-pointer">Already has 6-month Emergency Cash</label>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h3 className="text-[14px] font-medium text-text-primary flex items-center gap-2">
                <Target className="w-4 h-4 text-accent-brass" /> Risk Appetite & Financial Goals
              </h3>

              <div>
                <label className="text-[12px] text-text-faint block mb-2">Risk Appetite</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Low', 'Medium', 'High'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRiskAppetite(r)}
                      className={`py-2 px-3 rounded-[8px] border text-[13px] font-medium transition-all ${
                        riskAppetite === r
                          ? 'bg-accent-brass/10 border-accent-brass text-accent-brass'
                          : 'bg-bg-base border-border-default text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {r} Risk
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-text-faint">Life Goals List</span>
                  <button type="button" onClick={handleAddGoal} className="text-[12px] text-accent-brass hover:underline">
                    + Add Goal
                  </button>
                </div>
                {goals.map((g, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-bg-surface-2 p-3 rounded-[8px] border border-border-default">
                    <input type="text" value={g.type} onChange={(e) => handleGoalChange(idx, 'type', e.target.value)} className="bg-bg-base border border-border-default rounded px-2 py-1 text-[12px] text-text-primary flex-1" placeholder="Goal Name" />
                    <input type="number" step={50000} value={g.targetAmount} onChange={(e) => handleGoalChange(idx, 'targetAmount', Number(e.target.value))} className="bg-bg-base border border-border-default rounded px-2 py-1 text-[12px] font-mono text-text-primary w-28" placeholder="Target ₹" />
                    <input type="number" min={1} max={30} value={g.horizonYears} onChange={(e) => handleGoalChange(idx, 'horizonYears', Number(e.target.value))} className="bg-bg-base border border-border-default rounded px-2 py-1 text-[12px] font-mono text-text-primary w-16" placeholder="Years" />
                    {goals.length > 1 && (
                      <button type="button" onClick={() => handleRemoveGoal(idx)} className="text-negative text-[12px] px-1 hover:underline">
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-bg-surface-2 px-6 py-4 border-t border-border-default flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 text-[13px] text-text-secondary hover:text-text-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 bg-accent-brass hover:bg-accent-brass-dim text-bg-base px-4 py-2 rounded-[8px] text-[13px] font-medium transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="flex items-center gap-2 bg-accent-brass hover:bg-accent-brass-dim text-bg-base px-5 py-2 rounded-[8px] text-[13px] font-medium transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isSubmitting ? 'Generating AI Portfolio...' : 'Generate AI Portfolio'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
