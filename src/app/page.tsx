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
  Shield,
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

  // Login screen - M3 style
  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--md-surface-dim)]">
        <div className="w-full max-w-sm p-8 bg-[var(--md-surface)] rounded-3xl" style={{ boxShadow: 'var(--md-elevation-3)' }}>
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 bg-[var(--md-primary-container)] rounded-2xl flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-[var(--md-primary)]" />
            </div>
            <h1 className="text-[22px] font-normal text-[var(--md-on-surface)]">
              CRM Data Explorer
            </h1>
            <p className="text-sm text-[var(--md-on-surface-variant)] mt-1">
              AcelerAI - Acesso restrito
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder=" "
                id="password-input"
                className="peer w-full bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant)] rounded-xl px-4 pt-5 pb-2 text-sm text-[var(--md-on-surface)] focus:outline-none focus:border-[var(--md-primary)] focus:border-2 transition-all"
                autoFocus
              />
              <label
                htmlFor="password-input"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--md-on-surface-variant)] transition-all pointer-events-none peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-[var(--md-primary)] peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs"
              >
                Senha de acesso
              </label>
            </div>

            {authError && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[var(--md-error-container)] rounded-xl">
                <AlertCircle className="w-4 h-4 text-[var(--md-error)]" />
                <p className="text-xs text-[var(--md-error)]">{authError}</p>
              </div>
            )}

            <button
              onClick={handleLogin}
              className="w-full bg-[var(--md-primary)] hover:bg-[var(--md-primary-hover)] text-[var(--md-on-primary)] py-3 rounded-full text-sm font-medium transition-all active:scale-[0.98]"
              style={{ boxShadow: 'var(--md-elevation-1)' }}
            >
              Entrar
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-6">
            <Shield className="w-3.5 h-3.5 text-[var(--md-on-surface-variant)]" />
            <p className="text-xs text-[var(--md-on-surface-variant)]">
              Acesso somente leitura ao banco de dados
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[var(--md-surface-dim)]">
      <Sidebar
        selectedTable={queryState.table}
        onSelectTable={handleSelectTable}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
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

        {/* Config panel */}
        {queryState.table && (
          <div className="bg-[var(--md-surface)]">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="w-full flex items-center gap-2 px-6 py-2 text-sm text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container-low)] transition-colors"
            >
              {showConfig ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              {showConfig ? "Ocultar configuracao" : "Mostrar configuracao"}
              {(queryState.filters.length > 0 || queryState.joins.length > 0) && (
                <span className="text-xs bg-[var(--md-primary)] text-[var(--md-on-primary)] px-2 py-0.5 rounded-full font-medium">
                  {queryState.filters.length + queryState.joins.length}
                </span>
              )}
            </button>

            {showConfig && (
              <div className="px-6 pb-3 pt-1 grid grid-cols-3 gap-6 animate-fade-in border-b border-[var(--md-outline-variant)] [&>*]:max-h-48 [&>*]:overflow-hidden [&>*]:flex [&>*]:flex-col">
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
