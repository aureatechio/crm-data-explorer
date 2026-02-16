"use client";

import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface DataGridProps {
  data: Record<string, unknown>[];
  totalCount: number;
  page: number;
  pageSize: number;
  orderBy: string;
  orderDirection: "asc" | "desc";
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSort: (column: string) => void;
  isLoading: boolean;
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "\u2014";
  if (typeof value === "boolean") return value ? "Sim" : "Nao";
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "string" && value.length > 100) return value.slice(0, 100) + "...";
  return String(value);
}

export default function DataGrid({
  data,
  totalCount,
  page,
  pageSize,
  orderBy,
  orderDirection,
  onPageChange,
  onPageSizeChange,
  onSort,
  isLoading,
}: DataGridProps) {
  const columnHelper = createColumnHelper<Record<string, unknown>>();

  const columns: ColumnDef<Record<string, unknown>, unknown>[] = useMemo(() => {
    if (data.length === 0) return [];

    const keys = new Set<string>();
    for (const row of data) {
      for (const key of Object.keys(row)) {
        keys.add(key);
      }
    }

    return Array.from(keys).map((key) =>
      columnHelper.accessor(key, {
        header: () => key,
        cell: (info) => formatCellValue(info.getValue()),
      })
    );
  }, [data, columnHelper]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(totalCount / pageSize),
  });

  const totalPages = Math.ceil(totalCount / pageSize);
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, totalCount);

  return (
    <div className="flex flex-col h-full">
      {/* Table */}
      <div className="flex-1 overflow-auto bg-[var(--md-surface)] rounded-xl" style={{ boxShadow: 'var(--md-elevation-1)' }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[var(--md-surface-container-low)]">
              {table.getHeaderGroups().map((headerGroup) =>
                headerGroup.headers.map((header) => {
                  const colName = header.column.id;
                  const isSorted = orderBy === colName;
                  return (
                    <th
                      key={header.id}
                      onClick={() => onSort(colName)}
                      className="px-4 py-3 text-left font-medium text-[var(--md-on-surface-variant)] text-xs cursor-pointer hover:bg-[var(--md-surface-container)] transition-colors whitespace-nowrap select-none border-b border-[var(--md-outline-variant)]"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </span>
                        {isSorted ? (
                          orderDirection === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-[var(--md-primary)]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-[var(--md-primary)]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-20" />
                        )}
                      </div>
                    </th>
                  );
                })
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length || 1}
                  className="px-4 py-16 text-center text-[var(--md-on-surface-variant)]"
                >
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-[var(--md-primary)] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Consultando...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length || 1}
                  className="px-4 py-16 text-center text-[var(--md-on-surface-variant)] text-sm"
                >
                  Nenhum resultado encontrado
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--md-outline-variant)]/50 hover:bg-[var(--md-surface-container-low)] transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-2.5 text-[var(--md-on-surface)] whitespace-nowrap max-w-xs truncate font-mono text-xs"
                      title={String(cell.getValue() ?? "")}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination - M3 style */}
      <div className="flex items-center justify-between px-2 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--md-on-surface-variant)]">
            {totalCount > 0
              ? `${from.toLocaleString()}\u2013${to.toLocaleString()} de ${totalCount.toLocaleString()}`
              : "0 resultados"}
          </span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant)] rounded-xl px-3 py-1.5 text-xs text-[var(--md-on-surface)] focus:outline-none focus:border-[var(--md-primary)] focus:ring-1 focus:ring-[var(--md-primary)] transition-all"
          >
            {[25, 50, 100, 250].map((size) => (
              <option key={size} value={size}>
                {size} por pagina
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(0)}
            disabled={page === 0}
            className="p-2 rounded-full text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className="p-2 rounded-full text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-[var(--md-on-surface)] px-3 font-medium tabular-nums">
            {page + 1} / {totalPages || 1}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-full text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(totalPages - 1)}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-full text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
