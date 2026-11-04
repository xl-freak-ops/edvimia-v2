import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type AttendanceRecord = Tables<"attendance_records">;
export type AttendanceStatus = AttendanceRecord["status"];

export const attendanceKeys = {
  byClass: (sid: string, date: string, classId: string, armId: string | null, subjectId: string | null) =>
    ["attendance", sid, date, classId, armId ?? "-", subjectId ?? "-"] as const,
  range: (sid: string, from: string, to: string) => ["attendance-range", sid, from, to] as const,
  student: (studentId: string) => ["attendance-student", studentId] as const,
};

export function useAttendanceForClass(params: {
  schoolId: string | null | undefined;
  date: string;
  classId: string | null;
  armId: string | null;
  subjectId: string | null;
}) {
  const { schoolId, date, classId, armId, subjectId } = params;
  return useQuery({
    enabled: !!schoolId && !!classId,
    queryKey: attendanceKeys.byClass(schoolId ?? "", date, classId ?? "", armId, subjectId),
    queryFn: async () => {
      let q = supabase
        .from("attendance_records")
        .select("*")
        .eq("school_id", schoolId!)
        .eq("date", date)
        .eq("class_id", classId!);
      if (armId) q = q.eq("arm_id", armId);
      if (subjectId) q = q.eq("subject_id", subjectId);
      else q = q.is("subject_id", null);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAttendanceRange(schoolId: string | null | undefined, from: string, to: string) {
  return useQuery({
    enabled: !!schoolId,
    queryKey: attendanceKeys.range(schoolId ?? "", from, to),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("school_id", schoolId!)
        .gte("date", from)
        .lte("date", to);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAttendanceForStudent(studentId: string | null | undefined) {
  return useQuery({
    enabled: !!studentId,
    queryKey: attendanceKeys.student(studentId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("student_id", studentId!)
        .order("date", { ascending: false })
        .limit(180);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      toInsert: TablesInsert<"attendance_records">[];
      toUpdate: Array<{ id: string; status: AttendanceStatus; is_finalized: boolean }>;
    }) => {
      const { toInsert, toUpdate } = payload;

      // INSERT new records
      if (toInsert.length) {
        const { error } = await supabase.from("attendance_records").insert(toInsert);
        if (error) throw new Error(error.message);
      }

      // UPDATE existing records by id — avoids the NULL subject_id conflict
      // problem where Postgres treats two NULLs as distinct in unique constraints.
      if (toUpdate.length) {
        // Batch as individual updates (Supabase JS doesn't support bulk update by id)
        await Promise.all(
          toUpdate.map(({ id, status, is_finalized }) =>
            supabase
              .from("attendance_records")
              .update({ status, is_finalized })
              .eq("id", id)
              .then(({ error }) => { if (error) throw new Error(error.message); }),
          ),
        );
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["attendance-range"] });
      qc.invalidateQueries({ queryKey: ["attendance-student"] });
    },
  });
}

export function useUpdateAttendanceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string; status: AttendanceStatus; remark?: string; actorId: string; schoolId: string; old: AttendanceStatus }) => {
      const { error } = await supabase
        .from("attendance_records")
        .update({ status: v.status, remark: v.remark ?? null, edited_by: v.actorId, edited_at: new Date().toISOString() })
        .eq("id", v.id);
      if (error) throw error;
      await supabase.from("attendance_audit").insert({
        school_id: v.schoolId,
        record_id: v.id,
        actor_id: v.actorId,
        action: "edit_status",
        old_status: v.old,
        new_status: v.status,
        note: v.remark ?? null,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
  });
}

export const STATUS_META: Record<AttendanceStatus, { label: string; short: string; color: string; ring: string }> = {
  present: { label: "Present", short: "P", color: "bg-emerald-500 text-white", ring: "ring-emerald-500" },
  absent: { label: "Absent", short: "A", color: "bg-rose-500 text-white", ring: "ring-rose-500" },
  late: { label: "Late", short: "L", color: "bg-amber-500 text-white", ring: "ring-amber-500" },
  excused: { label: "Excused", short: "E", color: "bg-sky-500 text-white", ring: "ring-sky-500" },
  medical: { label: "Medical", short: "M", color: "bg-violet-500 text-white", ring: "ring-violet-500" },
  half_day: { label: "Half Day", short: "H", color: "bg-slate-500 text-white", ring: "ring-slate-500" },
  remote: { label: "Remote", short: "R", color: "bg-teal-500 text-white", ring: "ring-teal-500" },
};

export const STATUS_ORDER: AttendanceStatus[] = ["present", "absent", "late", "excused", "medical", "half_day", "remote"];

export function attendanceRate(rows: Pick<AttendanceRecord, "status">[]): number {
  if (!rows.length) return 0;
  const good = rows.filter((r) => r.status === "present" || r.status === "late" || r.status === "half_day").length;
  return Math.round((good / rows.length) * 100);
}