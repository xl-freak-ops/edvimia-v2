import type { Tables } from "@/integrations/supabase/types";
import { computeStudentTotal } from "@/lib/results/calc";

type AttendanceRecord = Tables<"attendance_records">;
type ResultScore = Tables<"result_scores">;
type Component = Tables<"assessment_components">;
type Invoice = Tables<"invoices">;
type Payment = Tables<"payments">;

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

function monthLabel(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

/** Daily attendance rate over the given range, for a line/area chart. */
export function buildAttendanceTrend(rows: AttendanceRecord[]): Array<{ label: string; rate: number }> {
  const byDate = new Map<string, { total: number; good: number }>();
  for (const r of rows) {
    const rec = byDate.get(r.date) ?? { total: 0, good: 0 };
    rec.total += 1;
    if (r.status === "present" || r.status === "late" || r.status === "half_day") rec.good += 1;
    byDate.set(r.date, rec);
  }
  return Array.from(byDate.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, v]) => ({ label: dayLabel(date), rate: v.total ? Math.round((v.good / v.total) * 100) : 0 }));
}

/** Average result percentage grouped by subject, for a bar chart. */
export function buildResultsBySubject(
  scores: ResultScore[],
  components: Component[],
  subjects: Tables<"subjects">[],
): Array<{ label: string; avg: number }> {
  const bySubject = new Map<string, { sum: number; n: number }>();
  const seen = new Set<string>();
  for (const s of scores) {
    const key = `${s.student_id}::${s.subject_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const list = scores.filter((x) => x.student_id === s.student_id && x.subject_id === s.subject_id);
    const { percentage } = computeStudentTotal(list, components);
    const rec = bySubject.get(s.subject_id) ?? { sum: 0, n: 0 };
    rec.sum += percentage;
    rec.n += 1;
    bySubject.set(s.subject_id, rec);
  }
  return Array.from(bySubject.entries())
    .map(([id, v]) => ({ label: subjects.find((s) => s.id === id)?.name ?? "—", avg: v.n ? Math.round(v.sum / v.n) : 0 }))
    .sort((a, b) => b.avg - a.avg);
}

/** Monthly revenue collected, for a trend chart. */
export function buildRevenueTrend(payments: Payment[]): Array<{ label: string; amount: number }> {
  const byMonth = new Map<string, number>();
  for (const p of payments) {
    if (!p.paid_at) continue;
    const key = new Date(p.paid_at).toISOString().slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + Number(p.amount || 0));
  }
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, amount]) => ({ label: monthLabel(`${key}-01`), amount: Math.round(amount) }));
}

/** Enrolment count per class, for a bar chart. */
export function buildEnrollmentByClass(
  students: Array<{ class_id: string | null }>,
  classes: Tables<"classes">[],
): Array<{ label: string; count: number }> {
  const byClass = new Map<string, number>();
  for (const s of students) {
    if (!s.class_id) continue;
    byClass.set(s.class_id, (byClass.get(s.class_id) ?? 0) + 1);
  }
  return classes
    .map((c) => ({ label: c.name, count: byClass.get(c.id) ?? 0 }))
    .filter((r) => r.count > 0);
}

export function invoiceOutstanding(invoices: Invoice[]): number {
  return invoices.reduce((s, i) => s + Number((i as unknown as { balance?: number }).balance || 0), 0);
}
