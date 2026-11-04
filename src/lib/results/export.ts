import type { Tables } from "@/integrations/supabase/types";
import { computeStudentTotal, resolveGrade, ordinal, type Component, type Score, type GradeScale } from "./calc";

type Student = Tables<"students"> & { classes?: { name?: string } | null; class_arms?: { name?: string } | null };
type Subject = Tables<"subjects">;

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

/** Build a per-student, per-subject percentage/grade table for a term and export it. */
export function exportResultsCsv(params: {
  scores: Score[];
  components: Component[];
  students: Student[];
  subjects: Subject[];
  gradeScale: GradeScale[];
  filename?: string;
}) {
  const { scores, components, students, subjects, gradeScale, filename = `results-${Date.now()}.csv` } = params;
  const rows: string[] = [];
  const header = ["Student", "Admission No", "Class", "Arm", "Subject", "Score %", "Grade", "Remark", "Position"];
  rows.push(header.join(","));

  for (const subject of subjects) {
    const subjectStudents = students.filter((s) =>
      scores.some((sc) => sc.student_id === s.id && sc.subject_id === subject.id),
    );
    const computed = subjectStudents.map((s) => {
      const list = scores.filter((sc) => sc.student_id === s.id && sc.subject_id === subject.id);
      const { percentage } = computeStudentTotal(list, components);
      const { grade, remark } = resolveGrade(percentage, gradeScale);
      return { student: s, percentage, grade, remark };
    });
    const ranked = [...computed].sort((a, b) => b.percentage - a.percentage);
    let lastPct = -1, lastPos = 0;
    const posMap = new Map<string, number>();
    ranked.forEach((r, i) => {
      if (r.percentage !== lastPct) { lastPos = i + 1; lastPct = r.percentage; }
      posMap.set(r.student.id, lastPos);
    });
    for (const c of computed) {
      rows.push(
        [
          esc(`${c.student.first_name} ${c.student.surname}`),
          esc(c.student.admission_number),
          esc(c.student.classes?.name ?? ""),
          esc(c.student.class_arms?.name ?? ""),
          esc(subject.name),
          c.percentage,
          esc(c.grade ?? ""),
          esc(c.remark ?? ""),
          esc(ordinal(posMap.get(c.student.id) ?? null)),
        ].join(","),
      );
    }
  }
  download(rows.join("\n"), filename, "text/csv;charset=utf-8");
}
