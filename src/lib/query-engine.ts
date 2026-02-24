import { supabase } from "./supabase";
import type { QueryState, QueryResult, ColumnMeta } from "./types";
import { FK_LOOKUPS } from "./schema";

export interface LookupOption {
  id: string;
  label: string;
}

// Cache de lookups para evitar re-fetch
const lookupCache: Record<string, LookupOption[]> = {};

// Cache de nomes FK para resolucao no grid (uuid -> nome)
const fkNameCache: Record<string, Record<string, string>> = {};

/**
 * Pos-processamento: substitui UUIDs de colunas FK por nomes legiveis.
 * Usa FK_LOOKUPS para saber quais colunas resolver e de qual tabela buscar.
 */
async function resolveFKNames(
  data: Record<string, unknown>[],
  tableName: string
): Promise<Record<string, unknown>[]> {
  const lookups = FK_LOOKUPS[tableName];
  if (!lookups || Object.keys(lookups).length === 0 || data.length === 0) return data;

  // Detectar quais colunas com lookup existem nos dados
  const firstRow = data[0];
  const columnsToResolve = Object.keys(lookups).filter((col) => col in firstRow);
  if (columnsToResolve.length === 0) return data;

  for (const col of columnsToResolve) {
    const lookup = lookups[col];
    const cacheKey = `${lookup.table}.${lookup.nameField}`;

    if (!fkNameCache[cacheKey]) {
      fkNameCache[cacheKey] = {};
    }

    // Coletar UUIDs unicos nao-nulos
    const ids = [
      ...new Set(
        data
          .map((row) => row[col])
          .filter((v): v is string => typeof v === "string" && v.length > 0)
      ),
    ];
    if (ids.length === 0) continue;

    // Buscar apenas IDs que nao estao no cache
    const missingIds = ids.filter((id) => !(id in fkNameCache[cacheKey]));

    if (missingIds.length > 0) {
      const { data: lookupData } = await supabase
        .from(lookup.table)
        .select(`id,${lookup.nameField}`)
        .in("id", missingIds);

      if (lookupData) {
        for (const row of lookupData as unknown as Record<string, unknown>[]) {
          fkNameCache[cacheKey][String(row.id)] = String(row[lookup.nameField] || "");
        }
      }
    }

    // Substituir UUIDs por nomes nos dados
    data = data.map((row) => {
      const id = row[col];
      if (typeof id === "string" && fkNameCache[cacheKey][id]) {
        return { ...row, [col]: fkNameCache[cacheKey][id] };
      }
      return row;
    });
  }

  return data;
}

export async function fetchLookupOptions(tableName: string, column: string): Promise<LookupOption[]> {
  const cacheKey = `${tableName}.${column}`;
  if (lookupCache[cacheKey]) return lookupCache[cacheKey];

  const lookup = FK_LOOKUPS[tableName]?.[column];
  if (!lookup) return [];

  const { data, error } = await supabase
    .from(lookup.table)
    .select(`id,${lookup.nameField}`)
    .order(lookup.nameField, { ascending: true });

  if (error || !data) return [];

  const rows = data as unknown as Record<string, unknown>[];
  const options = rows.map((row) => ({
    id: String(row.id),
    label: String(row[lookup.nameField] || ""),
  }));

  lookupCache[cacheKey] = options;
  return options;
}

export function hasLookup(tableName: string, column: string): boolean {
  return !!FK_LOOKUPS[tableName]?.[column];
}

export async function fetchTableColumns(tableName: string): Promise<ColumnMeta[]> {
  const { data, error } = await supabase.from(tableName).select("*").limit(0);

  if (error) {
    // Fallback: query information_schema
    const { data: cols } = await supabase
      .rpc("get_table_columns", { p_table_name: tableName })
      .select("*");

    if (cols && Array.isArray(cols)) {
      return cols.map((c: Record<string, string>) => ({
        name: c.column_name,
        data_type: c.data_type,
        format: c.udt_name || c.data_type,
      }));
    }
    return [];
  }

  // If select works, we can infer columns from the response metadata
  // But for empty results, we need the column names from elsewhere
  // Supabase doesn't return column metadata directly, so we try a different approach
  if (data && data.length > 0) {
    return Object.keys(data[0]).map((name) => ({
      name,
      data_type: typeof data[0][name] === "number" ? "numeric" : "text",
      format: "text",
    }));
  }

  // Try to get one row to discover columns
  const { data: sample } = await supabase.from(tableName).select("*").limit(1);
  if (sample && sample.length > 0) {
    return Object.keys(sample[0]).map((name) => {
      const val = sample[0][name];
      let dataType = "text";
      if (typeof val === "number") dataType = "numeric";
      else if (typeof val === "boolean") dataType = "boolean";
      else if (val && typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val)) dataType = "timestamp with time zone";
      else if (val && typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}/.test(val)) dataType = "uuid";
      return { name, data_type: dataType, format: dataType };
    });
  }

  return [];
}

export async function executeQuery(state: QueryState): Promise<QueryResult> {
  const start = performance.now();

  try {
    // Build select string
    let selectStr = "*";
    if (state.selectedColumns.length > 0) {
      // Include join columns
      const mainCols = state.selectedColumns.join(",");
      const joinSelects = state.joins.map((j) => {
        const cols = j.selectedColumns.length > 0 ? j.selectedColumns.join(",") : "*";
        return `${j.toTable}!${j.fromColumn}(${cols})`;
      });
      selectStr = joinSelects.length > 0 ? [mainCols, ...joinSelects].join(",") : mainCols;
    } else if (state.joins.length > 0) {
      const joinSelects = state.joins.map((j) => {
        const cols = j.selectedColumns.length > 0 ? j.selectedColumns.join(",") : "*";
        return `${j.toTable}!${j.fromColumn}(${cols})`;
      });
      selectStr = ["*", ...joinSelects].join(",");
    }

    let query = supabase
      .from(state.table)
      .select(selectStr, { count: "exact" });

    // Fixed filter: leads only show novo_crm = true
    if (state.table === "leads") {
      query = query.eq("novo_crm", true);
    }

    // Apply filters
    for (const filter of state.filters) {
      if (!filter.column || !filter.operator) continue;

      switch (filter.operator) {
        case "eq":
          query = query.eq(filter.column, filter.value);
          break;
        case "neq":
          query = query.neq(filter.column, filter.value);
          break;
        case "gt":
          query = query.gt(filter.column, filter.value);
          break;
        case "gte":
          query = query.gte(filter.column, filter.value);
          break;
        case "lt":
          query = query.lt(filter.column, filter.value);
          break;
        case "lte":
          query = query.lte(filter.column, filter.value);
          break;
        case "like":
          query = query.like(filter.column, `%${filter.value}%`);
          break;
        case "ilike":
          query = query.ilike(filter.column, `%${filter.value}%`);
          break;
        case "is_null":
          query = query.is(filter.column, null);
          break;
        case "is_not_null":
          query = query.not(filter.column, "is", null);
          break;
        case "in":
          query = query.in(
            filter.column,
            filter.value.split(",").map((v) => v.trim())
          );
          break;
      }
    }

    // Apply ordering
    if (state.orderBy) {
      query = query.order(state.orderBy, {
        ascending: state.orderDirection === "asc",
      });
    }

    // Apply pagination
    const from = state.page * state.pageSize;
    const to = from + state.pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    const executionTime = performance.now() - start;

    if (error) {
      return { data: [], count: 0, error: error.message, executionTime };
    }

    // Resolver FKs (ex: UUIDs de vendedores -> nomes)
    const resolvedData = await resolveFKNames(
      (data as unknown as Record<string, unknown>[]) || [],
      state.table
    );

    return {
      data: resolvedData,
      count: count || 0,
      error: null,
      executionTime,
    };
  } catch (err) {
    const executionTime = performance.now() - start;
    return {
      data: [],
      count: 0,
      error: err instanceof Error ? err.message : "Erro desconhecido",
      executionTime,
    };
  }
}

export async function fetchAllForExport(
  state: QueryState,
  onProgress?: (loaded: number) => void
): Promise<QueryResult> {
  const start = performance.now();

  try {
    let selectStr = state.selectedColumns.length > 0 ? state.selectedColumns.join(",") : "*";

    if (state.joins.length > 0) {
      const joinSelects = state.joins.map((j) => {
        const cols = j.selectedColumns.length > 0 ? j.selectedColumns.join(",") : "*";
        return `${j.toTable}!${j.fromColumn}(${cols})`;
      });
      selectStr = [selectStr, ...joinSelects].join(",");
    }

    const buildQuery = () => {
      let query = supabase
        .from(state.table)
        .select(selectStr);

      if (state.table === "leads") {
        query = query.eq("novo_crm", true);
      }

      for (const filter of state.filters) {
        if (!filter.column || !filter.operator) continue;
        switch (filter.operator) {
          case "eq": query = query.eq(filter.column, filter.value); break;
          case "neq": query = query.neq(filter.column, filter.value); break;
          case "gt": query = query.gt(filter.column, filter.value); break;
          case "gte": query = query.gte(filter.column, filter.value); break;
          case "lt": query = query.lt(filter.column, filter.value); break;
          case "lte": query = query.lte(filter.column, filter.value); break;
          case "like": query = query.like(filter.column, `%${filter.value}%`); break;
          case "ilike": query = query.ilike(filter.column, `%${filter.value}%`); break;
          case "is_null": query = query.is(filter.column, null); break;
          case "is_not_null": query = query.not(filter.column, "is", null); break;
          case "in": query = query.in(filter.column, filter.value.split(",").map((v) => v.trim())); break;
        }
      }

      if (state.orderBy) {
        query = query.order(state.orderBy, { ascending: state.orderDirection === "asc" });
      }

      return query;
    };

    const MAX_EXPORT = 10000;
    let pageSize = 500;
    const allData: Record<string, unknown>[] = [];

    for (let offset = 0; offset < MAX_EXPORT;) {
      const query = buildQuery();
      const { data, error } = await query.range(offset, offset + pageSize - 1);

      if (error) {
        if (error.message.includes("statement timeout") && pageSize > 50) {
          pageSize = Math.max(50, Math.floor(pageSize / 2));
          continue; // retry same offset with smaller page
        }
        return { data: allData, count: allData.length, error: error.message, executionTime: performance.now() - start };
      }

      if (!data || data.length === 0) break;
      allData.push(...(data as unknown as Record<string, unknown>[]));
      onProgress?.(allData.length);
      if (data.length < pageSize) break;
      offset += pageSize;
    }

    // Resolver FKs para export tambem
    const resolvedData = await resolveFKNames(allData, state.table);
    return { data: resolvedData, count: resolvedData.length, error: null, executionTime: performance.now() - start };
  } catch (err) {
    return {
      data: [],
      count: 0,
      error: err instanceof Error ? err.message : "Erro desconhecido",
      executionTime: performance.now() - start,
    };
  }
}
