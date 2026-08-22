'use client';

import { useState, useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { Star, ArrowUpDown, Search } from 'lucide-react';
import { type StockHolding } from '@/lib/mock-data';
import { useLedgerStore } from '@/lib/store';
import { DeltaBadge } from '@/components/ui/delta-badge';
import { PriceCell } from '@/components/ui/price-cell';
import { formatINR, cn } from '@/lib/formatters';

interface HoldingsTableProps {
  data: StockHolding[];
  className?: string;
  onRowClick?: (symbol: string) => void;
}

const columnHelper = createColumnHelper<StockHolding>();

export function HoldingsTable({ data, className, onRowClick }: HoldingsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const router = useRouter();
  const favorites = useLedgerStore((s) => s.favorites);
  const toggleFavorite = useLedgerStore((s) => s.toggleFavorite);
  const livePrices = useLedgerStore((s) => s.livePrices);

  const enrichedData = useMemo(() => {
    return data.map((stock) => {
      const live = livePrices.get(stock.symbol);
      return live ? { ...stock, cmp: live.price, dayChange: live.change, dayChangePercent: live.changePercent } : stock;
    });
  }, [data, livePrices]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'favorite',
        size: 40,
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(row.original.symbol);
            }}
            className="p-1 hover:text-accent-brass transition-colors"
          >
            <Star
              className={cn(
                'w-4 h-4',
                favorites.has(row.original.symbol)
                  ? 'fill-accent-brass text-accent-brass'
                  : 'text-text-faint'
              )}
            />
          </button>
        ),
      }),
      columnHelper.accessor('name', {
        header: 'Stock',
        cell: (info) => (
          <div>
            <p className="text-[13px] font-medium text-text-primary">{info.getValue()}</p>
            <p className="text-[11px] text-text-faint" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
              {info.row.original.symbol}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor('quantity', {
        header: 'Qty',
        cell: (info) => (
          <span className="text-[13px]" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('avgCost', {
        header: 'Avg Cost',
        cell: (info) => (
          <span className="text-[13px] text-text-secondary" style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
            {formatINR(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor('cmp', {
        header: 'CMP',
        cell: (info) => {
          const live = livePrices.get(info.row.original.symbol);
          return (
            <PriceCell
              price={info.getValue()}
              previousPrice={live?.previousPrice}
              className="text-[13px]"
            />
          );
        },
      }),
      columnHelper.display({
        id: 'pnl',
        header: 'P&L',
        cell: ({ row }) => {
          const pnl = (row.original.cmp - row.original.avgCost) * row.original.quantity;
          return (
            <span
              className={cn(
                'text-[13px]',
                pnl >= 0 ? 'text-positive' : 'text-negative'
              )}
              style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums' }}
            >
              {formatINR(pnl)}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'pnlPercent',
        header: 'P&L %',
        cell: ({ row }) => {
          const pnlPercent =
            ((row.original.cmp - row.original.avgCost) / row.original.avgCost) * 100;
          return <DeltaBadge value={pnlPercent} />;
        },
      }),
      columnHelper.accessor('dayChangePercent', {
        header: 'Day',
        cell: (info) => <DeltaBadge value={info.getValue()} />,
      }),
      columnHelper.accessor('sector', {
        header: 'Sector',
        cell: (info) => (
          <span className="text-[12px] text-text-faint">{info.getValue()}</span>
        ),
      }),
    ],
    [favorites, toggleFavorite, livePrices]
  );

  const table = useReactTable({
    data: enrichedData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className={cn('', className)}>
      <div className="relative mb-4 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
        <input
          type="text"
          placeholder="Filter holdings..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full bg-bg-surface-2 border border-border-default rounded-[6px] pl-9 pr-4 py-2 text-[13px] text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-brass transition-colors"
        />
      </div>

      <div className="overflow-x-auto rounded-[12px] border border-border-default">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-bg-surface-2">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-[11px] font-medium text-text-faint uppercase tracking-wider cursor-pointer hover:text-text-secondary transition-colors"
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined, fontFamily: 'IBM Plex Mono, monospace' }}
                  >
                    <div className="flex items-center gap-1">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <ArrowUpDown className="w-3 h-3 text-text-faint" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row.original.symbol) : undefined}
                className={cn("border-t border-border-default hover:bg-bg-surface-2 transition-colors duration-150 h-[52px]", onRowClick && "cursor-pointer")}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-[11px] text-text-faint" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
        {table.getRowModel().rows.length} of {data.length} holdings
      </div>
    </div>
  );
}
