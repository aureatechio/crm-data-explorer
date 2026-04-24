import { supabase } from "./supabase";
import type { QueryState, QueryResult, ColumnMeta } from "./types";
import { FK_LOOKUPS, TEXT_COMPANIONS, getSyntheticColumns } from "./schema";

export interface LookupOption {
  id: string;
  label: string;
}

// Cache de lookups para evitar re-fetch
const lookupCache: Record<string, LookupOption[]> = {};

// Cache de linhas FK (tabela -> uuid -> { campo: valor }) usado para resolver
// nomes e campos extras (ex.: agencia da celebridade) sem re-fetch.
const fkRowCache: Record<string, Record<string, Record<string, string>>> = {};

/**
 * Pos-processamento: substitui UUIDs de colunas FK por nomes legiveis e
 * injeta, quando configurado, campos extras da tabela FK como novas colunas
 * virtuais (ex.: `celebridade_agencia`).
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
    const extraFields = lookup.extraFields ?? [];
    const fieldsToFetch = [lookup.nameField, ...extraFields.map((e) => e.source)];

    if (!fkRowCache[lookup.table]) {
      fkRowCache[lookup.table] = {};
    }
    const tableCache = fkRowCache[lookup.table];

    // Coletar UUIDs unicos nao-nulos
    const ids = [
      ...new Set(
        data
          .map((row) => row[col])
          .filter((v): v is string => typeof v === "string" && v.length > 0)
      ),
    ];

    // Buscar apenas IDs que nao tem todos os campos necessarios no cache
    const missingIds = ids.filter(
      (id) => !tableCache[id] || fieldsToFetch.some((f) => !(f in tableCache[id]))
    );

    if (missingIds.length > 0) {
      const { data: lookupData } = await supabase
        .from(lookup.table)
        .select(`id,${fieldsToFetch.join(",")}`)
        .in("id", missingIds);

      if (lookupData) {
        for (const row of lookupData as unknown as Record<string, unknown>[]) {
          const id = String(row.id);
          if (!tableCache[id]) tableCache[id] = {};
          for (const field of fieldsToFetch) {
            const val = row[field];
            tableCache[id][field] = val == null ? "" : String(val);
          }
        }
      }
    }

    // Substituir UUIDs por nomes e injetar campos extras como novas colunas
    data = data.map((row) => {
      const id = row[col];
      const updated: Record<string, unknown> = { ...row };

      if (typeof id === "string" && tableCache[id]) {
        const cached = tableCache[id];
        if (cached[lookup.nameField]) {
          updated[col] = cached[lookup.nameField];
        }
        for (const extra of extraFields) {
          updated[extra.target] = cached[extra.source] || null;
        }
      } else {
        // Garante presenca das colunas sinteticas mesmo quando o UUID nao resolve,
        // para o DataGrid exibir o cabecalho consistentemente.
        for (const extra of extraFields) {
          if (!(extra.target in updated)) updated[extra.target] = null;
        }
      }

      return updated;
    });
  }

  // Fallback: para UUIDs nao resolvidos, usar campo companion *text se disponivel
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const companions = TEXT_COMPANIONS[tableName];
  if (companions && Object.keys(companions).length > 0) {
    data = data.map((row) => {
      const updated = { ...row };
      for (const [col, textCol] of Object.entries(companions)) {
        const val = updated[col];
        if (
          typeof val === "string" &&
          UUID_REGEX.test(val) &&
          textCol in updated &&
          updated[textCol] != null &&
          String(updated[textCol]).length > 0
        ) {
          updated[col] = updated[textCol];
        }
      }
      return updated;
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
  const synthetic = getSyntheticColumns(tableName);

  const { data, error } = await supabase.from(tableName).select("*").limit(0);

  if (error) {
    // Fallback: query information_schema
    const { data: cols } = await supabase
      .rpc("get_table_columns", { p_table_name: tableName })
      .select("*");

    if (cols && Array.isArray(cols)) {
      const real = cols.map((c: Record<string, string>) => ({
        name: c.column_name,
        data_type: c.data_type,
        format: c.udt_name || c.data_type,
      }));
      return [...real, ...synthetic];
    }
    return synthetic;
  }

  // If select works, we can infer columns from the response metadata
  // But for empty results, we need the column names from elsewhere
  // Supabase doesn't return column metadata directly, so we try a different approach
  if (data && data.length > 0) {
    const real = Object.keys(data[0]).map((name) => ({
      name,
      data_type: typeof data[0][name] === "number" ? "numeric" : "text",
      format: "text",
    }));
    return [...real, ...synthetic];
  }

  // Try to get one row to discover columns
  const { data: sample } = await supabase.from(tableName).select("*").limit(1);
  if (sample && sample.length > 0) {
    const real = Object.keys(sample[0]).map((name) => {
      const val = sample[0][name];
      let dataType = "text";
      if (typeof val === "number") dataType = "numeric";
      else if (typeof val === "boolean") dataType = "boolean";
      else if (val && typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val)) dataType = "timestamp with time zone";
      else if (val && typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}/.test(val)) dataType = "uuid";
      return { name, data_type: dataType, format: dataType };
    });
    return [...real, ...synthetic];
  }

  return synthetic;
}

// Dada uma lista de colunas selecionadas pelo usuario, separa as colunas reais
// (que vao para o select do banco) das sinteticas (injetadas pos-query).
// Se uma sintetica foi selecionada, garante que sua FK base seja incluida na
// query para permitir a resolucao.
function splitSelectedColumns(
  tableName: string,
  selected: string[]
): { dbColumns: string[]; syntheticColumns: Set<string> } {
  const lookups = FK_LOOKUPS[tableName] ?? {};
  const syntheticToBase: Record<string, string> = {};
  for (const [baseCol, lookup] of Object.entries(lookups)) {
    for (const extra of lookup.extraFields ?? []) {
      syntheticToBase[extra.target] = baseCol;
    }
  }

  const dbColumns: string[] = [];
  const syntheticColumns = new Set<string>();
  for (const col of selected) {
    const baseCol = syntheticToBase[col];
    if (baseCol) {
      syntheticColumns.add(col);
      if (!dbColumns.includes(baseCol)) dbColumns.push(baseCol);
    } else if (!dbColumns.includes(col)) {
      dbColumns.push(col);
    }
  }
  return { dbColumns, syntheticColumns };
}

export async function executeQuery(state: QueryState): Promise<QueryResult> {
  const start = performance.now();

  try {
    // Build select string (strip colunas sinteticas, incluir base col das FKs)
    const { dbColumns } = splitSelectedColumns(state.table, state.selectedColumns);
    let selectStr = "*";
    if (dbColumns.length > 0) {
      // Include join columns
      const mainCols = dbColumns.join(",");
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
    const { dbColumns } = splitSelectedColumns(state.table, state.selectedColumns);
    let selectStr = dbColumns.length > 0 ? dbColumns.join(",") : "*";

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
