'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Bell, Link as LinkIcon, Palette, Shield, Sun, Moon, Loader2 } from 'lucide-react';
import { useLedgerStore } from '@/lib/store';
import { cn, formatINR } from '@/lib/formatters';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function SettingsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const theme = useLedgerStore((s) => s.theme);
  const toggleTheme = useLedgerStore((s) => s.toggleTheme);
  const addNotification = useLedgerStore((s) => s.addNotification);
  const [alertThreshold, setAlertThreshold] = useState(5);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [fraudAlerts, setFraudAlerts] = useState(true);

  // Demat linking state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState('Zerodha (Kite)');
  const [brokerClientId, setBrokerClientId] = useState('');

  const { data: dematData, isLoading: isLoadingDemat } = useQuery({
    queryKey: ['demat-accounts'],
    queryFn: async () => {
      const res = await fetch('/api/demat');
      if (!res.ok) throw new Error('Failed to fetch demat accounts');
      return res.json();
    },
  });

  const dematAccountsList = dematData?.accounts || [];

  const linkMutation = useMutation({
    mutationFn: async (payload: { brokerName: string; clientId: string }) => {
      const res = await fetch('/api/demat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to link broker');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['demat-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      queryClient.invalidateQueries({ queryKey: ['networth'] });
      setIsConnectModalOpen(false);
      setBrokerClientId('');
      addNotification({
        type: 'positive',
        title: 'Broker Connected & Synced',
        message: `Successfully connected ${selectedBroker}. ${data.syncedHoldings} assets imported into your portfolio.`,
      });
    },
    onError: (err: any) => {
      addNotification({
        type: 'warning',
        title: 'Connection Failed',
        message: err.message || 'Could not link broker account.',
      });
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/demat?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to unlink broker');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demat-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      queryClient.invalidateQueries({ queryKey: ['networth'] });
      addNotification({
        type: 'info',
        title: 'Broker Disconnected',
        message: 'Demat account unlinked and associated assets cleaned up.',
      });
    },
  });

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

      {/* Linked Demat Accounts */}
      <section className="bg-bg-surface border border-border-default rounded-[12px] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <LinkIcon className="w-5 h-5 text-accent-brass" />
            <div>
              <h2 className="text-[16px] font-medium text-text-primary">Linked Broker &amp; Demat Accounts</h2>
              <p className="text-[12px] text-text-faint">Connect your broker to auto-sync stock holdings and mutual fund SIPs</p>
            </div>
          </div>
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="flex items-center gap-1.5 bg-accent-brass/10 hover:bg-accent-brass/20 text-accent-brass border border-accent-brass/30 px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors"
          >
            + Connect Broker
          </button>
        </div>

        {isLoadingDemat ? (
          <div className="flex items-center justify-center py-8 gap-2 text-[13px] text-text-faint">
            <Loader2 className="w-4 h-4 animate-spin text-accent-brass" />
            Loading connected accounts...
          </div>
        ) : dematAccountsList.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border-default rounded-[8px] bg-bg-surface-2/50">
            <p className="text-[13px] text-text-secondary">No Demat accounts linked yet.</p>
            <p className="text-[11px] text-text-faint mt-1">Linking an account automatically imports your stocks, SIPs, and uninvested cash.</p>
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="mt-3 text-accent-brass hover:underline text-[12.5px] font-medium"
            >
              Connect Zerodha, Groww, or Angel One &rarr;
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {dematAccountsList.map((account: any) => (
              <div
                key={account.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-bg-surface-2 rounded-[8px] border border-border-default gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-medium text-text-primary">{account.brokerName}</p>
                    <span className="text-[10px] bg-positive/10 border border-positive/30 text-positive px-2 py-0.5 rounded-full font-mono font-medium">
                      Connected ✓
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-text-faint">
                    <span>Client ID: <strong className="text-text-secondary font-mono">{account.clientId}</strong></span>
                    <span>Synced Assets: <strong className="text-text-secondary">{account.syncedHoldingsCount} items</strong></span>
                    <span>Total Value: <strong className="text-positive font-mono">{formatINR(account.syncedValue || 0)}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => unlinkMutation.mutate(account.id)}
                    disabled={unlinkMutation.isPending}
                    className="text-[12px] px-3 py-1.5 rounded-[6px] border border-negative/30 text-negative hover:bg-negative/10 transition-colors disabled:opacity-50"
                  >
                    {unlinkMutation.isPending ? 'Unlinking...' : 'Disconnect'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Connect Broker Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-bg-surface border border-border-default rounded-[14px] w-full max-w-md p-6 relative shadow-2xl">
            <h3 className="text-[17px] font-medium text-text-primary mb-1">Connect Demat Broker Account</h3>
            <p className="text-[12px] text-text-faint mb-4">
              Select your broker to automatically synchronize your holdings, active SIPs, and uninvested funds.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[12px] text-text-faint block mb-1.5">Select Broker</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Zerodha (Kite)', 'Groww', 'Angel One', 'Upstox'].map((broker) => (
                    <button
                      key={broker}
                      type="button"
                      onClick={() => setSelectedBroker(broker)}
                      className={cn(
                        'p-2.5 rounded-[8px] text-left border text-[13px] font-medium transition-all',
                        selectedBroker === broker
                          ? 'border-accent-brass bg-accent-brass/10 text-accent-brass'
                          : 'border-border-default hover:border-border-strong text-text-secondary'
                      )}
                    >
                      {broker}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[12px] text-text-faint block mb-1.5">Client ID / Demat User ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. ZR982143 (leave blank to auto-generate)"
                  value={brokerClientId}
                  onChange={(e) => setBrokerClientId(e.target.value)}
                  className="w-full bg-bg-surface-2 border border-border-default rounded-[6px] px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-accent-brass transition-colors font-mono"
                />
              </div>

              <div className="p-3 bg-bg-surface-2 rounded-[8px] text-[11.5px] text-text-faint space-y-1">
                <span className="font-medium text-text-secondary block">What will be synced:</span>
                <p>• Equities &amp; Stocks held in your Demat account</p>
                <p>• Active Mutual Fund SIPs with NAV and folio numbers</p>
                <p>• Uninvested trading cash balance</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(false)}
                  className="flex-1 py-2 rounded-[8px] border border-border-default text-[13px] text-text-secondary hover:bg-bg-surface-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => linkMutation.mutate({ brokerName: selectedBroker, clientId: brokerClientId })}
                  disabled={linkMutation.isPending}
                  className="flex-1 bg-accent-brass hover:bg-accent-brass-dim text-bg-base font-medium py-2 rounded-[8px] text-[13px] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {linkMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Syncing Holdings...
                    </>
                  ) : (
                    'Authorize & Sync'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Profile Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            addNotification({
              type: 'positive',
              title: 'Settings Saved',
              message: 'Your profile and alert preferences have been updated successfully.',
            });
          }}
          className="bg-accent-brass text-bg-base px-6 py-2.5 rounded-[6px] text-[14px] font-medium hover:brightness-90 transition-all"
        >
          Save Changes
        </button>
      </div>
    </motion.div>
  );
}
