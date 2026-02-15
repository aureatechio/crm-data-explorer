"use client";

import { Plus, X, Filter as FilterIcon } from "lucide-react";
import type { Filter, FilterOperator, ColumnMeta } from "@/lib/types";
import { OPERATOR_LABELS, getOperatorsForType } from "@/lib/types";

interface FilterPanelProps {
  filters: Filter[];
  columns: ColumnMeta[];
  onAddFilter: () => void;
  onRemoveFilter: (id: string) => void;
  onUpdateFilter: (id: string, field: keyof Filter, value: string) => void;
}

export default function FilterPanel({
  filters,
  columns,
  onAddFilter,
  onRemoveFilter,
  onUpdateFilter,
}: FilterPanelProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <FilterIcon className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Filtros
          </span>
          {filters.length > 0 && (
            <span className="text-[10px] bg-[var(--accent)] text-white px-1.5 py-0.5 rounded-full">
              {filters.length}
            </span>
          )}
        </div>
        <button
          onClick={onAddFilter}
          className="flex items-center gap-1 text-[10px] text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
        >
          <Plus className="w-3 h-3" />
          Filtro
        </button>
      </div>

      {filters.map((filter) => {
        const col = columns.find((c) => c.name === filter.column);
        const operators = col
          ? getOperatorsForType(col.data_type)
          : getOperatorsForType("text");
        const needsValue =
          filter.operator !== "is_null" && filter.operator !== "is_not_null";

        return (
          <div
            key={filter.id}
            className="flex items-center gap-1.5 animate-fade-in"
          >
            <select
              value={filter.column}
              onChange={(e) =>
                onUpdateFilter(filter.id, "column", e.target.value)
              }
              className="flex-1 min-w-0 bg-[var(--bg-primary)] border border-[var(--border)] rounded-md px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="">Coluna...</option>
              {columns.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={filter.operator}
              onChange={(e) =>
                onUpdateFilter(filter.id, "operator", e.target.value)
              }
              className="w-28 bg-[var(--bg-primary)] border border-[var(--border)] rounded-md px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            >
              {operators.map((op) => (
                <option key={op} value={op}>
                  {OPERATOR_LABELS[op as FilterOperator]}
                </option>
              ))}
            </select>

            {needsValue && (
              <input
                type="text"
                value={filter.value}
                onChange={(e) =>
                  onUpdateFilter(filter.id, "value", e.target.value)
                }
                placeholder="Valor..."
                className="flex-1 min-w-0 bg-[var(--bg-primary)] border border-[var(--border)] rounded-md px-2 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
              />
            )}

            <button
              onClick={() => onRemoveFilter(filter.id)}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
