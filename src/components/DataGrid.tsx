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
  if (value === null || value === undefined) return "—";
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

    // Get all unique keys from data (including nested objects from joins)
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
      <div className="flex-1 overflow-auto border border-[var(--border)] rounded-lg">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[var(--bg-tertiary)]">
              {table.getHeaderGroups().map((headerGroup) =>
                headerGroup.headers.map((header) => {
                  const colName = header.column.id;
                  const isSorted = orderBy === colName;
                  return (
                    <th
                      key={header.id}
                      onClick={() => onSort(colName)}
                      className="px-3 py-2 text-left font-medium text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors whitespace-nowrap select-none border-b border-[var(--border)]"
                    >
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[11px]">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </span>
                        {isSorted ? (
                          orderDirection === "asc" ? (
                            <ArrowUp className="w-3 h-3 text-[var(--accent)]" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-[var(--accent)]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
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
                  className="px-3 py-16 text-center text-[var(--text-muted)]"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                    Consultando...
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length || 1}
                  className="px-3 py-16 text-center text-[var(--text-muted)]"
                >
                  Nenhum resultado encontrado
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-b border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors ${
                    i % 2 === 0 ? "bg-[var(--bg-secondary)]" : "bg-[var(--bg-primary)]"
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-3 py-1.5 text-[var(--text-primary)] whitespace-nowrap max-w-xs truncate font-mono text-[11px]"
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

      {/* Pagination */}
      <div className="flex items-center justify-between px-2 py-3 border-t border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">
            {totalCount > 0
              ? `${from.toLocaleString()}-${to.toLocaleString()} de ${totalCount.toLocaleString()}`
              : "0 resultados"}
          </span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-[var(--bg-primary)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
          >
            {[25, 50, 100, 250].map((size) => (
              <option key={size} value={size}>
                {size}/pag
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(0)}
            disabled={page === 0}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-[var(--text-secondary)] px-2 tabular-nums">
            {page + 1} / {totalPages || 1}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(totalPages - 1)}
            disabled={page >= totalPages - 1}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
