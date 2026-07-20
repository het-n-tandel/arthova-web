'use client';

import { useMemo } from 'react';
import {
  stockHoldings,
  mutualFunds,
  goldSilverHoldings,
  fixedDeposits,
  properties,
  getStockPortfolioValue,
  getMFPortfolioValue,
  getGoldSilverValue,
  getFDValue,
  getPropertyValue,
} from '@/lib/mock-data';
import { useLedgerStore } from '@/lib/store';

export interface AssetAllocation {
  name: string;
  invested: number;
  current: number;
  gain: number;
  gainPercent: number;
  allocation: number; // percentage of total
}

export interface PortfolioSummary {
  totalInvested: number;
  totalCurrent: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
  assets: AssetAllocation[];
}

export function usePortfolio(): PortfolioSummary {
  const livePrices = useLedgerStore((s) => s.livePrices);

  return useMemo(() => {
    // Compute stock values with live price overrides
    const updatedStocks = stockHoldings.map((stock) => {
      const live = livePrices.get(stock.symbol);
      return live ? { ...stock, cmp: live.price } : stock;
    });

    const stockVal = getStockPortfolioValue(updatedStocks);
    const mfVal = getMFPortfolioValue(mutualFunds);
    const goldVal = getGoldSilverValue(goldSilverHoldings);
    const fdVal = getFDValue(fixedDeposits);
    const propVal = getPropertyValue(properties);

    const totalInvested = stockVal.invested + mfVal.invested + goldVal.invested + fdVal.invested + propVal.invested;
    const totalCurrent = stockVal.current + mfVal.current + goldVal.current + fdVal.current + propVal.current;
    const totalGain = totalCurrent - totalInvested;
    const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

    // Simulated day change
    const dayChange = updatedStocks.reduce((sum, s) => sum + s.dayChange * s.quantity, 0);
    const dayChangePercent = totalCurrent > 0 ? (dayChange / totalCurrent) * 100 : 0;

    const assets: AssetAllocation[] = [
      { name: 'Stocks', ...makeAllocation(stockVal, totalCurrent) },
      { name: 'Mutual Funds', ...makeAllocation(mfVal, totalCurrent) },
      { name: 'Gold & Silver', ...makeAllocation(goldVal, totalCurrent) },
      { name: 'Fixed Deposits', ...makeAllocation(fdVal, totalCurrent) },
      { name: 'Property', ...makeAllocation(propVal, totalCurrent) },
    ];

    return {
      totalInvested,
      totalCurrent,
      totalGain,
      totalGainPercent,
      dayChange,
      dayChangePercent,
      assets,
    };
  }, [livePrices]);
}

function makeAllocation(val: { invested: number; current: number }, total: number) {
  const gain = val.current - val.invested;
  return {
    invested: val.invested,
    current: val.current,
    gain,
    gainPercent: val.invested > 0 ? (gain / val.invested) * 100 : 0,
    allocation: total > 0 ? (val.current / total) * 100 : 0,
  };
}
