import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  Announcement,
  AnnouncementWithSender,
  Message,
  ParentStudentLink,
  Homework,
} from "@/lib/communication/hooks";
import { computeStudentResultRows } from "@/lib/results/calc";
import { attachSenderProfiles } from "@/lib/communication/hooks";

// Re-export shared types for convenience
export type { Announcement, Message, ParentStudentLink };

// ── Student record type ────────────────────────────────────

export interface StudentRecord {
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
  blood_group: string | null;
}

export interface ChildSummary {
  link: ParentStudentLink;
  student: StudentRecord & {
    classes: { name: string } | null;
    class_arms: { name: string } | null;
  };
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  pct: number;
}

export type { StudentResultSummaryRow as ResultSummaryRow } from "@/lib/results/calc";

// ── Query keys ─────────────────────────────────────────────

export const parentKeys = {
  linked: (uid: string) => ["parent", "linked", uid] as const,
  attendance: (sid: string) => ["parent", "attendance", sid] as const,
  results: (sid: string) => ["parent", "results", sid] as const,
  invoices: (sid: string) => ["parent", "invoices", sid] as const,
  announcements: (schId: string) => ["parent", "announcements", schId] as const,
  messages: (uid: string) => ["parent", "messages", uid] as const,
  timetable: (cid: string, aid: string | null) => ["parent", "timetable", cid, aid ?? ""] as const,
  homework: (cid: string, aid: string | null) => ["parent", "homework", cid, aid ?? ""] as const,
};

// ── Linked children ────────────────────────────────────────

export function useLinkedStudents(parentUserId: string | null | undefined, schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!parentUserId && !!schoolId,
    queryKey: parentKeys.linked(parentUserId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_student_links")
        .select(`
          id, school_id, parent_user_id, student_id, relationship, is_primary, created_at,
          students(
            id, school_id, surname, first_name, middle_name, admission_number, status,
            gender, dob, photo_url, current_class_id, current_arm_id, blood_group,
            classes(name), class_arms(name)
          )
        `)
        .eq("parent_user_id", parentUserId!)
        .eq("school_id", schoolId!);
      if (error) throw error;
      return (data ?? []).map((row: Record<string, unknown>) => ({
        link: {
          id: row.id,
          school_id: row.school_id,
          parent_user_id: row.parent_user_id,
          student_id: row.student_id,
          relationship: row.relationship,
          is_primary: row.is_primary,
          created_at: row.created_at,
        } as ParentStudentLink,
        student: row.students as ChildSummary["student"],
      })) as ChildSummary[];
    },
  });
}

// ── Attendance ─────────────────────────────────────────────

export function useChildAttendance(studentId: string | null | undefined, limit = 180) {
  return useQuery({
    enabled: !!studentId,
    queryKey: [...parentKeys.attendance(studentId ?? ""), limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("id, date, status, remark")
        .eq("student_id", studentId!)
        .order("date", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useChildAttendanceSummary(studentId: string | null | undefined): AttendanceSummary {
  const { data = [] } = useChildAttendance(studentId);
  const total = data.length;
  const present = data.filter((r) => r.status === "present").length;
  const absent = data.filter((r) => r.status === "absent").length;
  const late = data.filter((r) => r.status === "late").length;
  const excused = data.filter((r) => r.status === "excused" || r.status === "medical").length;
  const pct = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 0;
  return { total, present, absent, late, excused, pct };
}

// ── Results ────────────────────────────────────────────────

export function useChildResults(studentId: string | null | undefined, schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!studentId && !!schoolId,
    queryKey: parentKeys.results(studentId ?? ""),
    queryFn: async () => computeStudentResultRows(studentId!, schoolId!),
  });
}

// ── Finance / Invoices ─────────────────────────────────────

export function useChildInvoices(studentId: string | null | undefined, schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!studentId && !!schoolId,
    queryKey: parentKeys.invoices(studentId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, status, subtotal, discount_total, penalty_total, total, due_date, term_id, terms(name)")
        .eq("student_id", studentId!)
        .eq("school_id", schoolId!)
        .order("due_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useChildPayments(studentId: string | null | undefined, schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!studentId && !!schoolId,
    queryKey: [...parentKeys.invoices(studentId ?? ""), "payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, amount, method, reference, created_at, invoice_id")
        .eq("student_id", studentId!)
        .eq("school_id", schoolId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── Announcements for parents ──────────────────────────────

export function useParentAnnouncements(schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!schoolId,
    queryKey: parentKeys.announcements(schoolId ?? ""),
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
        (a) => a.target_roles.length === 0 || a.target_roles.includes("parent")
      );
    },
  });
}

// ── Messages ───────────────────────────────────────────────

export function useParentMessages(userId: string | null | undefined, schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!userId && !!schoolId,
    queryKey: parentKeys.messages(userId ?? ""),
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

export function useSendParentMessage(schoolId: string) {
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
      qc.invalidateQueries({ queryKey: parentKeys.messages(vars.sender_id) }),
  });
}

// ── Timetable & Homework for child ────────────────────────

export function useChildTimetable(classId: string | null | undefined, armId: string | null | undefined, schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!classId && !!schoolId,
    queryKey: parentKeys.timetable(classId ?? "", armId ?? null),
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

export function useChildHomework(classId: string | null | undefined, armId: string | null | undefined, schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!classId && !!schoolId,
    queryKey: parentKeys.homework(classId ?? "", armId ?? null),
    queryFn: async () => {
      let q = supabase
        .from("homework")
        .select("*, subjects(name, code)")
        .eq("school_id", schoolId!)
        .eq("class_id", classId!)
        .eq("is_published", true)
        .gte("due_date", new Date(Date.now() - 14 * 86400_000).toISOString().slice(0, 10))
        .order("due_date");
      if (armId) q = q.eq("arm_id", armId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMarkParentAnnouncementRead(userId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (announcementId: string) => {
      const { error } = await supabase
        .from("announcement_reads")
        .upsert({ announcement_id: announcementId, user_id: userId! } as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parent"] }),
  });
}
