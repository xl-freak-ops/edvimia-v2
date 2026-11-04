import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ── Inline types (new tables not in generated types.ts) ────

export interface Announcement {
  id: string;
  school_id: string;
  sender_id: string | null;
  title: string;
  body: string;
  type: string;
  target_roles: string[];
  target_class_id: string | null;
  target_arm_id: string | null;
  is_emergency: boolean;
  is_published: boolean;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementWithSender extends Announcement {
  profiles: { full_name: string | null } | null;
}

export interface Message {
  id: string;
  school_id: string;
  sender_id: string;
  recipient_id: string;
  subject: string | null;
  body: string;
  message_type: string;
  parent_message_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface MessageWithParticipants extends Message {
  sender: { full_name: string | null; avatar_url: string | null } | null;
  recipient: { full_name: string | null; avatar_url: string | null } | null;
}

export interface Homework {
  id: string;
  school_id: string;
  class_id: string;
  arm_id: string | null;
  subject_id: string;
  teacher_id: string | null;
  title: string;
  description: string | null;
  due_date: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface HomeworkSubmission {
  id: string;
  school_id: string;
  homework_id: string;
  student_id: string;
  content: string | null;
  submitted_at: string;
  grade: string | null;
  feedback: string | null;
  graded_at: string | null;
  graded_by: string | null;
}

export interface ParentStudentLink {
  id: string;
  school_id: string;
  parent_user_id: string;
  student_id: string;
  relationship: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  school_id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: string;
  is_read: boolean;
  read_at: string | null;
  action_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ── Message type config ────────────────────────────────────

export const MESSAGE_TYPES = [
  { value: "announcement", label: "Announcement", color: "blue" },
  { value: "reminder", label: "Reminder", color: "amber" },
  { value: "emergency", label: "Emergency", color: "red" },
  { value: "academic", label: "Academic", color: "indigo" },
  { value: "finance", label: "Finance", color: "green" },
  { value: "event", label: "Event", color: "purple" },
  { value: "disciplinary", label: "Disciplinary", color: "rose" },
  { value: "general", label: "General", color: "gray" },
] as const;

export const ROLE_TARGETS = [
  { value: "school_admin", label: "Administrators" },
  { value: "principal", label: "Principals" },
  { value: "vice_principal", label: "Vice Principals" },
  { value: "form_teacher", label: "Form Teachers" },
  { value: "subject_teacher", label: "Subject Teachers" },
  { value: "parent", label: "Parents" },
  { value: "student", label: "Students" },
];

// ── School member type ─────────────────────────────────────

export interface SchoolMember {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
  /** false for students who have a record but no portal account (cannot receive in-app messages) */
  has_portal: boolean;
}

// ── Query key factories ────────────────────────────────────

export const communicationKeys = {
  announcements: (sid: string) => ["communication", "announcements", sid] as const,
  myAnnouncements: (sid: string, roles: string[]) => ["communication", "announcements", sid, "mine", roles] as const,
  announcement: (id: string) => ["communication", "announcement", id] as const,
  messages: (uid: string) => ["communication", "messages", uid] as const,
  notifications: (uid: string) => ["communication", "notifications", uid] as const,
  homework: (sid: string, cid?: string) => ["communication", "homework", sid, cid ?? "all"] as const,
  submissions: (hwId: string) => ["communication", "submissions", hwId] as const,
};

// ── Announcement hooks ─────────────────────────────────────

/**
 * announcements.sender_id references auth.users, not public.profiles directly,
 * so PostgREST cannot embed `profiles(...)` on this table. Fetch sender names
 * in a second query and merge them in instead.
 */
export async function attachSenderProfiles(rows: Announcement[]): Promise<AnnouncementWithSender[]> {
  const senderIds = Array.from(new Set(rows.map((r) => r.sender_id).filter((id): id is string => !!id)));
  if (senderIds.length === 0) {
    return rows.map((r) => ({ ...r, profiles: null }));
  }
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", senderIds);
  if (error) throw error;
  const byId = new Map((profiles ?? []).map((p) => [p.id, { full_name: p.full_name }]));
  return rows.map((r) => ({ ...r, profiles: r.sender_id ? byId.get(r.sender_id) ?? null : null }));
}

export function useAllAnnouncements(schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!schoolId,
    queryKey: communicationKeys.announcements(schoolId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("school_id", schoolId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return attachSenderProfiles((data ?? []) as Announcement[]);
    },
  });
}

export function usePublishedAnnouncements(schoolId: string | null | undefined, targetRoles?: string[]) {
  return useQuery({
    enabled: !!schoolId,
    queryKey: communicationKeys.myAnnouncements(schoolId ?? "", targetRoles ?? []),
    queryFn: async () => {
      let q = supabase
        .from("announcements")
        .select("*")
        .eq("school_id", schoolId!)
        .eq("is_published", true)
        .order("is_emergency", { ascending: false })
        .order("created_at", { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      const rows = await attachSenderProfiles((data ?? []) as Announcement[]);
      if (!targetRoles || targetRoles.length === 0) return rows;
      return rows.filter(
        (a) => a.target_roles.length === 0 || a.target_roles.some((r) => targetRoles.includes(r))
      );
    },
  });
}

export function useCreateAnnouncement(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<Announcement>) => {
      const { data, error } = await supabase
        .from("announcements")
        .insert(row as never)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: communicationKeys.announcements(schoolId) }),
  });
}

export function useUpdateAnnouncement(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Announcement> & { id: string }) => {
      const { data, error } = await supabase
        .from("announcements")
        .update(patch as never)
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: communicationKeys.announcements(schoolId) }),
  });
}

export function useDeleteAnnouncement(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: communicationKeys.announcements(schoolId) }),
  });
}

export function usePublishAnnouncement(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("publish_announcement", { _announcement_id: id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: communicationKeys.announcements(schoolId) }),
  });
}

export function useMarkAnnouncementRead(userId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (announcementId: string) => {
      const { error } = await supabase
        .from("announcement_reads")
        .upsert({ announcement_id: announcementId, user_id: userId! } as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["communication"] }),
  });
}

// ── School members hook ────────────────────────────────────

/**
 * Fetches all school members via the get_school_members() SECURITY DEFINER RPC.
 *
 * Why RPC instead of direct table queries:
 *   1. profiles.school_id is NULL at signup (trigger doesn't set it), so
 *      querying profiles WHERE school_id = X always returns nothing.
 *   2. The profiles RLS only allows users to read their own row, blocking
 *      cross-member lookups entirely.
 *   The RPC runs as a privileged role, joins user_roles (always has school_id)
 *   with profiles, and gates access with is_school_member() on the caller.
 */
export function useSchoolMembers(schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!schoolId,
    queryKey: ["school-members", schoolId],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc("get_school_members", {
        _school_id: schoolId!,
      });
      if (error) throw error;
      return (data ?? []) as unknown as SchoolMember[];
    },
    staleTime: 5 * 60 * 1000, // 5 min — member list changes infrequently
  });
}

// ── Message hooks ──────────────────────────────────────────

export function useMessages(userId: string | null | undefined, schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!userId && !!schoolId,
    queryKey: communicationKeys.messages(userId ?? ""),
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

export function useSendMessage(schoolId: string) {
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["communication", "messages"] }),
  });
}

export function useMarkMessageRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true, read_at: new Date().toISOString() } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["communication", "messages"] }),
  });
}

// ── Notification hooks ─────────────────────────────────────

export function useNotifications(userId: string | null | undefined, schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!userId && !!schoolId,
    queryKey: communicationKeys.notifications(userId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId!)
        .eq("school_id", schoolId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["communication", "notifications"] }),
  });
}

export function useMarkAllNotificationsRead(userId: string | null | undefined, schoolId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() } as never)
        .eq("user_id", userId!)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["communication", "notifications"] }),
  });
}

// ── Homework hooks ─────────────────────────────────────────

export function useHomework(schoolId: string | null | undefined, classId?: string | null, armId?: string | null) {
  return useQuery({
    enabled: !!schoolId,
    queryKey: communicationKeys.homework(schoolId ?? "", classId ?? undefined),
    queryFn: async () => {
      let q = supabase
        .from("homework")
        .select("*, subjects(name, code), classes(name), class_arms(name)")
        .eq("school_id", schoolId!)
        .order("due_date", { ascending: true });
      if (classId) q = q.eq("class_id", classId);
      if (armId) q = q.eq("arm_id", armId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateHomework(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<Homework>) => {
      const { data, error } = await supabase
        .from("homework")
        .insert(row as never)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: communicationKeys.homework(schoolId) }),
  });
}

export function useHomeworkSubmissions(homeworkId: string | null | undefined) {
  return useQuery({
    enabled: !!homeworkId,
    queryKey: communicationKeys.submissions(homeworkId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homework_submissions")
        .select("*, students(first_name, surname)")
        .eq("homework_id", homeworkId!);
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["communication"] }),
  });
}
