import type { Tables } from "@/integrations/supabase/types";

type Row = Tables<"students"> & {
  classes?: { name: string } | null;
  class_arms?: { name: string } | null;
};

const COLS: { key: string; label: string; get: (r: Row) => string | number | null | undefined }[] = [
  { key: "admission_number", label: "Admission No", get: (r) => r.admission_number },
  { key: "student_code", label: "Student ID", get: (r) => r.student_code },
  { key: "surname", label: "Surname", get: (r) => r.surname },
  { key: "first_name", label: "First Name", get: (r) => r.first_name },
  { key: "middle_name", label: "Middle Name", get: (r) => r.middle_name ?? "" },
  { key: "gender", label: "Gender", get: (r) => r.gender },
  { key: "date_of_birth", label: "Date of Birth", get: (r) => r.date_of_birth ?? "" },
  { key: "class", label: "Class", get: (r) => r.classes?.name ?? "" },
  { key: "arm", label: "Arm", get: (r) => r.class_arms?.name ?? "" },
  { key: "house", label: "House", get: (r) => r.house ?? "" },
  { key: "status", label: "Status", get: (r) => r.status },
  { key: "admission_date", label: "Admission Date", get: (r) => r.admission_date ?? "" },
];

function escapeCsv(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportStudentsCsv(rows: Row[], filename = "students.csv") {
  const header = COLS.map((c) => c.label).join(",");
  const body = rows.map((r) => COLS.map((c) => escapeCsv(c.get(r))).join(",")).join("\n");
  download(`${header}\n${body}`, filename, "text/csv;charset=utf-8");
}

// Excel-compatible: use tab-separated with .xls (Excel opens both). Keep dep-free.
export function exportStudentsExcel(rows: Row[], filename = "students.xls") {
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