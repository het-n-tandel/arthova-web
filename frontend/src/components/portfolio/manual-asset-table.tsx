'use client';

import { useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { formatINR, cn, formatDate } from '@/lib/formatters';

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
  const columns = useMemo(() => {
    const cols = [];

    cols.push(
      columnHelper.accessor('name', {
        header: type === 'cash' ? 'Account/Income Name' : type === 'liability' ? 'Loan Name' : 'Asset Name',
        cell: (info) => (
          <div>
            <p className="text-[13px] font-medium text-text-primary">{info.getValue()}</p>
            {type === 'cash' && (
              <p className="text-[11px] text-text-faint">
                {info.row.original.metadata?.type === 'income' ? 'Monthly Income' : 'Locker (One-time)'}
              </p>
            )}
          </div>
        ),
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

    return cols;
  }, [type]);

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
