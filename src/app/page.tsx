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
  ChevronDown,
  ChevronUp,
  Lock,
  Eye,
} from "lucide-react";

export default function Home() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

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

  // Auth check
  useEffect(() => {
    const stored = sessionStorage.getItem("crm_explorer_auth");
    if (stored === "true") setIsAuthenticated(true);
  }, []);

  const handleLogin = () => {
    const envPass = process.env.NEXT_PUBLIC_APP_PASSWORD || "acelerai2025";
    if (password === envPass) {
      setIsAuthenticated(true);
      sessionStorage.setItem("crm_explorer_auth", "true");
      setAuthError("");
    } else {
      setAuthError("Senha incorreta");
    }
  };

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

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="w-full max-w-sm p-8 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)] shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[var(--accent-light)] rounded-lg">
              <Lock className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">
                CRM Data Explorer
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                AcelerAI - Acesso restrito
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Senha de acesso"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              autoFocus
            />
            {authError && (
              <p className="text-xs text-[var(--danger)] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {authError}
              </p>
            )}
            <button
              onClick={handleLogin}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Entrar
            </button>
          </div>

          <p className="text-[10px] text-[var(--text-muted)] text-center mt-4">
            Acesso somente leitura ao banco de dados
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        selectedTable={queryState.table}
        onSelectTable={handleSelectTable}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          <Database className="w-4 h-4 text-[var(--accent)]" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {queryState.table || "Selecione uma tabela"}
          </h2>

          {result.count > 0 && (
            <div className="flex items-center gap-3 ml-4">
              <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <Rows3 className="w-3 h-3" />
                {result.count.toLocaleString()} registros
              </span>
              <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <Clock className="w-3 h-3" />
                {result.executionTime.toFixed(0)}ms
              </span>
            </div>
          )}

          {result.error && (
            <span className="flex items-center gap-1 text-xs text-[var(--danger)] ml-4">
              <AlertCircle className="w-3 h-3" />
              {result.error}
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] bg-[var(--bg-primary)] px-2 py-1 rounded-full">
              <Eye className="w-3 h-3" />
              READ ONLY
            </span>

            <ExportButton
              queryState={queryState}
              disabled={!queryState.table || result.count === 0}
            />

            <button
              onClick={handleExecuteQuery}
              disabled={!queryState.table || isLoading}
              className="flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              Consultar
            </button>
          </div>
        </header>

        {/* Config panel (collapsible) */}
        {queryState.table && (
          <div className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="w-full flex items-center gap-1.5 px-4 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              {showConfig ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
              {showConfig ? "Ocultar configuracao" : "Mostrar configuracao"}
              {(queryState.filters.length > 0 || queryState.joins.length > 0) && (
                <span className="text-[10px] bg-[var(--accent)] text-white px-1.5 rounded-full">
                  {queryState.filters.length + queryState.joins.length} ativos
                </span>
              )}
            </button>

            {showConfig && (
              <div className="px-4 pb-4 grid grid-cols-3 gap-4 animate-fade-in">
                <ColumnSelector
                  columns={columns}
                  selectedColumns={queryState.selectedColumns}
                  onToggleColumn={toggleColumn}
                  onSelectAll={selectAllColumns}
                  onDeselectAll={deselectAllColumns}
                />
                <FilterPanel
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
            )}
          </div>
        )}

        {/* Data grid */}
        <div className="flex-1 p-4 overflow-hidden">
          {!queryState.table ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Database className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-30" />
                <p className="text-sm text-[var(--text-muted)]">
                  Selecione uma tabela na sidebar para comecar
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1 opacity-60">
                  80+ tabelas disponiveis agrupadas por dominio
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
