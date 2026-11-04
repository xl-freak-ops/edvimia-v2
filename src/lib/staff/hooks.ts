import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Staff = Tables<"staff">;
export type StaffAssignment = Tables<"staff_assignments">;
export type StaffLeave = Tables<"staff_leave_requests">;
export type StaffAttendance = Tables<"staff_attendance">;
export type StaffDoc = Tables<"staff_documents">;

export const staffKeys = {
  list: (sid: string) => ["staff", sid] as const,
  detail: (id: string) => ["staff", "detail", id] as const,
  assignments: (id: string) => ["staff", "assignments", id] as const,
  leave: (sid: string) => ["staff", "leave", sid] as const,
  attendance: (sid: string) => ["staff", "attendance", sid] as const,
  docs: (id: string) => ["staff", "docs", id] as const,
};

export function useStaffList(schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!schoolId,
    queryKey: staffKeys.list(schoolId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("school_id", schoolId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useStaff(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: staffKeys.detail(id ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("*, schools(name)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useStaffAssignments(staffId: string | undefined) {
  return useQuery({
    enabled: !!staffId,
    queryKey: staffKeys.assignments(staffId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_assignments")
        .select("*, subjects(name), classes(name), class_arms(name)")
        .eq("staff_id", staffId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useStaffLeave(schoolId: string | null | undefined, staffId?: string) {
  return useQuery({
    enabled: !!schoolId,
    queryKey: [...staffKeys.leave(schoolId ?? ""), staffId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("staff_leave_requests")
        .select("*, staff(full_name, staff_code)")
        .eq("school_id", schoolId!)
        .order("created_at", { ascending: false });
      if (staffId) q = q.eq("staff_id", staffId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useStaffAttendance(schoolId: string | null | undefined, staffId?: string) {
  return useQuery({
    enabled: !!schoolId,
    queryKey: [...staffKeys.attendance(schoolId ?? ""), staffId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("staff_attendance")
        .select("*")
        .eq("school_id", schoolId!)
        .order("attendance_date", { ascending: false })
        .limit(500);
      if (staffId) q = q.eq("staff_id", staffId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useStaffDocs(staffId: string | undefined) {
  return useQuery({
    enabled: !!staffId,
    queryKey: staffKeys.docs(staffId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_documents")
        .select("*")
        .eq("staff_id", staffId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateStaff(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<"staff">) => {
      const { data, error } = await supabase.from("staff").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKeys.list(schoolId) }),
  });
}

/**
 * Sends an email invite to a staff member via the invite-staff edge function.
 * The edge function uses the service-role key to call
 * auth.admin.inviteUserByEmail and pre-provisions the teacher's profile
 * (school_id) and role so they land on the right dashboard on first login.
 */
export function useMyStaff(schoolId: string | null | undefined, userId: string | null | undefined) {
  return useQuery({
    enabled: !!schoolId && !!userId,
    queryKey: ["staff", "mine", schoolId ?? "", userId ?? ""],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("id, full_name, position")
        .eq("school_id", schoolId!)
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useInviteStaff() {
  return useMutation({
    mutationFn: async ({
      email,
      full_name,
      school_id,
      position,
    }: {
      email: string;
      full_name: string;
      school_id: string;
      position?: string;
    }) => {
      // Use a raw fetch so we can read the response body before deciding
      // whether to throw. The Supabase JS functions client swallows the body
      // inside FunctionsHttpError and doesn't expose it reliably.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

      const res = await fetch(`${supabaseUrl}/functions/v1/invite-staff`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: supabaseKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          full_name,
          school_id,
          position,
          // Use VITE_APP_URL (set to the production domain) when available so
          // invite links always point to the live app regardless of which browser
          // the admin is using. Falls back to window.location.origin so it also
          // works correctly on the deployed domain without manual config.
          redirect_to: `${(import.meta.env.VITE_APP_URL as string | undefined) ?? window.location.origin}/auth/callback`,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? `Invite failed (${res.status})`);
      return body as { ok: boolean; invited: boolean };
    },
  });
}

export function useUpdateStaff(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: TablesUpdate<"staff"> }) => {
      const { data, error } = await supabase.from("staff").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: staffKeys.list(schoolId) });
      qc.invalidateQueries({ queryKey: staffKeys.detail(v.id) });
    },
  });
}

export function useDeleteStaff(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (staffId: string) => {
      // Use the delete-staff Edge Function so the auth user and user_roles are
      // fully cleaned up server-side.  A plain .delete() on the staff table
      // left the auth.users + user_roles rows behind, meaning the same person
      // could never be re-invited fresh.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

      const res = await fetch(`${supabaseUrl}/functions/v1/delete-staff`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: supabaseKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ staff_id: staffId, school_id: schoolId }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? `Delete failed (${res.status})`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKeys.list(schoolId) }),
  });
}

export function useCreateAssignment(staffId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<"staff_assignments">) => {
      const { data, error } = await supabase.from("staff_assignments").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKeys.assignments(staffId) }),
  });
}

export function useDeleteAssignment(staffId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff_assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKeys.assignments(staffId) }),
  });
}

export async function uploadStaffAsset(
  schoolId: string,
  staffIdOrTmp: string,
  kind: string,
  file: File,
): Promise<{ path: string; signedUrl: string }> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${schoolId}/${staffIdOrTmp}/${kind}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("staff-assets").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = await supabase.storage
    .from("staff-assets")
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  return { path, signedUrl: data?.signedUrl ?? "" };
}

export async function getStaffAssetUrl(path: string) {
  const { data } = await supabase.storage.from("staff-assets").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? "";
}

export function generateStaffCode(prefix = "STF"): string {
  const y = new Date().getFullYear();
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}/${y}/${rnd}`;
}

export function suggestUsername(fullName: string): string {
  const base = fullName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(".");
  return `${base}${Math.floor(10 + Math.random() * 89)}`;
}