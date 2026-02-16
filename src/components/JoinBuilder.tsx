"use client";

import { Plus, X, Link2 } from "lucide-react";
import type { JoinConfig } from "@/lib/types";
import { getJoinsForTable } from "@/lib/schema";

interface JoinBuilderProps {
  tableName: string;
  joins: JoinConfig[];
  onAddJoin: (join: Omit<JoinConfig, "id">) => void;
  onRemoveJoin: (id: string) => void;
}

export default function JoinBuilder({
  tableName,
  joins,
  onAddJoin,
  onRemoveJoin,
}: JoinBuilderProps) {
  const availableJoins = getJoinsForTable(tableName);

  if (availableJoins.length === 0) return null;

  const usedTables = new Set(joins.map((j) => `${j.fromColumn}-${j.toTable}`));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 shrink-0">
        <Link2 className="w-4 h-4 text-[var(--md-primary)]" />
        <span className="text-sm font-medium text-[var(--md-on-surface)]">
          Joins
        </span>
        {joins.length > 0 && (
          <span className="text-xs bg-[var(--md-success)] text-white px-2 py-0.5 rounded-full font-medium">
            {joins.length}
          </span>
        )}
      </div>

      {/* Active joins */}
      {joins.map((join) => (
        <div
          key={join.id}
          className="flex items-center gap-2 bg-[var(--md-primary-container)] rounded-xl px-3 py-2.5 animate-fade-in"
        >
          <Link2 className="w-4 h-4 text-[var(--md-primary)] shrink-0" />
          <span className="text-xs text-[var(--md-on-primary-container)] truncate">
            <span className="font-mono text-[var(--md-primary)] font-medium">
              {join.fromColumn}
            </span>
            <span className="text-[var(--md-on-surface-variant)] mx-1.5">&rarr;</span>
            <span className="font-mono font-medium">{join.toTable}</span>
          </span>
          <button
            onClick={() => onRemoveJoin(join.id)}
            className="ml-auto p-1 text-[var(--md-on-surface-variant)] hover:text-[var(--md-error)] hover:bg-[var(--md-error-container)] rounded-full transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {/* Available joins */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-0.5">
        {availableJoins
          .filter((j) => !usedTables.has(`${j.column}-${j.foreignTable}`))
          .map((join) => (
            <button
              key={`${join.column}-${join.foreignTable}`}
              onClick={() =>
                onAddJoin({
                  fromTable: tableName,
                  fromColumn: join.column,
                  toTable: join.foreignTable,
                  toColumn: join.foreignColumn,
                  selectedColumns: [],
                })
              }
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container-low)] transition-colors"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="font-mono text-[11px]">{join.column}</span>
              <span className="text-[var(--md-outline)]">&rarr;</span>
              <span className="font-mono text-[11px] font-medium">
                {join.foreignTable}
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}
