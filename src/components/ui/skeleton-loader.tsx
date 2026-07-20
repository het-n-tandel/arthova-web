import { cn } from '@/lib/formatters';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'table-row' | 'chart';
}

export function Skeleton({ className, variant = 'text' }: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 w-full',
    card: 'h-32 w-full rounded-[12px]',
    'table-row': 'h-[52px] w-full',
    chart: 'h-64 w-full rounded-[12px]',
  };

  return (
    <div
      className={cn('skeleton', variantClasses[variant], className)}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-bg-surface border border-border-default rounded-[12px] p-6 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-5 w-20" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-0">
      <Skeleton variant="table-row" className="bg-bg-surface-2 rounded-t-[12px]" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="table-row" className="border-b border-border-default" />
      ))}
    </div>
  );
}
