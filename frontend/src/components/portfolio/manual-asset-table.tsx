'use client';

import { useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
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

const columnHelper = createColumnHelper<ManualAsset>();

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

  const columns = useMemo(() => {
    const cols = [];

    cols.push(
      columnHelper.accessor('name', {
        header: type === 'cash' ? 'Account / Income Name' : type === 'liability' ? 'Loan Name' : 'Asset Name',
        cell: (info) => {
          const isSalary = Boolean(info.row.original.metadata?.isSalary || info.row.original.name.toLowerCase().includes('salary'));
          return (
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-medium text-text-primary">{info.getValue()}</p>
                {isSalary && (
                  <span className="text-[10.5px] bg-accent-brass/15 text-accent-brass border border-accent-brass/30 px-1.5 py-0.5 rounded font-medium">
                    Primary Salary
                  </span>
                )}
              </div>
              {type === 'cash' && (
                <p className="text-[11px] text-text-faint">
                  {info.row.original.metadata?.type === 'income' ? 'Monthly Income (Recurring)' : 'Liquid Cash / Bank'}
                </p>
              )}
            </div>
          );
        },
      })
    );

    if (type === 'liability') {
      cols.push(
        columnHelper.display({
          id: 'emi',
          header: 'Monthly EMI',
          cell: ({ row }) => (
            <span className="text-[13px] text-text-secondary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
              {formatINR(parseFloat(row.original.metadata?.emi || 0))}
            </span>
          ),
        })
      );
    }

    cols.push(
      columnHelper.accessor('createdAt', {
        header: 'Added On',
        cell: (info) => (
          <span className="text-[13px] text-text-secondary">
            {formatDate(info.getValue())}
          </span>
        ),
      })
    );

    cols.push(
      columnHelper.display({
        id: 'totalValue',
        header: type === 'liability' ? 'Remaining Loan' : 'Total Value',
        cell: ({ row }) => {
          const totalVal = row.original.computedValue ?? row.original.cmp ?? (row.original.quantity * row.original.avgCost);
          return (
            <span className="text-[13px] font-medium text-text-primary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
              {formatINR(totalVal)}
            </span>
          );
        },
      })
    );

    cols.push(
      columnHelper.display({
        id: 'actions',
        header: '',
        size: 44,
        cell: ({ row }) => {
          const isSalary = Boolean(
            row.original.metadata?.isSalary ||
            row.original.symbol === 'SALARY' ||
            row.original.name?.toLowerCase().includes('salary')
          );

          if (isSalary) {
            return (
              <span className="text-[11px] text-text-faint italic select-none" title="Primary Registration Salary cannot be deleted">
                Fixed
              </span>
            );
          }

          const isDeleting = deletingId === row.original.id;

          return (
            <div className="flex justify-end pr-1">
              <button
                type="button"
                onClick={() => handleDelete(row.original.id, row.original.name)}
                disabled={isDeleting}
                className="p-1.5 text-text-faint hover:text-negative hover:bg-negative/10 rounded-[6px] transition-colors disabled:opacity-50"
                title="Permanently delete this entry"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-negative" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5 hover:scale-110 transition-transform" />
                )}
              </button>
            </div>
          );
        },
      })
    );

    return cols;
  }, [type, deletingId]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className={cn('overflow-x-auto rounded-[12px] border border-border-default', className)}>
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-bg-surface-2">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-t border-border-default hover:bg-bg-surface-2 transition-colors duration-150 h-[52px]"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-[13px] text-text-faint">
                No items found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
