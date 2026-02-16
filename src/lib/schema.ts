export interface TableColumn {
  name: string;
  data_type: string;
  format: string;
  is_nullable: boolean;
}

export interface ForeignKey {
  column: string;
  foreign_table: string;
  foreign_column: string;
}

export interface TableInfo {
  name: string;
  group: string;
  columns: TableColumn[];
  foreignKeys: ForeignKey[];
  rowCount: number;
}

// Agrupamento das tabelas por dominio de negocio
const TABLE_GROUPS: Record<string, string[]> = {
  "CRM - Leads": ["leads"],
  Vendas: ["compras"],
  "Bloqueios": ["bloqueiosCelebridades"],
};

// Relacoes conhecidas entre tabelas (FKs principais)
export const KNOWN_JOINS: Record<string, { column: string; foreignTable: string; foreignColumn: string }[]> = {
  leads: [
    { column: "etapa", foreignTable: "etapa", foreignColumn: "id" },
    { column: "funil", foreignTable: "funil", foreignColumn: "id" },
    { column: "vendedorResponsavel", foreignTable: "vendedores", foreignColumn: "id" },
    { column: "segmento", foreignTable: "segmentos", foreignColumn: "id" },
    { column: "subsegmento", foreignTable: "subsegmento", foreignColumn: "id" },
    { column: "negocio", foreignTable: "negocio", foreignColumn: "id" },
    { column: "celebridadeDesejada", foreignTable: "celebridadesReferencia", foreignColumn: "id" },
    { column: "agenciavendas", foreignTable: "agenciavendas", foreignColumn: "id" },
    { column: "segmento_mgs_id", foreignTable: "segmento_mgs", foreignColumn: "id" },
    { column: "wpp_lead", foreignTable: "wppLeads", foreignColumn: "id" },
  ],
  compras: [
    { column: "cliente_id", foreignTable: "clientes", foreignColumn: "id" },
    { column: "celebridade", foreignTable: "celebridadesReferencia", foreignColumn: "id" },
    { column: "vendedoresponsavel", foreignTable: "vendedores", foreignColumn: "id" },
    { column: "leadid", foreignTable: "leads", foreignColumn: "lead_id" },
    { column: "segmento", foreignTable: "segmentos", foreignColumn: "id" },
    { column: "subsegmento", foreignTable: "subsegmento", foreignColumn: "id" },
    { column: "imagemproposta_id", foreignTable: "imagemProposta", foreignColumn: "idproposta" },
    { column: "produto_mgs_id", foreignTable: "produtos_mgs", foreignColumn: "id" },
    { column: "classificacao_id", foreignTable: "cliente_classificacao", foreignColumn: "id" },
  ],
  clientes: [
    { column: "lead_id", foreignTable: "leads", foreignColumn: "lead_id" },
    { column: "vendedorresponsavel", foreignTable: "vendedores", foreignColumn: "id" },
    { column: "segmento", foreignTable: "segmentos", foreignColumn: "id" },
    { column: "subsegmento", foreignTable: "subsegmento", foreignColumn: "id" },
    { column: "classificacao_id", foreignTable: "cliente_classificacao", foreignColumn: "id" },
  ],
  imagemProposta: [
    { column: "id_lead", foreignTable: "leads", foreignColumn: "lead_id" },
    { column: "id_vendedor", foreignTable: "vendedores", foreignColumn: "id" },
    { column: "celebridade1", foreignTable: "celebridadesReferencia", foreignColumn: "id" },
    { column: "celebridade2", foreignTable: "celebridadesReferencia", foreignColumn: "id" },
    { column: "celebridade3", foreignTable: "celebridadesReferencia", foreignColumn: "id" },
    { column: "segmento", foreignTable: "segmentos", foreignColumn: "id" },
    { column: "subsegmento", foreignTable: "subsegmento", foreignColumn: "id" },
    { column: "negocio", foreignTable: "negocio", foreignColumn: "id" },
    { column: "pack_promocional_id", foreignTable: "pack_promocional", foreignColumn: "id" },
  ],
  agendamento: [
    { column: "leadId", foreignTable: "leads", foreignColumn: "lead_id" },
    { column: "vendedor", foreignTable: "vendedores", foreignColumn: "id" },
    { column: "tipo_agendamento", foreignTable: "tipo_agendamento", foreignColumn: "id" },
  ],
  bloqueiosCelebridades: [
    { column: "celebridade", foreignTable: "celebridadesReferencia", foreignColumn: "id" },
    { column: "subsegmento_id", foreignTable: "subsegmento", foreignColumn: "id" },
    { column: "negocio_id", foreignTable: "negocio", foreignColumn: "id" },
    { column: "tipo_bloqueio_id", foreignTable: "tipo_bloqueio", foreignColumn: "id" },
  ],
  loogsLeads: [
    { column: "lead", foreignTable: "leads", foreignColumn: "lead_id" },
    { column: "vendedor_id", foreignTable: "vendedores", foreignColumn: "id" },
    { column: "etapa_anterior", foreignTable: "etapa", foreignColumn: "id" },
    { column: "etapa_posterior", foreignTable: "etapa", foreignColumn: "id" },
  ],
  chatMessages: [
    { column: "lead_id", foreignTable: "leads", foreignColumn: "lead_id" },
  ],
  lead_telefones: [
    { column: "lead_id", foreignTable: "leads", foreignColumn: "lead_id" },
  ],
  checkout_sessions: [
    { column: "compra_id", foreignTable: "compras", foreignColumn: "id" },
    { column: "cliente_id", foreignTable: "clientes", foreignColumn: "id" },
  ],
  notas_fiscais: [
    { column: "compra_id", foreignTable: "compras", foreignColumn: "id" },
    { column: "cliente_id", foreignTable: "clientes", foreignColumn: "id" },
  ],
  producao_tasks: [
    { column: "list_id", foreignTable: "producao_lists", foreignColumn: "id" },
    { column: "status_id", foreignTable: "producao_statuses", foreignColumn: "id" },
    { column: "client_id", foreignTable: "producao_clients", foreignColumn: "id" },
    { column: "creator_id", foreignTable: "producao_members", foreignColumn: "id" },
  ],
  crm_metas_vendedor_mes: [
    { column: "vendedor_id", foreignTable: "vendedores", foreignColumn: "id" },
    { column: "grupo_id", foreignTable: "crm_metas_grupos", foreignColumn: "id" },
  ],
  etapa: [
    { column: "funil", foreignTable: "funil", foreignColumn: "id" },
  ],
  wppLeads: [
    { column: "idLead", foreignTable: "leads", foreignColumn: "lead_id" },
  ],
  anotacoes: [
    { column: "lead", foreignTable: "leads", foreignColumn: "lead_id" },
  ],
  follow_up_history: [
    { column: "lead_id", foreignTable: "leads", foreignColumn: "lead_id" },
  ],
  linha_do_tempo: [
    { column: "cliente_id", foreignTable: "clientes", foreignColumn: "id" },
  ],
};

export function getTableGroup(tableName: string): string {
  for (const [group, tables] of Object.entries(TABLE_GROUPS)) {
    if (tables.includes(tableName)) return group;
  }
  return "Outros";
}

export function getGroupedTables(): Record<string, string[]> {
  return TABLE_GROUPS;
}

export function getJoinsForTable(tableName: string) {
  return KNOWN_JOINS[tableName] || [];
}

// Colunas FK que tem lookup por nome (coluna -> { tabela, campoNome })
export const FK_LOOKUPS: Record<string, Record<string, { table: string; nameField: string }>> = {
  leads: {
    etapa: { table: "etapa", nameField: "name" },
    funil: { table: "funil", nameField: "nome" },
  },
  compras: {},
  bloqueiosCelebridades: {},
};
