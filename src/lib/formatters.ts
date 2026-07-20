/**
 * Ledger AI — Number & Date Formatters
 * Uses Intl.NumberFormat('en-IN') for correct lakh/crore grouping
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const inrCompactFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat('en-IN', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: 'always',
});

export function formatINR(value: number): string {
  return inrFormatter.format(value);
}

export function formatINRCompact(value: number): string {
  // Intl compact uses T/B/M — convert for Indian audience
  if (Math.abs(value) >= 1_00_00_000) {
    return `₹${(value / 1_00_00_000).toFixed(1)}Cr`;
  }
  if (Math.abs(value) >= 1_00_000) {
    return `₹${(value / 1_00_000).toFixed(1)}L`;
  }
  if (Math.abs(value) >= 1_000) {
    return `₹${(value / 1_000).toFixed(1)}K`;
  }
  return formatINR(value);
}

export function formatPercent(value: number): string {
  return percentFormatter.format(value / 100);
}

export function formatPercentRaw(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
