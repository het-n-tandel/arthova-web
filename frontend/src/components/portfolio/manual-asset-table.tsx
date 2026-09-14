'use client';

import { useState } from 'react';
import { formatINR, cn, formatDate } from '@/lib/formatters';
import { Trash2, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface ManualAsset {
  id: string;
  name: string;
  symbol: string;
  quantity: number;
  avgCost: number;
  cmp: number;
  computedValue?: number;
  assetType: string;
  metadata: any;
  createdAt: string;
}

interface ManualAssetTableProps {
  data: ManualAsset[];
  className?: string;
  type: 'cash' | 'liability' | 'fd' | 'property';
}

export function ManualAssetTable({ data, className, type }: ManualAssetTableProps) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (holdingId: string, name: string) => {
    if (!window.confirm(`Permanently delete "${name}"? This action cannot be undone.`)) return;
    setDeletingId(holdingId);
    try {
      const res = await fetch(`/api/holdings/${holdingId}`, { method: 'DELETE' });
      if (res.ok) {
        await queryClient.invalidateQueries();
      } else {
        const errMsg = await res.text();
        alert(errMsg || 'Failed to delete holding');
      }
    } catch (err) {
      console.error('Failed to delete holding:', err);
      alert('Network error while deleting holding');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={cn('overflow-x-auto rounded-[12px] border border-border-default', className)}>
      <table className="w-full">
        <thead>
          <tr className="bg-bg-surface-2">
            <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider">
              {type === 'cash' ? 'Account / Income Name' : type === 'liability' ? 'Loan Name' : 'Asset Name'}
            </th>
            {type === 'liability' && (
              <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider">
                Monthly EMI
              </th>
            )}
            <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider">
              Added On
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider">
              {type === 'liability' ? 'Remaining Loan' : 'Total Value'}
            </th>
            <th className="px-4 py-3 text-right text-[11px] font-medium text-text-faint uppercase tracking-wider w-[60px]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const isSalary = Boolean(
              item.metadata?.isSalary ||
              item.symbol === 'SALARY' ||
              item.name?.toLowerCase().includes('salary')
            );
            const totalVal = item.computedValue ?? item.cmp ?? (item.quantity * item.avgCost);
            const isDeleting = deletingId === item.id;

            return (
              <tr
                key={item.id}
                className="border-t border-border-default hover:bg-bg-surface-2 transition-colors duration-150 h-[52px]"
              >
                <td className="px-4 py-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-text-primary">{item.name}</p>
                      {isSalary && (
                        <span className="text-[10.5px] bg-accent-brass/15 text-accent-brass border border-accent-brass/30 px-1.5 py-0.5 rounded font-medium">
                          Primary Salary
                        </span>
                      )}
                    </div>
                    {type === 'cash' && (
                      <p className="text-[11px] text-text-faint">
                        {item.metadata?.type === 'income' ? 'Monthly Income (Recurring)' : 'Liquid Cash / Bank'}
                      </p>
                    )}
                  </div>
                </td>

                {type === 'liability' && (
                  <td className="px-4 py-2">
                    <span className="text-[13px] text-text-secondary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
                      {formatINR(parseFloat(item.metadata?.emi || 0))}
                    </span>
                  </td>
                )}

                <td className="px-4 py-2">
                  <span className="text-[13px] text-text-secondary">
                    {formatDate(item.createdAt)}
                  </span>
                </td>

                <td className="px-4 py-2">
                  <span className="text-[13px] font-medium text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
                    {formatINR(totalVal)}
                  </span>
                </td>

                <td className="px-4 py-2 text-right">
                  {isSalary ? (
                    <span className="text-[11px] text-text-faint italic select-none" title="Primary Registration Salary cannot be deleted">
                      Fixed
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.name)}
                      disabled={isDeleting}
                      className="p-1.5 text-text-faint hover:text-negative hover:bg-negative/10 rounded-[6px] transition-colors disabled:opacity-50"
                      title="Permanently delete this entry"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-negative" />
                      ) : (
                        <Trash2 className="w-4 h-4 hover:scale-110 transition-transform" />
                      )}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}

          {data.length === 0 && (
            <tr>
              <td colSpan={type === 'liability' ? 5 : 4} className="px-4 py-8 text-center text-[13px] text-text-faint">
                No items found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
