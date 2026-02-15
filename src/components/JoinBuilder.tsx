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
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Link2 className="w-3.5 h-3.5 text-[var(--accent)]" />
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          Joins
        </span>
        {joins.length > 0 && (
          <span className="text-[10px] bg-[var(--success)] text-white px-1.5 py-0.5 rounded-full">
            {joins.length}
          </span>
        )}
      </div>

      {/* Active joins */}
      {joins.map((join) => (
        <div
          key={join.id}
          className="flex items-center gap-2 bg-[var(--accent-light)] border border-[var(--accent)]/20 rounded-md px-2 py-1.5 animate-fade-in"
        >
          <Link2 className="w-3 h-3 text-[var(--accent)] shrink-0" />
          <span className="text-xs text-[var(--text-primary)] truncate">
            <span className="font-mono text-[var(--accent)]">
              {join.fromColumn}
            </span>
            <span className="text-[var(--text-muted)] mx-1">&rarr;</span>
            <span className="font-mono font-medium">{join.toTable}</span>
          </span>
          <button
            onClick={() => onRemoveJoin(join.id)}
            className="ml-auto p-0.5 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {/* Available joins */}
      <div className="space-y-0.5">
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
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <Plus className="w-3 h-3 shrink-0" />
              <span className="font-mono text-[11px]">{join.column}</span>
              <span className="text-[var(--text-muted)]">&rarr;</span>
              <span className="font-mono text-[11px] font-medium">
                {join.foreignTable}
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}
