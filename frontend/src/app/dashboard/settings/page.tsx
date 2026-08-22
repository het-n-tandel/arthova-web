'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Bell, Link as LinkIcon, Palette, Shield, Sun, Moon } from 'lucide-react';
import { useLedgerStore } from '@/lib/store';
import { cn } from '@/lib/formatters';
import { useSession } from 'next-auth/react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const theme = useLedgerStore((s) => s.theme);
  const toggleTheme = useLedgerStore((s) => s.toggleTheme);
  const [alertThreshold, setAlertThreshold] = useState(5);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [fraudAlerts, setFraudAlerts] = useState(true);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-[28px] text-text-primary mb-1">Settings</h1>
        <p className="text-[13px] text-text-faint">Manage your account, preferences, and linked services</p>
      </div>

      {/* Profile */}
      <section className="bg-bg-surface border border-border-default rounded-[12px] p-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-5 h-5 text-text-faint" />
          <h2 className="text-[16px] font-medium text-text-primary">Profile</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[12px] text-text-faint block mb-1.5">Full Name</label>
            <input type="text" defaultValue={session?.user?.name || "User"} className="w-full bg-bg-surface-2 border border-border-default rounded-[6px] px-3 py-2 text-[14px] text-text-primary focus:outline-none focus:border-accent-brass transition-colors" />
          </div>
          <div>
            <label className="text-[12px] text-text-faint block mb-1.5">Email</label>
            <input type="email" defaultValue={session?.user?.email || "user@example.com"} className="w-full bg-bg-surface-2 border border-border-default rounded-[6px] px-3 py-2 text-[14px] text-text-primary focus:outline-none focus:border-accent-brass transition-colors" />
          </div>
          <div>
            <label className="text-[12px] text-text-faint block mb-1.5">Phone</label>
            <input type="tel" defaultValue="+91 98765 43210" className="w-full bg-bg-surface-2 border border-border-default rounded-[6px] px-3 py-2 text-[14px] text-text-primary focus:outline-none focus:border-accent-brass transition-colors" />
          </div>
          <div>
            <label className="text-[12px] text-text-faint block mb-1.5">PAN</label>
            <input type="text" defaultValue="ABCDE1234F" className="w-full bg-bg-surface-2 border border-border-default rounded-[6px] px-3 py-2 text-[14px] text-text-primary focus:outline-none focus:border-accent-brass transition-colors" style={{ fontFamily: 'IBM Plex Mono, monospace' }} />
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="bg-bg-surface border border-border-default rounded-[12px] p-6">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="w-5 h-5 text-text-faint" />
          <h2 className="text-[16px] font-medium text-text-primary">Appearance</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] text-text-primary">Theme</p>
            <p className="text-[12px] text-text-faint">Switch between dark and light mode</p>
          </div>
          <button
            onClick={toggleTheme}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-[6px] border transition-colors',
              'border-border-default hover:border-border-strong'
            )}
          >
            {theme === 'dark' ? <Moon className="w-4 h-4 text-accent-brass" /> : <Sun className="w-4 h-4 text-accent-brass" />}
            <span className="text-[13px] text-text-primary capitalize">{theme}</span>
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-bg-surface border border-border-default rounded-[12px] p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-text-faint" />
          <h2 className="text-[16px] font-medium text-text-primary">Notifications & Alerts</h2>
        </div>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] text-text-primary">Email Notifications</p>
              <p className="text-[12px] text-text-faint">Daily portfolio summary via email</p>
            </div>
            <button onClick={() => setEmailNotifs(!emailNotifs)} className={cn('w-10 h-6 rounded-full transition-colors relative', emailNotifs ? 'bg-accent-brass' : 'bg-bg-surface-3')}>
              <div className={cn('w-4 h-4 rounded-full bg-white absolute top-1 transition-all', emailNotifs ? 'left-5' : 'left-1')} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] text-text-primary">Push Notifications</p>
              <p className="text-[12px] text-text-faint">Real-time alerts for price movements</p>
            </div>
            <button onClick={() => setPushNotifs(!pushNotifs)} className={cn('w-10 h-6 rounded-full transition-colors relative', pushNotifs ? 'bg-accent-brass' : 'bg-bg-surface-3')}>
              <div className={cn('w-4 h-4 rounded-full bg-white absolute top-1 transition-all', pushNotifs ? 'left-5' : 'left-1')} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] text-text-primary">AI Fraud Alerts</p>
              <p className="text-[12px] text-text-faint">Get notified about unusual market activity</p>
            </div>
            <button onClick={() => setFraudAlerts(!fraudAlerts)} className={cn('w-10 h-6 rounded-full transition-colors relative', fraudAlerts ? 'bg-accent-brass' : 'bg-bg-surface-3')}>
              <div className={cn('w-4 h-4 rounded-full bg-white absolute top-1 transition-all', fraudAlerts ? 'left-5' : 'left-1')} />
            </button>
          </div>
          <div>
            <label className="text-[12px] text-text-faint block mb-2">Price Alert Threshold (%)</label>
            <div className="flex items-center gap-3">
              <input type="range" min="1" max="20" value={alertThreshold} onChange={(e) => setAlertThreshold(Number(e.target.value))} className="flex-1 accent-[#C9A227]" />
              <span className="text-[14px] text-text-primary w-12 text-right" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{alertThreshold}%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Linked Accounts */}
      <section className="bg-bg-surface border border-border-default rounded-[12px] p-6">
        <div className="flex items-center gap-3 mb-4">
          <LinkIcon className="w-5 h-5 text-text-faint" />
          <h2 className="text-[16px] font-medium text-text-primary">Linked Accounts</h2>
        </div>
        <div className="space-y-3">
          {[
            { name: 'Zerodha (Kite)', status: 'connected', dematId: 'ZR1234567890' },
            { name: 'Coin by Zerodha', status: 'connected', dematId: 'Mutual Fund folio' },
            { name: 'Groww', status: 'disconnected', dematId: null },
          ].map((account, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div>
                <p className="text-[14px] text-text-primary">{account.name}</p>
                {account.dematId && <p className="text-[11px] text-text-faint" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{account.dematId}</p>}
              </div>
              <button className={cn(
                'text-[12px] px-3 py-1.5 rounded-[6px] border transition-colors',
                account.status === 'connected'
                  ? 'border-positive text-positive hover:bg-positive-bg'
                  : 'border-border-default text-text-faint hover:border-accent-brass hover:text-accent-brass'
              )}>
                {account.status === 'connected' ? 'Connected' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <button className="bg-accent-brass text-bg-base px-6 py-2.5 rounded-[6px] text-[14px] font-medium hover:brightness-90 transition-all">
          Save Changes
        </button>
      </div>
    </motion.div>
  );
}
