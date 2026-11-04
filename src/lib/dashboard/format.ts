import type { Tables } from "@/integrations/supabase/types";

type AttendanceRecord = Tables<"attendance_records">;

const GOOD_STATUSES = new Set(["present", "late", "half_day"]);

/** Attendance rate per day across the given inclusive date range (YYYY-MM-DD), filling gaps with 0. */
export function buildAttendanceTrend(
  records: Pick<AttendanceRecord, "date" | "status">[],
  fromIso: string,
  toIso: string,
): Array<{ label: string; rate: number }> {
  const byDate = new Map<string, { total: number; good: number }>();
  for (const r of records) {
    const rec = byDate.get(r.date) ?? { total: 0, good: 0 };
    rec.total += 1;
    if (GOOD_STATUSES.has(r.status)) rec.good += 1;
    byDate.set(r.date, rec);
  }

  const days: Array<{ label: string; rate: number }> = [];
  const cursor = new Date(fromIso);
  const end = new Date(toIso);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    const v = byDate.get(key);
    days.push({
      label: cursor.toLocaleDateString(undefined, { weekday: "short" }),
      rate: v && v.total ? Math.round((v.good / v.total) * 100) : 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/** Overall attendance rate and distinct student count across a set of records. */
export function attendanceRateSummary(
  records: Pick<AttendanceRecord, "status" | "student_id">[],
): { avgRate: number; studentsTracked: number } {
  if (records.length === 0) return { avgRate: 0, studentsTracked: 0 };
  const good = records.filter((r) => GOOD_STATUSES.has(r.status)).length;
  const students = new Set(records.map((r) => r.student_id));
  return {
    avgRate: Math.round((good / records.length) * 100),
    studentsTracked: students.size,
  };
}
