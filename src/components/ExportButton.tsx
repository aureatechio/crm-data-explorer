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
        className="flex items-center gap-1.5 bg-[var(--bg-tertiary)] hover:bg-[var(--border)] text-[var(--text-primary)] px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            Exportando...
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5" />
            Exportar
          </>
        )}
      </button>

      {showMenu && (
        <div className="absolute top-full right-0 mt-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-xl z-50 animate-fade-in overflow-hidden">
          <button
            onClick={() => doExport("csv")}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <FileText className="w-4 h-4 text-[var(--success)]" />
            Exportar CSV
          </button>
          <button
            onClick={() => doExport("xlsx")}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-[var(--accent)]" />
            Exportar XLSX
          </button>
        </div>
      )}
    </div>
  );
}
