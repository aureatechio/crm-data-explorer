"use client";

import { useState, useMemo } from "react";
import { getGroupedTables, getJoinsForTable } from "@/lib/schema";
import {
  Database,
  ChevronDown,
  ChevronRight,
  Search,
  Link,
  Table2,
} from "lucide-react";

interface SidebarProps {
  selectedTable: string;
  onSelectTable: (table: string) => void;
}

export default function Sidebar({ selectedTable, onSelectTable }: SidebarProps) {
  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const groups = useMemo(() => getGroupedTables(), []);

  const filteredGroups = useMemo(() => {
    if (!search) return groups;
    const lower = search.toLowerCase();
    const result: Record<string, string[]> = {};
    for (const [group, tables] of Object.entries(groups)) {
      const filtered = tables.filter(
        (t) =>
          t.toLowerCase().includes(lower) ||
          group.toLowerCase().includes(lower)
      );
      if (filtered.length > 0) result[group] = filtered;
    }
    return result;
  }, [groups, search]);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const totalTables = Object.values(groups).flat().length;

  return (
    <aside className="w-72 min-w-72 h-screen flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-5 h-5 text-[var(--accent)]" />
          <h1 className="text-sm font-semibold text-[var(--text-primary)]">
            Data Explorer
          </h1>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Buscar tabela..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg pl-8 pr-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
        <p className="text-[10px] text-[var(--text-muted)] mt-2">
          {totalTables} tabelas disponíveis
        </p>
      </div>

      {/* Table list */}
      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(filteredGroups).map(([group, tables]) => {
          const isExpanded = expandedGroups.has(group) || search.length > 0;
          return (
            <div key={group} className="mb-1">
              <button
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 shrink-0" />
                ) : (
                  <ChevronRight className="w-3 h-3 shrink-0" />
                )}
                <span className="truncate">{group}</span>
                <span className="ml-auto text-[10px] text-[var(--text-muted)] tabular-nums">
                  {tables.length}
                </span>
              </button>

              {isExpanded && (
                <div className="ml-2 animate-fade-in">
                  {tables.map((table) => {
                    const isSelected = table === selectedTable;
                    const joins = getJoinsForTable(table);
                    return (
                      <button
                        key={table}
                        onClick={() => onSelectTable(table)}
                        className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-all ${
                          isSelected
                            ? "bg-[var(--accent)] text-white font-medium"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <Table2 className="w-3 h-3 shrink-0 opacity-60" />
                        <span className="truncate">{table}</span>
                        {joins.length > 0 && (
                          <Link
                            className={`w-3 h-3 shrink-0 ml-auto ${
                              isSelected ? "opacity-70" : "text-[var(--accent)] opacity-50"
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--border)]">
        <p className="text-[10px] text-[var(--text-muted)] text-center">
          AcelerAI CRM - Somente Leitura
        </p>
      </div>
    </aside>
  );
}
