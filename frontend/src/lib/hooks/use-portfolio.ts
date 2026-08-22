'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
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
  isLoading: boolean;
  totalInvested: number;
  totalCurrent: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
  netWorth: number;
  assets: AssetAllocation[];
  rawHoldings: any[]; // The DB holdings
  stockHoldings: any[];
  mfHoldings: any[];
  goldHoldings: any[];
  fdHoldings: any[];
  propHoldings: any[];
  cryptoHoldings: any[];
  cashHoldings: any[];
  bondHoldings: any[];
  liabilityHoldings: any[];
}

/** Safely parse metadata which may come from DB as object or JSON string */
function parseMeta(raw: any): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch { return {}; }
}

export function usePortfolio(): PortfolioSummary {
  const { data: session } = useSession();
  const livePrices = useLedgerStore((s) => s.livePrices);

  const { data: holdings = [], isLoading } = useQuery({
    queryKey: ['holdings', session?.user?.id],
    queryFn: async () => {
      const userId = session?.user?.id;
      if (!userId) return [];
      const res = await fetch(`http://localhost:8080/api/public/portfolio/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch holdings');
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  return useMemo(() => {
    let stockVal = { invested: 0, current: 0 };
    let mfVal    = { invested: 0, current: 0 };
    let goldVal  = { invested: 0, current: 0 };
    let fdVal    = { invested: 0, current: 0 };
    let propVal  = { invested: 0, current: 0 };
    let cryptoVal = { invested: 0, current: 0 };
    let cashVal  = { invested: 0, current: 0 };
    let bondVal  = { invested: 0, current: 0 };
    let liabilityVal = { invested: 0, current: 0 };
    let dayChange = 0;

    const now = Date.now();

    // Live metal prices
    const inrRate       = livePrices.get('INR=X')?.price     || 83.50;
    const rawGoldUSD    = livePrices.get('GC=F')?.price      || 2400;
    const rawSilverUSD  = livePrices.get('SI=F')?.price      || 30;
    const liveGoldINR   = (rawGoldUSD   * inrRate) / 31.1034768;
    const liveSilverINR = (rawSilverUSD * inrRate) / 31.1034768;

    holdings.forEach((h: any) => {
      const qty     = parseFloat(h.quantity);
      if (qty <= 0) return;

      const avgCost = parseFloat(h.avgCost);
      const meta    = parseMeta(h.metadata);

      // Prefer user-supplied purchaseDate over system createdAt
      const purchaseTs    = new Date(h.purchaseDate || h.createdAt || Date.now()).getTime();
      const monthsElapsed = Math.max(0, Math.floor((now - purchaseTs) / (1000 * 60 * 60 * 24 * 30)));
      const yearsElapsed  = Math.max(0, (now - purchaseTs) / (1000 * 60 * 60 * 24 * 365));

      let invested = qty * avgCost;
      let current  = invested; // default: cost = current (no live price)

      // ── Asset-class specific logic ─────────────────────────────────────
      if (h.assetType === 'cash') {
        if (meta.type === 'income') {
          const monthly = parseFloat(meta.amount || qty.toString());
          const total   = monthly * (monthsElapsed + 1);
          invested = total;
          current  = total;
        } else {
          // Locker
          const amount = parseFloat(meta.amount || qty.toString());
          invested = amount;
          current  = amount;
        }
        cashVal.invested += invested;
        cashVal.current  += current;

      } else if (h.assetType === 'liability') {
        // qty = loanAmount, avgCost = 1 → invested = loanAmount
        const loanAmount = qty * avgCost; // qty * 1 = qty
        const emi        = parseFloat(meta.emi || '0');
        const totalPaid  = emi * (monthsElapsed + 1);
        const remaining  = Math.max(0, loanAmount - totalPaid);

        invested = loanAmount;
        current  = remaining;
        liabilityVal.invested += loanAmount;
        liabilityVal.current  += remaining;

      } else if (h.assetType === 'stock') {
        const live = livePrices.get(h.symbol);
        current = qty * (live ? live.price : avgCost);
        stockVal.invested += invested;
        stockVal.current  += current;
        if (live?.change) dayChange += live.change * qty;

      } else if (h.assetType === 'crypto') {
        const live = livePrices.get(h.symbol);
        current = qty * (live ? live.price : avgCost);
        cryptoVal.invested += invested;
        cryptoVal.current  += current;
        if (live?.change) dayChange += live.change * qty;

      } else if (h.assetType === 'mutual_fund') {
        const live = livePrices.get(h.symbol);
        current = qty * (live ? live.price : avgCost);
        mfVal.invested += invested;
        mfVal.current  += current;

      } else if (h.assetType === 'bond') {
        // Bonds accrue coupon interest over holding period
        const couponRate   = parseFloat(meta.couponRate || '0') / 100;
        const faceValue    = qty * avgCost;
        const couponEarned = faceValue * couponRate * yearsElapsed;
        current  = faceValue + couponEarned;
        invested = faceValue;
        bondVal.invested += invested;
        bondVal.current  += current;

      } else if (h.assetType === 'gold' || h.assetType === 'silver') {
        const metalPrice = h.assetType === 'gold' ? liveGoldINR : liveSilverINR;
        current  = qty * metalPrice;
        goldVal.invested += invested;
        goldVal.current  += current;

      } else if (h.assetType === 'fd') {
        // FD accrues simple interest daily from purchaseDate
        const principal  = qty * avgCost;
        const rate       = parseFloat(meta.interestRate || '0') / 100;
        const tenureMonths = parseInt(meta.tenureMonths || '12');
        // Interest accrued so far (capped at full tenure)
        const elapsedMonths = Math.min(monthsElapsed, tenureMonths);
        const interest = principal * rate * (elapsedMonths / 12);
        invested = principal;
        current  = principal + interest;
        fdVal.invested += invested;
        fdVal.current  += current;

      } else if (h.assetType === 'property') {
        // Property can earn rental income — current = purchase price + total rental received
        const purchaseValue = qty * avgCost;
        const monthlyRent   = parseFloat(meta.monthlyRent || '0');
        const rentalIncome  = monthlyRent * monthsElapsed;
        invested = purchaseValue;
        current  = purchaseValue + rentalIncome;
        propVal.invested += invested;
        propVal.current  += current;
      }
    });

    const totalInvested = stockVal.invested + mfVal.invested + goldVal.invested + fdVal.invested + propVal.invested + cryptoVal.invested + cashVal.invested + bondVal.invested;
    const totalCurrent  = stockVal.current  + mfVal.current  + goldVal.current  + fdVal.current  + propVal.current  + cryptoVal.current  + cashVal.current  + bondVal.current;

    // Net worth subtracts remaining liabilities
    const netWorth = totalCurrent - liabilityVal.current;

    const totalGain        = totalCurrent - totalInvested;
    const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
    const dayChangePercent = totalCurrent  > 0 ? (dayChange  / totalCurrent)  * 100 : 0;

    const assets: AssetAllocation[] = [
      { name: 'Stocks',        ...makeAllocation(stockVal,  totalCurrent) },
      { name: 'Mutual Funds',  ...makeAllocation(mfVal,     totalCurrent) },
      { name: 'Gold & Silver', ...makeAllocation(goldVal,   totalCurrent) },
      { name: 'Fixed Deposits',...makeAllocation(fdVal,     totalCurrent) },
      { name: 'Property',      ...makeAllocation(propVal,   totalCurrent) },
      { name: 'Crypto',        ...makeAllocation(cryptoVal, totalCurrent) },
      { name: 'Cash',          ...makeAllocation(cashVal,   totalCurrent) },
      { name: 'Bonds',         ...makeAllocation(bondVal,   totalCurrent) },
    ].filter(a => a.current > 0 || a.invested > 0);

    // ── Holding mappers ───────────────────────────────────────────────────

    /** Attach time-based metrics (holding period, LTCG flag, CAGR) */
    const enrichDates = (h: any, livePrice?: number) => {
      const avgCostN   = parseFloat(h.avgCost);
      const purchaseTs = new Date(h.purchaseDate || h.createdAt || Date.now()).getTime();
      const holdingMonths = Math.max(0, Math.floor((Date.now() - purchaseTs) / (1000 * 60 * 60 * 24 * 30)));
      const holdingYears  = Math.max(0, (Date.now() - purchaseTs) / (1000 * 60 * 60 * 24 * 365));

      // Indian LTCG holding period thresholds
      let ltcgMonths = 12; // stocks, MF, crypto, bonds
      if (h.assetType === 'property')                           ltcgMonths = 24;
      if (h.assetType === 'gold' || h.assetType === 'silver')  ltcgMonths = 36;
      if (h.assetType === 'fd'   || h.assetType === 'bond')    ltcgMonths = 0; // not equity — no LTCG concept in same way

      const isLTCG = ltcgMonths > 0 && holdingMonths >= ltcgMonths;
      const price  = livePrice ?? (livePrices.get(h.symbol)?.price ?? avgCostN);
      const gain   = avgCostN > 0 ? ((price - avgCostN) / avgCostN) * 100 : 0;
      const cagr   = holdingYears > 0.01 && avgCostN > 0
        ? (Math.pow(price / avgCostN, 1 / holdingYears) - 1) * 100
        : gain;

      return { holdingMonths, holdingYears, isLTCG, cagr, purchaseTs };
    };

    // Live-priced assets: stocks, MF, crypto, bonds
    const mapLive = (assetType: string) => holdings
      .filter((h: any) => h.assetType === assetType && parseFloat(h.quantity) > 0)
      .map((h: any) => {
        const live  = livePrices.get(h.symbol);
        const cmp   = live?.price ?? parseFloat(h.avgCost);
        return {
          ...h,
          metadata: parseMeta(h.metadata),
          avgCost:  parseFloat(h.avgCost),
          quantity: parseFloat(h.quantity),
          cmp,
          dayChange:        live?.change        ?? 0,
          dayChangePercent: live?.changePercent ?? 0,
          ...enrichDates(h, cmp),
        };
      });

    // Fixed-price assets: FD, property
    const mapFixed = (assetType: string) => holdings
      .filter((h: any) => h.assetType === assetType && parseFloat(h.quantity) > 0)
      .map((h: any) => {
        const meta      = parseMeta(h.metadata);
        const avgCostN  = parseFloat(h.avgCost);
        const qtyN      = parseFloat(h.quantity);
        const principal = qtyN * avgCostN;

        const purchaseTs     = new Date(h.purchaseDate || h.createdAt || Date.now()).getTime();
        const monthsElapsedN = Math.max(0, Math.floor((Date.now() - purchaseTs) / (1000 * 60 * 60 * 24 * 30)));
        const yearsElapsedN  = Math.max(0, (Date.now() - purchaseTs) / (1000 * 60 * 60 * 24 * 365));

        let computedCurrent = principal;

        if (assetType === 'fd') {
          const rate          = parseFloat(meta.interestRate || '0') / 100;
          const tenureMonths  = parseInt(meta.tenureMonths || '12');
          const elapsed       = Math.min(monthsElapsedN, tenureMonths);
          computedCurrent     = principal + principal * rate * (elapsed / 12);
        } else if (assetType === 'property') {
          const monthlyRent  = parseFloat(meta.monthlyRent || '0');
          computedCurrent    = principal + monthlyRent * monthsElapsedN;
        }

        return {
          ...h,
          metadata: meta,
          avgCost:  avgCostN,
          quantity: qtyN,
          cmp:      avgCostN,
          computedCurrent,
          monthsElapsed: monthsElapsedN,
          yearsElapsed:  yearsElapsedN,
          ...enrichDates(h, avgCostN),
        };
      });

    // Metal assets: gold, silver — live INR price per gram
    const mapMetal = (assetType: string) => holdings
      .filter((h: any) => h.assetType === assetType && parseFloat(h.quantity) > 0)
      .map((h: any) => {
        const metalPrice = assetType === 'gold' ? liveGoldINR : liveSilverINR;
        return {
          ...h,
          metadata: parseMeta(h.metadata),
          avgCost:  parseFloat(h.avgCost),
          quantity: parseFloat(h.quantity),
          cmp:      metalPrice,
          dayChange: 0,
          dayChangePercent: 0,
          ...enrichDates(h, metalPrice),
        };
      });

    // Cash & Liability
    const mapCashLiability = (assetType: string) => holdings
      .filter((h: any) => h.assetType === assetType && parseFloat(h.quantity) > 0)
      .map((h: any) => {
        const meta       = parseMeta(h.metadata);
        const qtyN       = parseFloat(h.quantity);
        const avgCostN   = parseFloat(h.avgCost);
        const purchaseTs = new Date(h.purchaseDate || h.createdAt || Date.now()).getTime();
        const mElapsed   = Math.max(0, Math.floor((Date.now() - purchaseTs) / (1000 * 60 * 60 * 24 * 30)));

        let computedValue = qtyN * avgCostN;

        if (assetType === 'cash') {
          if (meta.type === 'income') {
            computedValue = parseFloat(meta.amount || '0') * (mElapsed + 1);
          } else {
            computedValue = parseFloat(meta.amount || qtyN.toString());
          }
        } else if (assetType === 'liability') {
          const emi  = parseFloat(meta.emi || '0');
          const loan = qtyN * avgCostN;
          computedValue = Math.max(0, loan - emi * (mElapsed + 1));
        }

        return {
          ...h,
          metadata: meta,
          avgCost:  avgCostN,
          quantity: qtyN,
          cmp:      computedValue,
          computedValue,
          monthsElapsed: mElapsed,
        };
      });

    return {
      isLoading,
      totalInvested,
      totalCurrent,
      totalGain,
      totalGainPercent,
      dayChange,
      dayChangePercent,
      netWorth,
      assets,
      rawHoldings:      holdings,
      stockHoldings:    mapLive('stock'),
      mfHoldings:       mapLive('mutual_fund'),
      goldHoldings:     mapMetal('gold').concat(mapMetal('silver')),
      cryptoHoldings:   mapLive('crypto'),
      bondHoldings:     mapLive('bond'),
      fdHoldings:       mapFixed('fd'),
      propHoldings:     mapFixed('property'),
      cashHoldings:     mapCashLiability('cash'),
      liabilityHoldings:mapCashLiability('liability'),
    };
  }, [holdings, livePrices, isLoading]);
}

function makeAllocation(val: { invested: number; current: number }, total: number) {
  const gain = val.current - val.invested;
  return {
    invested: val.invested,
    current:  val.current,
    gain,
    gainPercent: val.invested > 0 ? (gain / val.invested) * 100 : 0,
    allocation:  total > 0 ? (val.current / total) * 100 : 0,
  };
}
