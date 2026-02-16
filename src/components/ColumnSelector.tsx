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
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Columns3 className="w-4 h-4 text-[var(--md-primary)]" />
          <span className="text-sm font-medium text-[var(--md-on-surface)]">
            Colunas
          </span>
          <span className="text-xs text-[var(--md-outline)] bg-[var(--md-surface-container)] px-2 py-0.5 rounded-full">
            {selectedColumns.length === 0
              ? `Todas (${columns.length})`
              : `${selectedColumns.length}/${columns.length}`}
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onSelectAll}
            className="text-xs text-[var(--md-primary)] hover:bg-[var(--md-primary-container)] px-2.5 py-1 rounded-full transition-colors font-medium"
          >
            Todas
          </button>
          <button
            onClick={onDeselectAll}
            className="text-xs text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container)] px-2.5 py-1 rounded-full transition-colors"
          >
            Limpar
          </button>
        </div>
      </div>

      <div className="relative shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--md-on-surface-variant)]" />
        <input
          type="text"
          placeholder="Buscar coluna..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[var(--md-surface-container-low)] rounded-full pl-9 pr-3 py-2 text-xs text-[var(--md-on-surface)] placeholder:text-[var(--md-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--md-primary)] transition-all"
        />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-0.5">
        {filtered.map((col) => {
          const isSelected =
            allSelected || selectedColumns.includes(col.name);
          return (
            <button
              key={col.name}
              onClick={() => onToggleColumn(col.name)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${
                isSelected
                  ? "text-[var(--md-on-surface)] bg-[var(--md-primary-container)]/40"
                  : "text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container-low)]"
              }`}
            >
              <div
                className={`w-[18px] h-[18px] rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? "bg-[var(--md-primary)] border-[var(--md-primary)]"
                    : "border-[var(--md-outline)]"
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
              <span className="truncate font-mono text-[11px]">{col.name}</span>
              <span className="ml-auto text-[10px] text-[var(--md-outline)] shrink-0 bg-[var(--md-surface-container)] px-1.5 py-0.5 rounded">
                {col.data_type}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
