import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Student = Tables<"students">;
export type Guardian = Tables<"student_guardians">;
export type StudentDoc = Tables<"student_documents">;

export const studentKeys = {
  list: (sid: string) => ["students", sid] as const,
  detail: (id: string) => ["students", "detail", id] as const,
  guardians: (id: string) => ["students", "guardians", id] as const,
  docs: (id: string) => ["students", "docs", id] as const,
  history: (id: string) => ["students", "history", id] as const,
};

export function useStudents(schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!schoolId,
    queryKey: studentKeys.list(schoolId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*, classes(name), class_arms(name)")
        .eq("school_id", schoolId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useStudent(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: studentKeys.detail(id ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*, classes(id,name), class_arms(id,name), schools(name)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useGuardians(studentId: string | undefined) {
  return useQuery({
    enabled: !!studentId,
    queryKey: studentKeys.guardians(studentId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_guardians")
        .select("*")
        .eq("student_id", studentId!)
        .order("is_primary", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useStudentDocs(studentId: string | undefined) {
  return useQuery({
    enabled: !!studentId,
    queryKey: studentKeys.docs(studentId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_documents")
        .select("*")
        .eq("student_id", studentId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useStatusHistory(studentId: string | undefined) {
  return useQuery({
    enabled: !!studentId,
    queryKey: studentKeys.history(studentId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_status_history")
        .select("*")
        .eq("student_id", studentId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateStudent(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      student: TablesInsert<"students">;
      guardians: Omit<TablesInsert<"student_guardians">, "student_id" | "school_id">[];
    }) => {
      // Step 1: create the student — if this fails, throw so the caller knows.
      const { data, error } = await supabase
        .from("students")
        .insert(payload.student)
        .select()
        .single();
      if (error) throw error;

      // Step 2: insert guardians — treated as non-fatal so a guardian RLS/DB
      // error doesn't mask a successful student creation with a misleading message.
      let guardianError: string | null = null;
      if (payload.guardians.length) {
        const rows = payload.guardians.map((g) => ({ ...g, student_id: data.id, school_id: schoolId }));
        const { error: gErr } = await supabase.from("student_guardians").insert(rows);
        if (gErr) guardianError = gErr.message;
      }

      return { student: data, guardianError };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: studentKeys.list(schoolId) }),
  });
}

export function useUpdateStudent(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: TablesUpdate<"students"> }) => {
      const { data, error } = await supabase
        .from("students")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: studentKeys.list(schoolId) });
      qc.invalidateQueries({ queryKey: studentKeys.detail(v.id) });
    },
  });
}

export function useChangeStudentStatus(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {
      id: string;
      action: string;
      to_status?: Student["status"];
      to_class_id?: string | null;
      note?: string;
      current: Student;
    }) => {
      const patch: TablesUpdate<"students"> = { status_changed_at: new Date().toISOString() };
      if (v.to_status) patch.status = v.to_status;
      if (v.to_class_id !== undefined) patch.class_id = v.to_class_id;
      if (v.note) patch.status_note = v.note;
      const { error } = await supabase.from("students").update(patch).eq("id", v.id);
      if (error) throw error;
      const { error: hErr } = await supabase.from("student_status_history").insert({
        student_id: v.id,
        school_id: schoolId,
        action: v.action,
        from_status: v.current.status,
        to_status: v.to_status ?? v.current.status,
        from_class_id: v.current.class_id,
        to_class_id: v.to_class_id ?? v.current.class_id,
        note: v.note,
      });
      if (hErr) throw hErr;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: studentKeys.list(schoolId) });
      qc.invalidateQueries({ queryKey: studentKeys.detail(v.id) });
      qc.invalidateQueries({ queryKey: studentKeys.history(v.id) });
    },
  });
}

export function useDeleteStudent(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (studentId: string) => {
      // Use the delete-student Edge Function so auth.users, user_roles,
      // parent_student_links, student_guardians, and student_documents are
      // all fully cleaned up server-side with the service-role key.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

      const res = await fetch(`${supabaseUrl}/functions/v1/delete-student`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: supabaseKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ student_id: studentId, school_id: schoolId }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? `Delete failed (${res.status})`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: studentKeys.list(schoolId) }),
  });
}

export async function uploadStudentAsset(
  schoolId: string,
  studentIdOrTmp: string,
  kind: string,
  file: File,
): Promise<{ path: string; signedUrl: string }> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${schoolId}/${studentIdOrTmp}/${kind}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("student-assets").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = await supabase.storage
    .from("student-assets")
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  return { path, signedUrl: data?.signedUrl ?? "" };
}

export function useInvitePortalUser() {
  return useMutation({
    mutationFn: async (params: {
      email: string;
      full_name: string;
      school_id: string;
      student_id: string;
      portal_role: "parent" | "student";
      relationship?: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
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
          ...params,
          redirect_to: `${(import.meta.env.VITE_APP_URL as string | undefined) ?? window.location.origin}/auth/callback`,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? `Invite failed (${res.status})`);
      return body as { ok: boolean; invited: boolean };
    },
  });
}

export function useAddGuardian(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<TablesInsert<"student_guardians">, "school_id">) => {
      const { data, error } = await supabase
        .from("student_guardians")
        .insert({ ...payload, school_id: schoolId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: studentKeys.guardians(v.student_id) });
    },
  });
}

export function useUpdateGuardian() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      student_id,
      patch,
    }: {
      id: string;
      student_id: string;
      patch: TablesUpdate<"student_guardians">;
    }) => {
      const { data, error } = await supabase
        .from("student_guardians")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return { data, student_id };
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: studentKeys.guardians(v.student_id) });
    },
  });
}

export function useDeleteGuardian() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, student_id }: { id: string; student_id: string }) => {
      const { error } = await supabase.from("student_guardians").delete().eq("id", id);
      if (error) throw error;
      return student_id;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: studentKeys.guardians(v.student_id) });
    },
  });
}

export function generateAdmissionNumber(schoolCode = "EDV"): string {
  const y = new Date().getFullYear();
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `${schoolCode}/${y}/${rnd}`;
}

export function generateStudentCode(): string {
  return `STU-${Date.now().toString(36).toUpperCase()}`;
}