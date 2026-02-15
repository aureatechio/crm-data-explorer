export interface Filter {
  id: string;
  column: string;
  operator: FilterOperator;
  value: string;
}

export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "like"
  | "ilike"
  | "is_null"
  | "is_not_null"
  | "in";

export interface JoinConfig {
  id: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  selectedColumns: string[];
}

export interface QueryState {
  table: string;
  selectedColumns: string[];
  filters: Filter[];
  joins: JoinConfig[];
  orderBy: string;
  orderDirection: "asc" | "desc";
  page: number;
  pageSize: number;
}

export interface QueryResult {
  data: Record<string, unknown>[];
  count: number;
  error: string | null;
  executionTime: number;
}

export interface ColumnMeta {
  name: string;
  data_type: string;
  format: string;
}

export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  eq: "=",
  neq: "!=",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  like: "Contem",
  ilike: "Contem (sem case)",
  is_null: "E vazio",
  is_not_null: "Nao e vazio",
  in: "Em lista",
};

export const OPERATORS_BY_TYPE: Record<string, FilterOperator[]> = {
  text: ["eq", "neq", "like", "ilike", "is_null", "is_not_null", "in"],
  number: ["eq", "neq", "gt", "gte", "lt", "lte", "is_null", "is_not_null"],
  date: ["eq", "neq", "gt", "gte", "lt", "lte", "is_null", "is_not_null"],
  boolean: ["eq", "is_null", "is_not_null"],
  uuid: ["eq", "neq", "is_null", "is_not_null"],
  default: ["eq", "neq", "like", "ilike", "is_null", "is_not_null"],
};

export function getOperatorsForType(dataType: string): FilterOperator[] {
  if (dataType.includes("int") || dataType.includes("numeric") || dataType.includes("float") || dataType.includes("decimal") || dataType === "smallint" || dataType === "bigint") {
    return OPERATORS_BY_TYPE.number;
  }
  if (dataType.includes("timestamp") || dataType.includes("date")) {
    return OPERATORS_BY_TYPE.date;
  }
  if (dataType === "boolean") {
    return OPERATORS_BY_TYPE.boolean;
  }
  if (dataType === "uuid") {
    return OPERATORS_BY_TYPE.uuid;
  }
  if (dataType === "text" || dataType.includes("char") || dataType.includes("varchar")) {
    return OPERATORS_BY_TYPE.text;
  }
  return OPERATORS_BY_TYPE.default;
}
