import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type TimetablePeriod = Tables<"timetable_periods">;

export const DAYS = [
  { i: 1, short: "Mon", long: "Monday" },
  { i: 2, short: "Tue", long: "Tuesday" },
  { i: 3, short: "Wed", long: "Wednesday" },
  { i: 4, short: "Thu", long: "Thursday" },
  { i: 5, short: "Fri", long: "Friday" },
  { i: 6, short: "Sat", long: "Saturday" },
];

export const DEFAULT_PALETTE = [
  "#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#22c55e",
];

export const timetableKeys = {
  byClass: (sid: string, classId: string, armId: string | null, termId: string | null) =>
    ["timetable", sid, classId, armId ?? "-", termId ?? "-"] as const,
  bySchool: (sid: string, termId: string | null) => ["timetable-school", sid, termId ?? "-"] as const,
  byTeacher: (staffId: string, termId: string | null) => ["timetable-teacher", staffId, termId ?? "-"] as const,
};

export function useTimetable(params: {
  schoolId: string | null | undefined;
  classId: string | null;
  armId: string | null;
  termId: string | null;
}) {
  const { schoolId, classId, armId, termId } = params;
  return useQuery({
    enabled: !!schoolId && !!classId,
    queryKey: timetableKeys.byClass(schoolId ?? "", classId ?? "", armId, termId),
    queryFn: async () => {
      let q = supabase
        .from("timetable_periods")
        .select("*")
        .eq("school_id", schoolId!)
        .eq("class_id", classId!)
        .order("day_of_week")
        .order("period_index");
      if (armId) q = q.eq("arm_id", armId);
      if (termId) q = q.eq("term_id", termId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSchoolTimetable(schoolId: string | null | undefined, termId: string | null) {
  return useQuery({
    enabled: !!schoolId,
    queryKey: timetableKeys.bySchool(schoolId ?? "", termId),
    queryFn: async () => {
      let q = supabase.from("timetable_periods").select("*").eq("school_id", schoolId!);
      if (termId) q = q.eq("term_id", termId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTeacherTimetable(teacherId: string | null | undefined, termId: string | null) {
  return useQuery({
    enabled: !!teacherId,
    queryKey: timetableKeys.byTeacher(teacherId ?? "", termId),
    queryFn: async () => {
      let q = supabase
        .from("timetable_periods")
        .select("*")
        .eq("teacher_id", teacherId!)
        .order("day_of_week")
        .order("period_index");
      if (termId) q = q.eq("term_id", termId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreatePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: TablesInsert<"timetable_periods">) => {
      const { data, error } = await supabase.from("timetable_periods").insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["timetable"] });
      qc.invalidateQueries({ queryKey: ["timetable-school"] });
      qc.invalidateQueries({ queryKey: ["timetable-teacher"] });
    },
  });
}

export function useUpdatePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: TablesUpdate<"timetable_periods"> }) => {
      const { data, error } = await supabase.from("timetable_periods").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["timetable"] });
      qc.invalidateQueries({ queryKey: ["timetable-school"] });
      qc.invalidateQueries({ queryKey: ["timetable-teacher"] });
    },
  });
}

export function useDeletePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("timetable_periods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["timetable"] });
      qc.invalidateQueries({ queryKey: ["timetable-school"] });
      qc.invalidateQueries({ queryKey: ["timetable-teacher"] });
    },
  });
}

export function detectConflicts(all: TimetablePeriod[]): Map<string, string[]> {
  // Returns a map from period id -> list of conflict reasons
  const map = new Map<string, string[]>();
  const push = (id: string, msg: string) => {
    const arr = map.get(id) ?? [];
    if (!arr.includes(msg)) arr.push(msg);
    map.set(id, arr);
  };
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const a = all[i], b = all[j];
      if (a.day_of_week !== b.day_of_week) continue;
      const overlap = a.start_time < b.end_time && b.start_time < a.end_time;
      if (!overlap) continue;
      if (a.teacher_id && a.teacher_id === b.teacher_id) {
        push(a.id, "Teacher double-booked"); push(b.id, "Teacher double-booked");
      }
      if (a.room && b.room && a.room === b.room) {
        push(a.id, "Room clash"); push(b.id, "Room clash");
      }
      if (a.class_id === b.class_id && (a.arm_id ?? null) === (b.arm_id ?? null)) {
        push(a.id, "Class overlap"); push(b.id, "Class overlap");
      }
    }
  }
  return map;
}