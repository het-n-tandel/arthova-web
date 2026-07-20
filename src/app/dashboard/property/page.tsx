'use client';

import { motion } from 'framer-motion';
import { Building2, MapPin, Home, IndianRupee } from 'lucide-react';
import { properties } from '@/lib/mock-data';
import { formatINR, formatINRCompact, formatDate, cn } from '@/lib/formatters';
import { SummaryCard } from '@/components/ui/summary-card';
import { DeltaBadge } from '@/components/ui/delta-badge';

export default function PropertyPage() {
  const totalAcquisition = properties.reduce((s, p) => s + p.acquisitionCost, 0);
  const totalCurrent = properties.reduce((s, p) => s + p.currentValue, 0);
  const totalGain = totalCurrent - totalAcquisition;
  const totalGainPercent = (totalGain / totalAcquisition) * 100;
  const totalRental = properties.reduce((s, p) => s + (p.rentalIncome || 0), 0);
  const totalLoan = properties.reduce((s, p) => s + (p.loanOutstanding || 0), 0);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
      <div>
        <h1 className="font-display text-[28px] text-text-primary mb-1">Property</h1>
        <p className="text-[13px] text-text-faint">Real estate investments and valuations</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Portfolio Value" value={formatINRCompact(totalCurrent)} delta={totalGainPercent} icon={<Building2 className="w-4 h-4" />} />
        <SummaryCard label="Total Appreciation" value={formatINR(totalGain)} delta={totalGainPercent} />
        <SummaryCard label="Rental Income" value={formatINR(totalRental)} sublabel="per month" />
        <SummaryCard label="Loan Outstanding" value={formatINRCompact(totalLoan)} sublabel={totalLoan > 0 ? 'active EMI' : 'no loans'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((prop) => {
          const appreciation = ((prop.currentValue - prop.acquisitionCost) / prop.acquisitionCost) * 100;
          const rentalYield = prop.rentalIncome ? (prop.rentalIncome * 12) / prop.currentValue * 100 : 0;

          return (
            <motion.div
              key={prop.id}
              whileHover={{ y: -2, borderColor: 'var(--border-strong)' }}
              transition={{ duration: 0.18 }}
              className="bg-bg-surface border border-border-default rounded-[12px] overflow-hidden"
            >
              {/* Property header with gradient */}
              <div className="bg-bg-surface-2 px-5 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[16px] font-medium text-text-primary">{prop.name}</h3>
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
                  <span className="text-[11px] text-text-faint">since {formatDate(prop.acquisitionDate)}</span>
                </div>

                <div className="border-t border-border-default pt-3 grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-text-faint uppercase tracking-wider block">Area</span>
                    <span className="text-[13px] text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{prop.area.toLocaleString()} sq ft</span>
                  </div>
                  {prop.rentalIncome && (
                    <div>
                      <span className="text-[10px] text-text-faint uppercase tracking-wider block">Rental</span>
                      <span className="text-[13px] text-positive" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINR(prop.rentalIncome)}/mo</span>
                    </div>
                  )}
                  {rentalYield > 0 && (
                    <div>
                      <span className="text-[10px] text-text-faint uppercase tracking-wider block">Yield</span>
                      <span className="text-[13px] text-accent-brass" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{rentalYield.toFixed(1)}%</span>
                    </div>
                  )}
                  {prop.loanOutstanding && (
                    <div>
                      <span className="text-[10px] text-text-faint uppercase tracking-wider block">Loan</span>
                      <span className="text-[13px] text-negative" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>{formatINRCompact(prop.loanOutstanding)}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
