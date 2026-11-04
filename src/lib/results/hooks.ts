import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type ResultSheet = Tables<"result_sheets">;
export type ResultScore = Tables<"result_scores">;
export type Component = Tables<"assessment_components">;
export type ResultMeta = Tables<"result_meta">;
export type WorkflowStatus = ResultSheet["status"];

export const resultKeys = {
  components: (sid: string) => ["results", "components", sid] as const,
  sheets: (sid: string, termId: string | null) => ["results", "sheets", sid, termId ?? "-"] as const,
  sheet: (id: string) => ["results", "sheet", id] as const,
  scores: (sheetId: string) => ["results", "scores", sheetId] as const,
  scoresQuery: (sid: string, termId: string, classId: string, subjectId: string, armId: string | null) =>
    ["results", "scores-q", sid, termId, classId, subjectId, armId ?? "-"] as const,
  meta: (sid: string, termId: string) => ["results", "meta", sid, termId] as const,
  audit: (sid: string) => ["results", "audit", sid] as const,
  termScores: (sid: string, termId: string) => ["results", "term-scores", sid, termId] as const,
};

/** ---------------- Assessment components ---------------- */
export function useComponents(schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!schoolId,
    queryKey: resultKeys.components(schoolId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_components")
        .select("*")
        .eq("school_id", schoolId!)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Component[];
    },
  });
}

export function useUpsertComponent(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: TablesInsert<"assessment_components">) => {
      // Existing rows must use UPDATE by id — upsert-by-code fails when the
      // code itself has been changed (PK conflict on the existing id).
      if (row.id) {
        const { id, ...fields } = row;
        const { data, error } = await supabase
          .from("assessment_components")
          .update(fields)
          .eq("id", id)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data;
      }
      const { data, error } = await supabase
        .from("assessment_components")
        .insert(row)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: resultKeys.components(schoolId) }),
  });
}

export function useDeleteComponent(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assessment_components").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: resultKeys.components(schoolId) }),
  });
}

export function useSeedDefaultAssessments(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("seed_default_assessments", { _school_id: schoolId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: resultKeys.components(schoolId) }),
  });
}

/** ---------------- Sheets ---------------- */
export function useSheets(schoolId: string | null | undefined, termId: string | null) {
  return useQuery({
    enabled: !!schoolId,
    queryKey: resultKeys.sheets(schoolId ?? "", termId),
    queryFn: async () => {
      let q = supabase
        .from("result_sheets")
        .select("*, classes(name), class_arms(name), subjects(name,code)")
        .eq("school_id", schoolId!)
        .order("updated_at", { ascending: false });
      if (termId) q = q.eq("term_id", termId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Locate or create a sheet for a given selection, returning the row. */
export function useEnsureSheet() {
  return useMutation({
    mutationFn: async (v: {
      school_id: string;
      session_id: string | null;
      term_id: string | null;
      class_id: string;
      arm_id: string | null;
      subject_id: string;
      user_id: string | null;
    }) => {
      // Look up by unique keys (arm_id/term_id can be null)
      let q = supabase
        .from("result_sheets")
        .select("*")
        .eq("school_id", v.school_id)
        .eq("class_id", v.class_id)
        .eq("subject_id", v.subject_id);
      q = v.term_id ? q.eq("term_id", v.term_id) : q.is("term_id", null);
      q = v.arm_id ? q.eq("arm_id", v.arm_id) : q.is("arm_id", null);
      const { data: found, error: qErr } = await q.maybeSingle();
      if (qErr) throw qErr;
      if (found) return found as ResultSheet;
      const { data, error } = await supabase
        .from("result_sheets")
        .insert({
          school_id: v.school_id,
          session_id: v.session_id,
          term_id: v.term_id,
          class_id: v.class_id,
          arm_id: v.arm_id,
          subject_id: v.subject_id,
          created_by: v.user_id,
          status: "draft",
        })
        .select()
        .single();
      if (error) throw error;
      return data as ResultSheet;
    },
  });
}

export function useSheet(id: string | null | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: resultKeys.sheet(id ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("result_sheets")
        .select("*, classes(name), class_arms(name), subjects(name,code), terms(name)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useScoresForSheet(sheetId: string | null | undefined) {
  return useQuery({
    enabled: !!sheetId,
    queryKey: resultKeys.scores(sheetId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("result_scores")
        .select("*")
        .eq("sheet_id", sheetId!);
      if (error) throw error;
      return (data ?? []) as ResultScore[];
    },
  });
}

export function useSaveScores() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: TablesInsert<"result_scores">[]) => {
      if (!rows.length) return [];
      const { data, error } = await supabase
        .from("result_scores")
        .upsert(rows, {
          onConflict: "student_id,subject_id,term_id,component_id",
          ignoreDuplicates: false,
        })
        .select();
      if (error) throw error;
      return data ?? [];
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["results", "scores"] });
      qc.invalidateQueries({ queryKey: ["results", "term-scores"] });
    },
  });
}

/** ---------------- Workflow ---------------- */
export function useTransitionSheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {
      sheet: ResultSheet;
      to: WorkflowStatus;
      userId: string;
      note?: string;
    }) => {
      const patch: TablesUpdate<"result_sheets"> = { status: v.to };
      const now = new Date().toISOString();
      if (v.to === "pending_review") { patch.submitted_by = v.userId; patch.submitted_at = now; }
      if (v.to === "approved") { patch.approved_by = v.userId; patch.approved_at = now; }
      if (v.to === "published") { patch.published_by = v.userId; patch.published_at = now; }
      if (v.to === "rejected") { patch.rejected_reason = v.note ?? null; patch.reviewed_by = v.userId; patch.reviewed_at = now; }
      const { error } = await supabase.from("result_sheets").update(patch).eq("id", v.sheet.id);
      if (error) throw error;
      await supabase.from("result_audit").insert({
        school_id: v.sheet.school_id,
        sheet_id: v.sheet.id,
        actor: v.userId,
        action: `sheet:${v.to}`,
        from_status: v.sheet.status,
        to_status: v.to,
        note: v.note ?? null,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["results"] }),
  });
}

/** ---------------- Aggregates for dashboards & report cards ---------------- */
export function useTermScores(schoolId: string | null | undefined, termId: string | null | undefined) {
  return useQuery({
    enabled: !!schoolId && !!termId,
    queryKey: resultKeys.termScores(schoolId ?? "", termId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("result_scores")
        .select("*")
        .eq("school_id", schoolId!)
        .eq("term_id", termId!);
      if (error) throw error;
      return (data ?? []) as ResultScore[];
    },
  });
}

export function useResultMeta(schoolId: string | null | undefined, termId: string | null | undefined) {
  return useQuery({
    enabled: !!schoolId && !!termId,
    queryKey: resultKeys.meta(schoolId ?? "", termId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("result_meta")
        .select("*")
        .eq("school_id", schoolId!)
        .eq("term_id", termId!);
      if (error) throw error;
      return (data ?? []) as ResultMeta[];
    },
  });
}

export function useUpsertResultMeta(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: TablesInsert<"result_meta">) => {
      const { data, error } = await supabase
        .from("result_meta")
        .upsert(row, { onConflict: "student_id,term_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["results", "meta"] }),
    onSettled: () => qc.invalidateQueries({ queryKey: ["results"] }),
  });
}

export const STATUS_META: Record<WorkflowStatus, { label: string; className: string }> = {
  draft:          { label: "Draft",          className: "bg-muted text-foreground" },
  pending_review: { label: "Pending Review", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  approved:       { label: "Approved",       className: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  published:      { label: "Published",      className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  rejected:       { label: "Rejected",       className: "bg-rose-500/15 text-rose-700 dark:text-rose-300" },
};

export const NEXT_ACTIONS: Record<WorkflowStatus, { to: WorkflowStatus; label: string }[]> = {
  draft:          [{ to: "pending_review", label: "Submit for review" }],
  pending_review: [
    { to: "approved", label: "Approve" },
    { to: "rejected", label: "Reject" },
  ],
  approved:       [{ to: "published", label: "Publish" }],
  published:      [],
  rejected:       [{ to: "draft", label: "Reopen" }],
};