import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate, Tables } from "@/integrations/supabase/types";

/** Tenant-scoped query keys */
export const schoolKeys = {
  school: (id: string) => ["school", id] as const,
  sessions: (id: string) => ["school", id, "sessions"] as const,
  terms: (id: string) => ["school", id, "terms"] as const,
  sections: (id: string) => ["school", id, "sections"] as const,
  classes: (id: string) => ["school", id, "classes"] as const,
  arms: (id: string) => ["school", id, "arms"] as const,
  subjects: (id: string) => ["school", id, "subjects"] as const,
  grades: (id: string) => ["school", id, "grades"] as const,
  settings: (id: string) => ["school", id, "settings"] as const,
};

export function useSchool(schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!schoolId,
    queryKey: schoolId ? schoolKeys.school(schoolId) : ["school", "none"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .eq("id", schoolId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateSchool(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: TablesUpdate<"schools">) => {
      const { data, error } = await supabase
        .from("schools")
        .update(patch)
        .eq("id", schoolId)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: schoolKeys.school(schoolId) }),
  });
}

/** Generic list hook */
function useList<T>(
  schoolId: string | null | undefined,
  table:
    | "academic_sessions"
    | "terms"
    | "sections"
    | "classes"
    | "class_arms"
    | "subjects"
    | "grade_scales",
  key: readonly unknown[],
  orderBy: string = "created_at",
  ascending = true,
) {
  return useQuery({
    enabled: !!schoolId,
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("school_id", schoolId!)
        .order(orderBy, { ascending });
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

export const useSessions = (sid: string | null | undefined) =>
  useList<Tables<"academic_sessions">>(sid, "academic_sessions", schoolKeys.sessions(sid ?? ""), "start_date", false);
export const useTerms = (sid: string | null | undefined) =>
  useList<Tables<"terms">>(sid, "terms", schoolKeys.terms(sid ?? ""), "start_date", true);
export const useSections = (sid: string | null | undefined) =>
  useList<Tables<"sections">>(sid, "sections", schoolKeys.sections(sid ?? ""), "display_order", true);
export const useClasses = (sid: string | null | undefined) =>
  useList<Tables<"classes">>(sid, "classes", schoolKeys.classes(sid ?? ""), "display_order", true);
export const useArms = (sid: string | null | undefined) =>
  useList<Tables<"class_arms">>(sid, "class_arms", schoolKeys.arms(sid ?? ""), "name", true);
export const useSubjects = (sid: string | null | undefined) =>
  useList<Tables<"subjects">>(sid, "subjects", schoolKeys.subjects(sid ?? ""), "name", true);
export const useGradeScales = (sid: string | null | undefined) =>
  useList<Tables<"grade_scales">>(sid, "grade_scales", schoolKeys.grades(sid ?? ""), "display_order", true);

export function useSchoolSettings(schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!schoolId,
    queryKey: schoolKeys.settings(schoolId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_settings")
        .select("*")
        .eq("school_id", schoolId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertSettings(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<TablesInsert<"school_settings">>) => {
      const { data, error } = await supabase
        .from("school_settings")
        .upsert({ school_id: schoolId, ...patch }, { onConflict: "school_id" })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: schoolKeys.settings(schoolId) }),
  });
}

/** Generic create / delete helpers */
export function useCreateRow<T extends "academic_sessions" | "terms" | "sections" | "classes" | "class_arms" | "subjects" | "grade_scales">(
  table: T,
  invalidate: readonly unknown[],
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: TablesInsert<T>) => {
      const { data, error } = await supabase.from(table).insert(row as never).select().maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: invalidate }),
  });
}

export function useDeleteRow(
  table: "academic_sessions" | "terms" | "sections" | "classes" | "class_arms" | "subjects" | "grade_scales",
  invalidate: readonly unknown[],
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: invalidate }),
  });
}

export function useUpdateRow(
  table: "academic_sessions" | "terms" | "sections" | "classes" | "class_arms" | "subjects" | "grade_scales",
  invalidate: readonly unknown[],
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { data, error } = await (supabase.from(table) as never as {
        update: (p: Record<string, unknown>) => {
          eq: (col: string, v: string) => { select: () => { maybeSingle: () => Promise<{ data: unknown; error: Error | null }> } };
        };
      })
        .update(patch)
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: invalidate }),
  });
}

/** Upload helper for the school-assets bucket */
export async function uploadSchoolAsset(
  schoolId: string,
  kind: "logo" | "cover",
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${schoolId}/${kind}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("school-assets").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("school-assets").createSignedUrl
    ? await supabase.storage.from("school-assets").createSignedUrl(path, 60 * 60 * 24 * 365)
    : { data: { signedUrl: "" } };
  return data?.signedUrl ?? "";
}