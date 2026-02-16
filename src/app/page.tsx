"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import FilterPanel from "@/components/FilterPanel";
import ColumnSelector from "@/components/ColumnSelector";
import JoinBuilder from "@/components/JoinBuilder";
import DataGrid from "@/components/DataGrid";
import ExportButton from "@/components/ExportButton";
import { executeQuery, fetchTableColumns } from "@/lib/query-engine";
import type {
  QueryState,
  QueryResult,
  Filter,
  JoinConfig,
  ColumnMeta,
} from "@/lib/types";
import {
  Play,
  Clock,
  Database,
  AlertCircle,
  Rows3,
  Eye,
  X,
  SlidersHorizontal,
} from "lucide-react";

export default function Home() {
  // Query state
  const [queryState, setQueryState] = useState<QueryState>({
    table: "",
    selectedColumns: [],
    filters: [],
    joins: [],
    orderBy: "",
    orderDirection: "asc",
    page: 0,
    pageSize: 50,
  });

  const [result, setResult] = useState<QueryResult>({
    data: [],
    count: 0,
    error: null,
    executionTime: 0,
  });

  const [columns, setColumns] = useState<ColumnMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(true);
  const prevTableRef = useRef<string>("");

  // Load columns when table changes
  useEffect(() => {
    if (!queryState.table || queryState.table === prevTableRef.current) return;
    prevTableRef.current = queryState.table;

    const load = async () => {
      const cols = await fetchTableColumns(queryState.table);
      setColumns(cols);
      setQueryState((prev) => ({
        ...prev,
        selectedColumns: [],
        filters: [],
        joins: [],
        orderBy: "",
        page: 0,
      }));
      setResult({ data: [], count: 0, error: null, executionTime: 0 });
    };
    load();
  }, [queryState.table]);

  const handleSelectTable = useCallback((table: string) => {
    setQueryState((prev) => ({ ...prev, table }));
  }, []);

  const handleExecuteQuery = useCallback(async () => {
    if (!queryState.table) return;
    setIsLoading(true);
    const res = await executeQuery(queryState);
    setResult(res);
    setIsLoading(false);
  }, [queryState]);

  // Filters
  const addFilter = useCallback(() => {
    setQueryState((prev) => ({
      ...prev,
      filters: [
        ...prev.filters,
        {
          id: crypto.randomUUID(),
          column: columns[0]?.name || "",
          operator: "eq",
          value: "",
        },
      ],
    }));
  }, [columns]);

  const removeFilter = useCallback((id: string) => {
    setQueryState((prev) => ({
      ...prev,
      filters: prev.filters.filter((f) => f.id !== id),
    }));
  }, []);

  const updateFilter = useCallback(
    (id: string, field: keyof Filter, value: string) => {
      setQueryState((prev) => ({
        ...prev,
        filters: prev.filters.map((f) =>
          f.id === id ? { ...f, [field]: value } : f
        ),
      }));
    },
    []
  );

  // Columns
  const toggleColumn = useCallback(
    (col: string) => {
      setQueryState((prev) => {
        const current = prev.selectedColumns;
        if (current.length === 0) {
          return {
            ...prev,
            selectedColumns: columns
              .map((c) => c.name)
              .filter((c) => c !== col),
          };
        }
        if (current.includes(col)) {
          const next = current.filter((c) => c !== col);
          return { ...prev, selectedColumns: next.length === 0 ? [] : next };
        }
        return { ...prev, selectedColumns: [...current, col] };
      });
    },
    [columns]
  );

  const selectAllColumns = useCallback(() => {
    setQueryState((prev) => ({ ...prev, selectedColumns: [] }));
  }, []);

  const deselectAllColumns = useCallback(() => {
    if (columns.length > 0) {
      setQueryState((prev) => ({
        ...prev,
        selectedColumns: [columns[0].name],
      }));
    }
  }, [columns]);

  // Joins
  const addJoin = useCallback((join: Omit<JoinConfig, "id">) => {
    setQueryState((prev) => ({
      ...prev,
      joins: [...prev.joins, { ...join, id: crypto.randomUUID() }],
    }));
  }, []);

  const removeJoin = useCallback((id: string) => {
    setQueryState((prev) => ({
      ...prev,
      joins: prev.joins.filter((j) => j.id !== id),
    }));
  }, []);

  // Sort
  const handleSort = useCallback(
    (col: string) => {
      setQueryState((prev) => ({
        ...prev,
        orderBy: col,
        orderDirection:
          prev.orderBy === col && prev.orderDirection === "asc" ? "desc" : "asc",
        page: 0,
      }));
    },
    []
  );

  // Pagination
  const handlePageChange = useCallback((page: number) => {
    setQueryState((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setQueryState((prev) => ({ ...prev, pageSize, page: 0 }));
  }, []);

  // Auto-execute on page/sort changes
  useEffect(() => {
    if (queryState.table && result.count > 0) {
      handleExecuteQuery();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryState.page, queryState.pageSize, queryState.orderBy, queryState.orderDirection]);

  return (
    <div className="h-screen flex overflow-hidden bg-[var(--md-surface-dim)]">
      <Sidebar
        selectedTable={queryState.table}
        onSelectTable={handleSelectTable}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top bar - M3 style */}
        <header className="flex items-center gap-3 px-6 py-3 bg-[var(--md-surface)] border-b border-[var(--md-outline-variant)]">
          <Database className="w-5 h-5 text-[var(--md-primary)]" />
          <h2 className="text-base font-medium text-[var(--md-on-surface)]">
            {queryState.table || "Selecione uma tabela"}
          </h2>

          {result.count > 0 && (
            <div className="flex items-center gap-3 ml-3">
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--md-on-surface-variant)] bg-[var(--md-surface-container-low)] px-3 py-1 rounded-full">
                <Rows3 className="w-3.5 h-3.5" />
                {result.count.toLocaleString()} registros
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--md-on-surface-variant)] bg-[var(--md-surface-container-low)] px-3 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5" />
                {result.executionTime.toFixed(0)}ms
              </span>
            </div>
          )}

          {result.error && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--md-error)] bg-[var(--md-error-container)] px-3 py-1 rounded-full ml-3">
              <AlertCircle className="w-3.5 h-3.5" />
              {result.error}
            </div>
          )}

          <div className="ml-auto flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--md-on-surface-variant)] bg-[var(--md-surface-container)] px-3 py-1.5 rounded-full font-medium">
              <Eye className="w-3.5 h-3.5" />
              READ ONLY
            </span>

            {queryState.table && (
              <button
                onClick={() => setShowConfig(!showConfig)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  showConfig
                    ? "bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]"
                    : "text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container-low)]"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Configurar
                {(queryState.filters.length > 0 || queryState.joins.length > 0) && (
                  <span className="text-[10px] bg-[var(--md-primary)] text-[var(--md-on-primary)] w-5 h-5 rounded-full flex items-center justify-center font-medium">
                    {queryState.filters.length + queryState.joins.length}
                  </span>
                )}
              </button>
            )}

            <ExportButton
              queryState={queryState}
              disabled={!queryState.table || result.count === 0}
            />

            <button
              onClick={handleExecuteQuery}
              disabled={!queryState.table || isLoading}
              className="inline-flex items-center gap-2 bg-[var(--md-primary)] hover:bg-[var(--md-primary-hover)] text-[var(--md-on-primary)] px-5 py-2.5 rounded-full text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
              style={{ boxShadow: 'var(--md-elevation-1)' }}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Consultar
            </button>
          </div>
        </header>

        {/* Config panel - floating overlay */}
        {queryState.table && showConfig && (
          <div className="absolute top-0 left-0 right-0 bottom-0 z-40" onClick={() => setShowConfig(false)}>
            <div
              className="absolute top-14 left-4 right-4 bg-[var(--md-surface)] rounded-2xl border border-[var(--md-outline-variant)] animate-fade-in"
              style={{ boxShadow: 'var(--md-elevation-3, 0 6px 10px 0 rgba(0,0,0,.14), 0 1px 18px 0 rgba(0,0,0,.12), 0 3px 5px -1px rgba(0,0,0,.2))' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--md-outline-variant)]">
                <span className="text-sm font-medium text-[var(--md-on-surface)]">Configuracao</span>
                <button
                  onClick={() => setShowConfig(false)}
                  className="p-1.5 text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container-low)] rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-5 py-4 grid grid-cols-3 gap-6 [&>*]:max-h-52 [&>*]:overflow-hidden [&>*]:flex [&>*]:flex-col">
                <ColumnSelector
                  columns={columns}
                  selectedColumns={queryState.selectedColumns}
                  onToggleColumn={toggleColumn}
                  onSelectAll={selectAllColumns}
                  onDeselectAll={deselectAllColumns}
                />
                <FilterPanel
                  tableName={queryState.table}
                  filters={queryState.filters}
                  columns={columns}
                  onAddFilter={addFilter}
                  onRemoveFilter={removeFilter}
                  onUpdateFilter={updateFilter}
                />
                <JoinBuilder
                  tableName={queryState.table}
                  joins={queryState.joins}
                  onAddJoin={addJoin}
                  onRemoveJoin={removeJoin}
                />
              </div>
            </div>
          </div>
        )}

        {/* Data grid */}
        <div className="flex-1 p-4 overflow-hidden">
          {!queryState.table ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-[var(--md-surface-container)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Database className="w-8 h-8 text-[var(--md-on-surface-variant)] opacity-50" />
                </div>
                <p className="text-base text-[var(--md-on-surface-variant)]">
                  Selecione uma tabela para comecar
                </p>
                <p className="text-sm text-[var(--md-outline)] mt-1">
                  Escolha na barra lateral ao lado
                </p>
              </div>
            </div>
          ) : (
            <DataGrid
              data={result.data}
              totalCount={result.count}
              page={queryState.page}
              pageSize={queryState.pageSize}
              orderBy={queryState.orderBy}
              orderDirection={queryState.orderDirection}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onSort={handleSort}
              isLoading={isLoading}
            />
          )}
        </div>
      </main>
    </div>
  );
}
