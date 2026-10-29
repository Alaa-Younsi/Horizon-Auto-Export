import { toLocalDay } from "./format";

/**
 * Spreadsheet formula-injection guard: free text a visitor typed ("=HYPERLINK…",
 * "+cmd…") would otherwise execute for whoever opens the export. A leading quote
 * makes Excel/Sheets show it as literal text.
 */
export function cellSafe(value: string | null | undefined): string {
  const v = value ?? "";
  return /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
}

export interface ExportColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
  width?: number;
}

/** Excel export, code-split (write-excel-file is only fetched when someone exports). */
export async function exportXlsx<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  baseName: string,
): Promise<void> {
  const { default: writeXlsxFile } = await import("write-excel-file");
  const header = columns.map((c) => ({ value: c.header, fontWeight: "bold" as const }));
  const body = rows.map((row) =>
    columns.map((c) => {
      const v = c.value(row);
      return typeof v === "number"
        ? { value: v, type: Number }
        : { value: cellSafe(v), type: String };
    }),
  );
  await writeXlsxFile([header, ...body], {
    columns: columns.map((c) => ({ width: c.width ?? 18 })),
    fileName: `${baseName}-${toLocalDay()}.xlsx`,
  });
}

/** CSV with a UTF-8 BOM (or Excel renders accented headers as mojibake). */
export function exportCsv<T>(rows: T[], columns: ExportColumn<T>[], baseName: string): void {
  const esc = (v: string | number | null | undefined) => {
    const s = typeof v === "number" ? String(v) : cellSafe(v);
    return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    columns.map((c) => esc(c.header)).join(";"),
    ...rows.map((r) => columns.map((c) => esc(c.value(r))).join(";")),
  ];
  const blob = new Blob([`﻿${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${baseName}-${toLocalDay()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Strip PostgREST filter grammar (`,()`) and escape ILIKE wildcards before building an .or() string. */
export function sanitizeSearchTerm(term: string): string {
  return term
    .replace(/[,()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[\\%_]/g, "\\$&")
    .slice(0, 80);
}
