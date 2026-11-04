import type { Tables } from "@/integrations/supabase/types";
import { STATUS_META } from "./hooks";

type Row = Tables<"attendance_records"> & {
  students?: { first_name?: string; surname?: string; admission_number?: string } | null;
  classes?: { name?: string } | null;
  class_arms?: { name?: string } | null;
};

function esc(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const COLS: { label: string; get: (r: Row) => string | number }[] = [
  { label: "Date", get: (r) => r.date },
  { label: "Student", get: (r) => `${r.students?.first_name ?? ""} ${r.students?.surname ?? ""}`.trim() },
  { label: "Admission No", get: (r) => r.students?.admission_number ?? "" },
  { label: "Class", get: (r) => r.classes?.name ?? "" },
  { label: "Arm", get: (r) => r.class_arms?.name ?? "" },
  { label: "Status", get: (r) => STATUS_META[r.status]?.label ?? r.status },
  { label: "Remark", get: (r) => r.remark ?? "" },
];

export function exportAttendanceCsv(rows: Row[], filename = `attendance-${Date.now()}.csv`) {
  const header = COLS.map((c) => c.label).join(",");
  const body = rows.map((r) => COLS.map((c) => esc(c.get(r))).join(",")).join("\n");
  download(`${header}\n${body}`, filename, "text/csv;charset=utf-8");
}

export function exportAttendanceExcel(rows: Row[], filename = `attendance-${Date.now()}.xls`) {
  const header = COLS.map((c) => c.label).join("\t");
  const body = rows.map((r) => COLS.map((c) => c.get(r) ?? "").join("\t")).join("\n");
  download(`${header}\n${body}`, filename, "application/vnd.ms-excel");
}
