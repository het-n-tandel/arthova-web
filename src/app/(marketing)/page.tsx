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
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-32">
      <div className="text-center max-w-3xl mx-auto mb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-brass/10 text-accent-brass text-[13px] font-medium border border-accent-brass/20 mb-6">
            <ShieldCheck className="w-4 h-4" /> Neon PostgreSQL Secured
          </span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display text-[48px] lg:text-[72px] leading-[1.05] font-medium tracking-tight mb-8"
        >
          A private banking terminal for the modern retail investor.
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="text-[18px] text-text-secondary leading-relaxed mb-10"
        >
          Unify your stocks, mutual funds, gold, fixed deposits, and property in one pristine, AI-powered dashboard.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register" className="flex items-center justify-center w-full sm:w-auto gap-2 bg-accent-brass hover:bg-accent-brass-dim text-bg-base px-8 py-4 rounded-[12px] font-medium transition-colors text-[16px]">
            Open an Account <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/login" className="flex items-center justify-center w-full sm:w-auto gap-2 bg-bg-surface-2 hover:bg-bg-surface-3 border border-border-default text-text-primary px-8 py-4 rounded-[12px] font-medium transition-colors text-[16px]">
            Login via Demat
          </Link>
        </motion.div>
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
