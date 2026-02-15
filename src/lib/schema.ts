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
  "CRM - Leads": [
    "leads",
    "lead_telefones",
    "loogsLeads",
    "anotacoes",
    "taskLead",
    "wppLeads",
    "leads_stage_backup",
  ],
  "CRM - Pipeline": ["funil", "etapa"],
  "CRM - Vendedores": [
    "vendedores",
    "crm_metas_grupos",
    "crm_metas_geral_mes",
    "crm_metas_vendedor_mes",
    "crm_metas_vendedores_override",
    "checkpoint_gestor",
  ],
  Vendas: [
    "compras",
    "compras_logs",
    "imagemProposta",
    "agendamento",
    "tipo_agendamento",
  ],
  Clientes: [
    "clientes",
    "cliente_classificacao",
    "linha_do_tempo",
    "logs_cliente",
  ],
  "Celebridades & Bloqueios": [
    "celebridadesReferencia",
    "celebridades",
    "bloqueiosCelebridades",
    "tipo_bloqueio",
    "previewLogoCeleb",
    "noticias",
  ],
  "Segmentos & Geo": [
    "segmentos",
    "subsegmento",
    "negocio",
    "municipios",
    "munucipios2",
    "geolocation",
    "regioesDdd",
    "agencias",
    "agenciavendas",
  ],
  Checkout: [
    "checkout_sessions",
    "checkout_config",
    "checkout_webhooks_log",
    "checkout_audit_log",
    "checkout_split_groups",
    "tentativas_pagamento",
  ],
  "Notas Fiscais & Omie": [
    "notas_fiscais",
    "notas_fiscais_logs",
    "nfeio_config",
    "nfe_emission_requests",
    "nfeio_id_map",
    "nfeio_webhook_inbox",
    "omie_sync",
  ],
  WhatsApp: ["chatMessages", "n8n_chat_histories", "playbook_messages"],
  Producao: [
    "producao_workspaces",
    "producao_spaces",
    "producao_lists",
    "producao_statuses",
    "producao_members",
    "producao_clients",
    "producao_tasks",
    "producao_task_assignees",
    "producao_tags",
    "producao_task_tags",
    "producao_checklists",
    "producao_checklist_items",
    "producao_task_watchers",
    "producao_attachments",
    "producao_custom_field_definitions",
    "producao_custom_field_values",
    "producao_comments",
    "producao_task_time_logs",
  ],
  "Atendimento Clientes": [
    "crm_atd_clientes",
    "crm_atd_mensagens",
    "crm_atd_ai_config",
    "crm_atd_ai_jobs",
    "crm_atd_ai_runs",
    "crm_atd_logs",
    "crm_atd_clientes_ignore",
    "crm_atd_admin_passwords",
    "crm_atd_status_audit",
  ],
  "Marketing & Trafego": [
    "meta_campaigns",
    "meta_insights_cache",
    "meta_insights_history",
    "campanhaTrafego",
    "dashboard_conversion_hourly",
    "dashboard_trend_events",
  ],
  Faturamento: [
    "faturamento2025",
    "faturamento2026(porforasistema)",
    "rampa_ia_2026",
    "dashboard_metricas",
    "dashboard_extractions",
    "contagem_leads",
  ],
  "SGC (Sistema Gestao)": [
    "sgc_celebridades",
    "sgc_segmentos",
    "sgc_subsegmentos",
    "sgc_negocios",
    "sgc_estados",
    "sgc_cidades",
  ],
  Configuracoes: [
    "follow_up_config",
    "follow_up_history",
    "lead_rotation_config",
    "lead_rotation_history",
    "lead_rotation_notification_config",
    "lead_notification_history",
    "meeting_reminder_config",
    "pack_promocional",
    "produtos",
    "produtos_mgs",
    "segmento_mgs",
    "user_column_permissions",
    "feriados_nacionais",
  ],
  Sistema: [
    "rate_limits",
    "security_logs",
    "activity_logs",
    "creatomate_webhooks",
    "clicksign_webhooks",
    "recorrencias",
    "recorrencias_cobrancas",
  ],
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
    { column: "funilVendedor", foreignTable: "funil", foreignColumn: "id" },
    { column: "etapaVendedorFunil", foreignTable: "etapa", foreignColumn: "id" },
    { column: "agenciavendas", foreignTable: "agenciavendas", foreignColumn: "id" },
    { column: "segmento_mgs_id", foreignTable: "segmento_mgs", foreignColumn: "id" },
    { column: "celularBot", foreignTable: "celularesBot", foreignColumn: "id" },
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
