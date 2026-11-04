import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  Announcement,
  AnnouncementWithSender,
  Message,
  Homework,
  HomeworkSubmission,
} from "@/lib/communication/hooks";
import { computeStudentResultRows } from "@/lib/results/calc";
import { attachSenderProfiles } from "@/lib/communication/hooks";

export type { Announcement, Message, Homework, HomeworkSubmission };

// ── Types ──────────────────────────────────────────────────

export interface MyStudentRecord {
  id: string;
  school_id: string;
  surname: string;
  first_name: string;
  middle_name: string | null;
  admission_number: string | null;
  status: string;
  gender: string | null;
  dob: string | null;
  photo_url: string | null;
  current_class_id: string | null;
  current_arm_id: string | null;
  classes: { name: string } | null;
  class_arms: { name: string } | null;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  remark: string | null;
}

export interface StudentAttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  pct: number;
}

export type { StudentResultSummaryRow as StudentResultRow } from "@/lib/results/calc";

// ── Query keys ─────────────────────────────────────────────

export const studentPortalKeys = {
  myRecord: (uid: string) => ["student-portal", "record", uid] as const,
  attendance: (sid: string) => ["student-portal", "attendance", sid] as const,
  results: (sid: string) => ["student-portal", "results", sid] as const,
  timetable: (cid: string, aid: string | null) => ["student-portal", "timetable", cid, aid ?? ""] as const,
  homework: (cid: string, aid: string | null) => ["student-portal", "homework", cid, aid ?? ""] as const,
  submissions: (sid: string) => ["student-portal", "submissions", sid] as const,
  announcements: (schId: string) => ["student-portal", "announcements", schId] as const,
  messages: (uid: string) => ["student-portal", "messages", uid] as const,
};

// ── My student record ──────────────────────────────────────

export function useMyStudentRecord(userId: string | null | undefined, schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!userId && !!schoolId,
    queryKey: studentPortalKeys.myRecord(userId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_student_links")
        .select(`
          student_id,
          students(
            id, school_id, surname, first_name, middle_name, admission_number,
            status, gender, dob, photo_url, current_class_id, current_arm_id,
            classes(name), class_arms(name)
          )
        `)
        .eq("parent_user_id", userId!)
        .eq("school_id", schoolId!)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return (data as Record<string, unknown>).students as MyStudentRecord | null;
    },
  });
}

// ── Attendance ─────────────────────────────────────────────

export function useMyAttendance(studentId: string | null | undefined) {
  return useQuery({
    enabled: !!studentId,
    queryKey: studentPortalKeys.attendance(studentId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("id, date, status, remark")
        .eq("student_id", studentId!)
        .order("date", { ascending: false })
        .limit(180);
      if (error) throw error;
      return (data ?? []) as AttendanceRecord[];
    },
  });
}

export function computeAttendanceSummary(records: AttendanceRecord[]): StudentAttendanceSummary {
  const total = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const late = records.filter((r) => r.status === "late").length;
  const pct = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 0;
  return { total, present, absent, late, pct };
}

// ── Results ────────────────────────────────────────────────

export function useMyResults(studentId: string | null | undefined, schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!studentId && !!schoolId,
    queryKey: studentPortalKeys.results(studentId ?? ""),
    queryFn: async () => computeStudentResultRows(studentId!, schoolId!),
  });
}

// ── Timetable ──────────────────────────────────────────────

export function useMyTimetable(classId: string | null | undefined, armId: string | null | undefined, schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!classId && !!schoolId,
    queryKey: studentPortalKeys.timetable(classId ?? "", armId ?? null),
    queryFn: async () => {
      let q = supabase
        .from("timetable_periods")
        .select("*, subjects(name, code), staff(first_name, last_name)")
        .eq("school_id", schoolId!)
        .eq("class_id", classId!)
        .order("day_of_week")
        .order("start_time");
      if (armId) q = q.eq("arm_id", armId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── Homework ───────────────────────────────────────────────

export function useMyHomework(classId: string | null | undefined, armId: string | null | undefined, schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!classId && !!schoolId,
    queryKey: studentPortalKeys.homework(classId ?? "", armId ?? null),
    queryFn: async () => {
      let q = supabase
        .from("homework")
        .select("*, subjects(name, code), classes(name), class_arms(name)")
        .eq("school_id", schoolId!)
        .eq("class_id", classId!)
        .eq("is_published", true)
        .order("due_date", { ascending: true });
      if (armId) q = q.eq("arm_id", armId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMySubmissions(studentId: string | null | undefined) {
  return useQuery({
    enabled: !!studentId,
    queryKey: studentPortalKeys.submissions(studentId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homework_submissions")
        .select("*")
        .eq("student_id", studentId!);
      if (error) throw error;
      return (data ?? []) as HomeworkSubmission[];
    },
  });
}

export function useSubmitHomework(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<HomeworkSubmission>) => {
      const { data, error } = await supabase
        .from("homework_submissions")
        .upsert(row as never)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["student-portal"] }),
  });
}

// ── Announcements ──────────────────────────────────────────

export function useMyAnnouncements(schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!schoolId,
    queryKey: studentPortalKeys.announcements(schoolId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("school_id", schoolId!)
        .eq("is_published", true)
        .order("is_emergency", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = await attachSenderProfiles((data ?? []) as Announcement[]);
      return rows.filter(
        (a) => a.target_roles.length === 0 || a.target_roles.includes("student")
      );
    },
  });
}

export function useMarkStudentAnnouncementRead(userId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (announcementId: string) => {
      const { error } = await supabase
        .from("announcement_reads")
        .upsert({ announcement_id: announcementId, user_id: userId! } as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["student-portal"] }),
  });
}

// ── Messages ───────────────────────────────────────────────

export function useMyMessages(userId: string | null | undefined, schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!userId && !!schoolId,
    queryKey: studentPortalKeys.messages(userId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("school_id", schoolId!)
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });
}

export function useSendStudentMessage(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Omit<Message, "id" | "created_at" | "is_read" | "read_at">) => {
      const { data, error } = await supabase
        .from("messages")
        .insert(row as never)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: studentPortalKeys.messages(vars.sender_id) }),
  });
}

export function useMarkStudentMessageRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true, read_at: new Date().toISOString() } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["student-portal"] }),
  });
}
