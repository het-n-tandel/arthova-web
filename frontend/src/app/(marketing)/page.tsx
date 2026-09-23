'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrendingUp, Landmark, Building2, Coins, ArrowRight, ShieldCheck } from 'lucide-react';

const categories = [
  {
    title: 'Equities & Derivatives',
    desc: 'Real-time NSE/BSE pricing, AI-driven technicals, and sector allocation.',
    icon: TrendingUp,
    color: 'var(--positive)',
    bg: 'var(--positive-bg)'
  },
  {
    title: 'Mutual Funds & SIPs',
    desc: 'XIRR tracking, automated SIP mapping, and fund overlap analysis.',
    icon: Landmark,
    color: 'var(--accent-brass)',
    bg: 'var(--bg-surface-3)'
  },
  {
    title: 'Real Estate',
    desc: 'Property valuation, rental yield tracking, and capital gains reporting.',
    icon: Building2,
    color: 'var(--info-indigo)',
    bg: 'var(--info-indigo-bg)'
  },
  {
    title: 'Gold & Silver',
    desc: 'Live MCX tracking for 24K and 22K commodities in your vault.',
    icon: Coins,
    color: 'var(--warning)',
    bg: 'var(--warning-bg)'
  }
];

export default function LandingPage() {
  return (
    <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-32 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-sky-500/10 blur-[130px] pointer-events-none rounded-full" />

      <div className="text-center max-w-4xl mx-auto mb-24 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[13px] font-medium border border-emerald-500/25 mb-6 shadow-sm">
            <ShieldCheck className="w-4 h-4" /> SEBI Compliant Multi-Asset Private Banking
          </span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display text-[48px] lg:text-[76px] leading-[1.04] font-bold tracking-tight mb-8 text-text-primary"
        >
          A private banking terminal for the modern <span className="text-gradient-emerald">retail investor.</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="text-[19px] text-text-secondary leading-relaxed mb-10 max-w-2xl mx-auto"
        >
          Unify your stocks, mutual funds, gold, fixed deposits, and real estate in one pristine, AI-powered wealth workstation.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register" className="flex items-center justify-center w-full sm:w-auto gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold px-8 py-4 rounded-xl transition-all text-[16px] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40">
            Open an Account <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/login" className="flex items-center justify-center w-full sm:w-auto gap-2 glass-card hover:border-accent-brass/40 text-text-primary px-8 py-4 rounded-xl font-medium transition-all text-[16px] shadow-sm">
            Login via Demat
          </Link>
        </motion.div>
      </div>

      <div className="mt-20 mb-32 relative">
        <div className="absolute inset-0 bg-accent-brass/5 rounded-[24px] -z-10" />
        <div className="border border-border-default bg-bg-surface p-8 lg:p-12 rounded-[24px]">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <h2 className="font-display text-[32px] lg:text-[40px] text-text-primary leading-tight">
                Stocks vs Mutual Funds
              </h2>
              <p className="text-[16px] text-text-secondary leading-relaxed">
                Not sure where to deploy your capital? Compare historical returns, risk profiles, and compounding effects instantly. See which asset class aligns with your financial goals before making a move.
              </p>
              
              <div className="grid grid-cols-2 gap-6 mt-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-accent-brass font-medium">
                    <TrendingUp className="w-5 h-5" /> Direct Equities
                  </div>
                  <p className="text-[13px] text-text-faint">High Risk • Active Management • High Potential Alpha</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-info-indigo font-medium">
                    <Landmark className="w-5 h-5" /> Mutual Funds
                  </div>
                  <p className="text-[13px] text-text-faint">Moderate Risk • Passive/Active • Diversified</p>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full bg-bg-base border border-border-default rounded-[16px] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-medium text-text-primary text-[15px]">5-Year Growth Comparison</h3>
                <span className="text-[12px] text-text-faint bg-bg-surface px-2 py-1 rounded">₹1,00,000 Invested</span>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[14px] text-text-primary">Nifty 50 Index Fund</span>
                    <span className="text-[14px] font-medium text-info-indigo font-mono">₹1,85,400</span>
                  </div>
                  <div className="h-2 w-full bg-bg-surface-2 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: '65%' }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full bg-info-indigo" />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[11px] text-text-faint">13.1% CAGR</span>
                    <span className="text-[11px] text-positive">+85.4%</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[14px] text-text-primary">Reliance Industries (Stock)</span>
                    <span className="text-[14px] font-medium text-accent-brass font-mono">₹2,42,100</span>
                  </div>
                  <div className="h-2 w-full bg-bg-surface-2 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: '85%' }} transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }} className="h-full bg-accent-brass" />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[11px] text-text-faint">19.3% CAGR</span>
                    <span className="text-[11px] text-positive">+142.1%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((cat, i) => (
          <motion.div 
            key={cat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 + (i * 0.1) }}
            className="bg-bg-surface border border-border-default p-8 rounded-[16px] hover:border-border-strong transition-colors"
          >
            <div className="w-12 h-12 rounded-[12px] flex items-center justify-center mb-6" style={{ backgroundColor: cat.bg, color: cat.color }}>
              <cat.icon className="w-6 h-6" />
            </div>
            <h3 className="font-display text-[24px] text-text-primary mb-3">{cat.title}</h3>
            <p className="text-text-secondary text-[15px] leading-relaxed">{cat.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
