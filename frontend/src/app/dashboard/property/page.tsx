'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, MapPin, Home, IndianRupee, Plus } from 'lucide-react';
import { formatINR, formatINRCompact, formatDate, cn } from '@/lib/formatters';
import { SummaryCard } from '@/components/ui/summary-card';
import { DeltaBadge } from '@/components/ui/delta-badge';
import { usePortfolio } from '@/lib/hooks/use-portfolio';
import { AssetActionModal } from '@/components/ui/asset-action-modal';

export default function PropertyPage() {
  const { propHoldings, assets } = usePortfolio();
  const [isTradeOpen, setIsTradeOpen] = useState(false);

  const stats = assets.find(a => a.name === 'Property') || { invested: 0, current: 0, gain: 0, gainPercent: 0 };
  
  // Enrich DB property records with metadata stored in the DB
  const enrichedProperties = propHoldings.map((h) => {
      const meta: any = h.metadata && typeof h.metadata === 'object'
        ? h.metadata
        : (() => { try { return JSON.parse(h.metadata || '{}'); } catch { return {}; } })();

      const acquisitionCost = (parseFloat(h.quantity) || 0) * (parseFloat(h.avgCost) || 1);
      const currentValue = (parseFloat(h.quantity) || 0) * (parseFloat(h.cmp) || parseFloat(h.avgCost) || 1);
      const monthlyRent = parseFloat(meta.monthlyRent || '0');
      const location = meta.location || 'Local';
      
      return {
          ...h,
          acquisitionCost,
          currentValue,
          rentalIncome: monthlyRent,
          loanOutstanding: 0,
          location: location,
          city: '',
          type: 'Real Estate',
          area: parseFloat(h.quantity) > 1 ? parseFloat(h.quantity) : 1000
      }
  });

  const totalAcquisition = enrichedProperties.reduce((s, p) => s + p.acquisitionCost, 0);
  const totalCurrent = enrichedProperties.reduce((s, p) => s + p.currentValue, 0);
  const totalGain = totalCurrent - totalAcquisition;
  const totalGainPercent = totalAcquisition > 0 ? (totalGain / totalAcquisition) * 100 : 0;
  const totalRental = enrichedProperties.reduce((s, p) => s + (p.rentalIncome || 0), 0);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-[28px] text-text-primary mb-1">Property</h1>
          <p className="text-[13px] text-text-faint">Real estate investments and valuations</p>
        </div>
        <button onClick={() => setIsTradeOpen(true)} className="flex items-center gap-2 bg-accent-brass hover:bg-accent-brass-dim text-bg-base px-4 py-2 rounded-[8px] font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Add Property
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Portfolio Value" value={formatINRCompact(totalCurrent)} delta={totalGainPercent} icon={<Building2 className="w-4 h-4" />} />
        <SummaryCard label="Total Appreciation" value={formatINR(totalGain)} delta={totalGainPercent} />
        <SummaryCard label="Est. Rental Income" value={formatINR(totalRental)} sublabel="per month" />
        <SummaryCard label="Active Properties" value={`${enrichedProperties.length}`} sublabel="tracked" />
      </div>

      {enrichedProperties.length === 0 && (
          <div className="text-center py-16 bg-bg-surface border border-border-default rounded-[12px]">
              <p className="text-[14px] text-text-secondary">No properties found.</p>
              <p className="text-[13px] text-text-faint mt-1">Click "Add Property" to track your real estate.</p>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrichedProperties.map((prop) => {
          const appreciation = prop.acquisitionCost > 0 ? ((prop.currentValue - prop.acquisitionCost) / prop.acquisitionCost) * 100 : 0;
          const rentalYield = prop.rentalIncome ? (prop.rentalIncome * 12) / prop.currentValue * 100 : 0;

          return (
            <motion.div
              key={prop.id}
              whileHover={{ y: -2, borderColor: 'var(--border-strong)' }}
              transition={{ duration: 0.18 }}
              className="bg-bg-surface border border-border-default rounded-[12px] overflow-hidden"
            >
              <div className="bg-bg-surface-2 px-5 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[16px] font-medium text-text-primary truncate max-w-[200px]" title={prop.name}>{prop.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-text-faint" />
                      <span className="text-[12px] text-text-faint">{prop.location}, {prop.city}</span>
                    </div>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-info-indigo-bg text-info-indigo">{prop.type}</span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-eyebrow">Current Value</span>
                    <p className="text-[20px] font-medium text-text-primary mt-1" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINRCompact(prop.currentValue)}</p>
                  </div>
                  <div>
                    <span className="text-eyebrow">Acquisition</span>
                    <p className="text-[14px] text-text-secondary mt-1" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINRCompact(prop.acquisitionCost)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DeltaBadge value={appreciation} size="md" />
                  <span className="text-[11px] text-text-faint">Appreciation</span>
                </div>

                <div className="border-t border-border-default pt-3 grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-text-faint uppercase tracking-wider block">Qty / Area</span>
                    <span className="text-[13px] text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{prop.area.toLocaleString()}</span>
                  </div>
                  {prop.rentalIncome > 0 && (
                    <div>
                      <span className="text-[10px] text-text-faint uppercase tracking-wider block">Est. Rental</span>
                      <span className="text-[13px] text-positive" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(prop.rentalIncome)}/mo</span>
                    </div>
                  )}
                  {rentalYield > 0 && (
                    <div>
                      <span className="text-[10px] text-text-faint uppercase tracking-wider block">Yield</span>
                      <span className="text-[13px] text-accent-brass" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{rentalYield.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <AnimatePresence>
        {isTradeOpen && <AssetActionModal assetType="property" mode="add" onClose={() => setIsTradeOpen(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
