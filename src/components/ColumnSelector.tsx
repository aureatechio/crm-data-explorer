"use client";

import { useState, useMemo } from "react";
import { Columns3, Search, Check } from "lucide-react";
import type { ColumnMeta } from "@/lib/types";

interface ColumnSelectorProps {
  columns: ColumnMeta[];
  selectedColumns: string[];
  onToggleColumn: (column: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export default function ColumnSelector({
  columns,
  selectedColumns,
  onToggleColumn,
  onSelectAll,
  onDeselectAll,
}: ColumnSelectorProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return columns;
    const lower = search.toLowerCase();
    return columns.filter((c) => c.name.toLowerCase().includes(lower));
  }, [columns, search]);

  const allSelected =
    selectedColumns.length === 0 || selectedColumns.length === columns.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Columns3 className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Colunas
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {selectedColumns.length === 0
              ? `Todas (${columns.length})`
              : `${selectedColumns.length}/${columns.length}`}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            className="text-[10px] text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
          >
            Todas
          </button>
          <button
            onClick={onDeselectAll}
            className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            Limpar
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Buscar coluna..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-md pl-7 pr-2 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
        />
      </div>

      <div className="max-h-40 overflow-y-auto space-y-0.5">
        {filtered.map((col) => {
          const isSelected =
            allSelected || selectedColumns.includes(col.name);
          return (
            <button
              key={col.name}
              onClick={() => onToggleColumn(col.name)}
              className={`w-full flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors ${
                isSelected
                  ? "text-[var(--text-primary)] bg-[var(--accent-light)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                  isSelected
                    ? "bg-[var(--accent)] border-[var(--accent)]"
                    : "border-[var(--border)]"
                }`}
              >
                {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              <span className="truncate font-mono text-[11px]">{col.name}</span>
              <span className="ml-auto text-[9px] text-[var(--text-muted)] shrink-0">
                {col.data_type}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
