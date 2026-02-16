import { supabase } from "./supabase";
import type { QueryState, QueryResult, ColumnMeta } from "./types";
import { FK_LOOKUPS } from "./schema";

export interface LookupOption {
  id: string;
  label: string;
}

// Cache de lookups para evitar re-fetch
const lookupCache: Record<string, LookupOption[]> = {};

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

    return {
      data: (data as unknown as Record<string, unknown>[]) || [],
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

export async function fetchAllForExport(state: QueryState): Promise<QueryResult> {
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

    let query = supabase
      .from(state.table)
      .select(selectStr, { count: "exact" });

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

    // Supabase limits to 1000 rows per request - paginate
    const MAX_EXPORT = 10000;
    const PAGE_SIZE = 1000;
    const allData: Record<string, unknown>[] = [];

    for (let offset = 0; offset < MAX_EXPORT; offset += PAGE_SIZE) {
      const { data, error } = await query.range(offset, offset + PAGE_SIZE - 1);
      if (error) {
        return { data: allData, count: allData.length, error: error.message, executionTime: performance.now() - start };
      }
      if (!data || data.length === 0) break;
      allData.push(...(data as unknown as Record<string, unknown>[]));
      if (data.length < PAGE_SIZE) break;
    }

    return { data: allData, count: allData.length, error: null, executionTime: performance.now() - start };
  } catch (err) {
    return {
      data: [],
      count: 0,
      error: err instanceof Error ? err.message : "Erro desconhecido",
      executionTime: performance.now() - start,
    };
  }
}
