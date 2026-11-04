import type { Tables } from "@/integrations/supabase/types";

type Row = Tables<"staff">;

const COLS: { key: string; label: string; get: (r: Row) => string | number | null | undefined }[] = [
  { key: "staff_code", label: "Staff ID", get: (r) => r.staff_code },
  { key: "full_name", label: "Full Name", get: (r) => r.full_name },
  { key: "position", label: "Position", get: (r) => r.position },
  { key: "department", label: "Department", get: (r) => r.department ?? "" },
  { key: "email", label: "Email", get: (r) => r.email ?? "" },
  { key: "phone", label: "Phone", get: (r) => r.phone ?? "" },
  { key: "whatsapp", label: "WhatsApp", get: (r) => r.whatsapp ?? "" },
  { key: "gender", label: "Gender", get: (r) => r.gender ?? "" },
  { key: "qualification", label: "Qualification", get: (r) => r.qualification ?? "" },
  { key: "employment_date", label: "Employment Date", get: (r) => r.employment_date ?? "" },
  { key: "status", label: "Status", get: (r) => r.status },
];

function esc(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportStaffCsv(rows: Row[], filename = "staff.csv") {
  const header = COLS.map((c) => c.label).join(",");
  const body = rows.map((r) => COLS.map((c) => esc(c.get(r))).join(",")).join("\n");
  download(`${header}\n${body}`, filename, "text/csv;charset=utf-8");
}

export function exportStaffExcel(rows: Row[], filename = "staff.xls") {
  const header = COLS.map((c) => c.label).join("\t");
  const body = rows.map((r) => COLS.map((c) => c.get(r) ?? "").join("\t")).join("\n");
  download(`${header}\n${body}`, filename, "application/vnd.ms-excel");
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