import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

export type Component = Tables<"assessment_components">;
export type Score = Tables<"result_scores">;
export type GradeScale = Tables<"grade_scales">;

export type ComputedRow = {
  studentId: string;
  total: number;
  max: number;
  percentage: number;
  grade: string | null;
  remark: string | null;
  position: number | null;
  scores: Record<string, number | null>;
};

/** Compute weighted total for a single student across enabled components. */
export function computeStudentTotal(
  scores: Pick<Score, "component_id" | "score">[],
  components: Component[],
): { total: number; max: number; percentage: number } {
  const enabled = components.filter((c) => c.is_enabled);
  let total = 0;
  let max = 0;
  for (const c of enabled) {
    const w = Number(c.weight) || 0;
    const ms = Number(c.max_score) || 0;
    max += w;
    const s = scores.find((x) => x.component_id === c.id);
    const v = s?.score == null ? null : Number(s.score);
    if (v != null && ms > 0) total += (v / ms) * w;
  }
  const pct = max > 0 ? Math.round((total / max) * 10000) / 100 : 0;
  return { total: Math.round(total * 100) / 100, max, percentage: pct };
}

/** Resolve grade + remark from a school's grade scale for a given percentage. */
export function resolveGrade(
  percentage: number,
  scale: GradeScale[],
): { grade: string | null; remark: string | null } {
  const band = scale.find(
    (g) => percentage >= Number(g.min_score) && percentage <= Number(g.max_score),
  );
  return { grade: band?.grade ?? null, remark: band?.remark ?? null };
}

/** Build ranked rows for a subject sheet. Position uses "1224" ranking. */
export function computeSheetRows(
  studentIds: string[],
  scores: Score[],
  components: Component[],
  scale: GradeScale[],
): ComputedRow[] {
  const rows: ComputedRow[] = studentIds.map((sid) => {
    const my = scores.filter((s) => s.student_id === sid);
    const t = computeStudentTotal(my, components);
    const g = resolveGrade(t.percentage, scale);
    const scoreMap: Record<string, number | null> = {};
    for (const c of components) {
      const found = my.find((x) => x.component_id === c.id);
      scoreMap[c.id] = found?.score == null ? null : Number(found.score);
    }
    return {
      studentId: sid,
      total: t.total,
      max: t.max,
      percentage: t.percentage,
      grade: g.grade,
      remark: g.remark,
      position: null,
      scores: scoreMap,
    };
  });
  // Rank
  const sorted = [...rows].sort((a, b) => b.percentage - a.percentage);
  let lastPct = -1;
  let lastPos = 0;
  sorted.forEach((r, i) => {
    if (r.percentage !== lastPct) {
      lastPos = i + 1;
      lastPct = r.percentage;
    }
    r.position = r.percentage > 0 ? lastPos : null;
  });
  return rows;
}

export function ordinal(n: number | null | undefined): string {
  if (n == null) return "—";
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function validateScore(v: number, max: number): string | null {
  if (Number.isNaN(v)) return "Not a number";
  if (v < 0) return "Cannot be negative";
  if (v > max) return `Max is ${max}`;
  return null;
}

export type StudentResultSummaryRow = {
  meta_id: string;
  subject_id: string;
  subject_name: string;
  term_id: string;
  term_name: string;
  is_current_term: boolean;
  total: number;
  grade: string | null;
  position: number | null;
  promotion_status: string | null;
};

/**
 * Compute a single student's published result rows (one per subject sheet)
 * directly from result_scores + assessment_components + grade_scales.
 * result_meta does not store per-subject totals/grades/positions — those are
 * always derived client-side, same as the teacher-facing results workflow.
 */
export async function computeStudentResultRows(
  studentId: string,
  schoolId: string,
): Promise<StudentResultSummaryRow[]> {
  const [{ data: sheets, error: sheetsErr }, { data: components, error: compErr }, { data: scale, error: scaleErr }] =
    await Promise.all([
      supabase
        .from("result_sheets")
        .select("id, subject_id, term_id, status, subjects(name), terms(name, is_current)")
        .eq("school_id", schoolId)
        .eq("status", "published"),
      supabase.from("assessment_components").select("*").eq("school_id", schoolId),
      supabase.from("grade_scales").select("*").eq("school_id", schoolId),
    ]);
  if (sheetsErr) throw sheetsErr;
  if (compErr) throw compErr;
  if (scaleErr) throw scaleErr;

  const sheetRows = (sheets ?? []) as Array<{
    id: string;
    subject_id: string | null;
    term_id: string | null;
    subjects: { name: string } | null;
    terms: { name: string; is_current: boolean } | null;
  }>;
  if (sheetRows.length === 0) return [];

  const { data: scores, error: scoresErr } = await supabase
    .from("result_scores")
    .select("*")
    .in("sheet_id", sheetRows.map((s) => s.id));
  if (scoresErr) throw scoresErr;

  const comps = (components ?? []) as Component[];
  const gradeScale = (scale ?? []) as GradeScale[];
  const allScores = (scores ?? []) as Score[];

  const rows: StudentResultSummaryRow[] = [];
  for (const sheet of sheetRows) {
    const sheetScores = allScores.filter((s) => s.sheet_id === sheet.id);
    const myScores = sheetScores.filter((s) => s.student_id === studentId);
    if (myScores.length === 0) continue;

    const { percentage } = computeStudentTotal(myScores, comps);
    const { grade } = resolveGrade(percentage, gradeScale);

    // Rank against every student on the same sheet ("1224" ranking).
    const studentIds = Array.from(new Set(sheetScores.map((s) => s.student_id)));
    const totals = studentIds.map((sid) => ({
      sid,
      pct: computeStudentTotal(sheetScores.filter((s) => s.student_id === sid), comps).percentage,
    }));
    totals.sort((a, b) => b.pct - a.pct);
    let lastPct = -1;
    let lastPos = 0;
    let myPosition: number | null = null;
    totals.forEach((t, i) => {
      if (t.pct !== lastPct) {
        lastPos = i + 1;
        lastPct = t.pct;
      }
      if (t.sid === studentId) myPosition = t.pct > 0 ? lastPos : null;
    });

    rows.push({
      meta_id: sheet.id,
      subject_id: sheet.subject_id ?? "",
      subject_name: sheet.subjects?.name ?? "Unknown",
      term_id: sheet.term_id ?? "",
      term_name: sheet.terms?.name ?? "Unknown",
      is_current_term: sheet.terms?.is_current ?? false,
      total: percentage,
      grade,
      position: myPosition,
      promotion_status: null,
    });
  }
  return rows;
}