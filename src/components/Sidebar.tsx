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
    <aside className="w-72 min-w-72 h-screen flex flex-col bg-[var(--md-surface)] border-r border-[var(--md-outline-variant)]">
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-[var(--md-primary-container)] rounded-xl flex items-center justify-center">
            <Database className="w-[18px] h-[18px] text-[var(--md-primary)]" />
          </div>
          <div>
            <h1 className="text-base font-medium text-[var(--md-on-surface)] leading-tight">
              Data Explorer
            </h1>
            <p className="text-[11px] text-[var(--md-on-surface-variant)]">
              {totalTables} tabelas
            </p>
          </div>
        </div>

        {/* M3 Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-on-surface-variant)]" />
          <input
            type="text"
            placeholder="Buscar tabela..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--md-surface-container-low)] rounded-full pl-10 pr-4 py-2.5 text-sm text-[var(--md-on-surface)] placeholder:text-[var(--md-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--md-primary)] transition-all"
          />
        </div>
      </div>

      {/* Table list */}
      <div className="flex-1 overflow-y-auto px-3 pb-2">
        {Object.entries(filteredGroups).map(([group, tables]) => {
          const isExpanded = expandedGroups.has(group) || search.length > 0;
          return (
            <div key={group} className="mb-0.5">
              <button
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container-low)] transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 shrink-0 text-[var(--md-on-surface-variant)]" />
                ) : (
                  <ChevronRight className="w-4 h-4 shrink-0 text-[var(--md-on-surface-variant)]" />
                )}
                <span className="truncate">{group}</span>
                <span className="ml-auto text-xs text-[var(--md-outline)] bg-[var(--md-surface-container)] px-2 py-0.5 rounded-full">
                  {tables.length}
                </span>
              </button>

              {isExpanded && (
                <div className="ml-2 space-y-0.5 animate-fade-in">
                  {tables.map((table) => {
                    const isSelected = table === selectedTable;
                    const joins = getJoinsForTable(table);
                    return (
                      <button
                        key={table}
                        onClick={() => onSelectTable(table)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                          isSelected
                            ? "bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] font-medium"
                            : "text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container-low)]"
                        }`}
                      >
                        <Table2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[var(--md-primary)]' : 'opacity-50'}`} />
                        <span className="truncate">{table}</span>
                        {joins.length > 0 && (
                          <Link
                            className={`w-3.5 h-3.5 shrink-0 ml-auto ${
                              isSelected ? "text-[var(--md-primary)]" : "text-[var(--md-outline)] opacity-50"
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
      <div className="px-5 py-3 border-t border-[var(--md-outline-variant)]">
        <p className="text-xs text-[var(--md-outline)] text-center">
          AcelerAI CRM - Somente Leitura
        </p>
      </div>
    </aside>
  );
}
