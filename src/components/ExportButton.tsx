"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { fetchAllForExport } from "@/lib/query-engine";
import type { QueryState } from "@/lib/types";

interface ExportButtonProps {
  queryState: QueryState;
  disabled: boolean;
}

function flattenRow(row: Record<string, unknown>, prefix = ""): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flattenRow(value as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

export default function ExportButton({ queryState, disabled }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const doExport = async (format: "csv" | "xlsx") => {
    setIsExporting(true);
    setShowMenu(false);

    try {
      const result = await fetchAllForExport(queryState);

      if (result.error) {
        alert(`Erro na exportacao: ${result.error}`);
        return;
      }

      const flatData = result.data.map((row) => flattenRow(row));
      const ws = XLSX.utils.json_to_sheet(flatData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, queryState.table);

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${queryState.table}_${timestamp}`;

      if (format === "csv") {
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob(["\uFEFF" + csv], {
          type: "text/csv;charset=utf-8",
        });
        saveAs(blob, `${filename}.csv`);
      } else {
        const xlsxBuffer = XLSX.write(wb, {
          bookType: "xlsx",
          type: "array",
        });
        const blob = new Blob([xlsxBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        saveAs(blob, `${filename}.xlsx`);
      }
    } catch (err) {
      alert(`Erro: ${err instanceof Error ? err.message : "Desconhecido"}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled || isExporting}
        className="inline-flex items-center gap-2 bg-[var(--md-surface-container)] hover:bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)] px-4 py-2.5 rounded-full text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <>
            <div className="w-4 h-4 border-2 border-[var(--md-primary)] border-t-transparent rounded-full animate-spin" />
            Exportando...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Exportar
          </>
        )}
      </button>

      {showMenu && (
        <div className="absolute top-full right-0 mt-2 bg-[var(--md-surface)] rounded-xl overflow-hidden z-50 animate-fade-in min-w-[180px]" style={{ boxShadow: 'var(--md-elevation-2)' }}>
          <button
            onClick={() => doExport("csv")}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container-low)] transition-colors"
          >
            <FileText className="w-5 h-5 text-[var(--md-success)]" />
            Exportar CSV
          </button>
          <button
            onClick={() => doExport("xlsx")}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container-low)] transition-colors"
          >
            <FileSpreadsheet className="w-5 h-5 text-[var(--md-primary)]" />
            Exportar XLSX
          </button>
        </div>
      )}
    </div>
  );
}
