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
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <FilterIcon className="w-4 h-4 text-[var(--md-primary)]" />
          <span className="text-sm font-medium text-[var(--md-on-surface)]">
            Filtros
          </span>
          {filters.length > 0 && (
            <span className="text-xs bg-[var(--md-primary)] text-[var(--md-on-primary)] px-2 py-0.5 rounded-full font-medium">
              {filters.length}
            </span>
          )}
        </div>
        <button
          onClick={onAddFilter}
          className="inline-flex items-center gap-1 text-xs text-[var(--md-primary)] hover:bg-[var(--md-primary-container)] px-2.5 py-1 rounded-full transition-colors font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
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
            className="flex items-center gap-2 animate-fade-in"
          >
            <select
              value={filter.column}
              onChange={(e) =>
                onUpdateFilter(filter.id, "column", e.target.value)
              }
              className="flex-1 min-w-0 bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant)] rounded-xl px-3 py-2 text-xs text-[var(--md-on-surface)] focus:outline-none focus:border-[var(--md-primary)] focus:ring-1 focus:ring-[var(--md-primary)] transition-all"
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
              className="w-28 bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant)] rounded-xl px-3 py-2 text-xs text-[var(--md-on-surface)] focus:outline-none focus:border-[var(--md-primary)] focus:ring-1 focus:ring-[var(--md-primary)] transition-all"
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
                className="flex-1 min-w-0 bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant)] rounded-xl px-3 py-2 text-xs text-[var(--md-on-surface)] placeholder:text-[var(--md-on-surface-variant)] focus:outline-none focus:border-[var(--md-primary)] focus:ring-1 focus:ring-[var(--md-primary)] transition-all"
              />
            )}

            <button
              onClick={() => onRemoveFilter(filter.id)}
              className="p-1.5 text-[var(--md-on-surface-variant)] hover:text-[var(--md-error)] hover:bg-[var(--md-error-container)] rounded-full transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
