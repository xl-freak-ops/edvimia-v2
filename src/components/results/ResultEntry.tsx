import * as React from "react";
import { Loader2, Save, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useSessions, useTerms, useClasses, useArms, useSubjects, useGradeScales } from "@/lib/school/hooks";
import { useStudents } from "@/lib/students/hooks";
import {
  useComponents, useEnsureSheet, useSheet, useScoresForSheet, useSaveScores,
  useTransitionSheet, STATUS_META,
} from "@/lib/results/hooks";
import { computeSheetRows, resolveGrade, validateScore } from "@/lib/results/calc";
import type { TablesInsert } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

export function ResultEntry() {
  const { school, userId } = useAuth();
  const schoolId = school?.id ?? null;
  const sessions = useSessions(schoolId);
  const terms = useTerms(schoolId);
  const classes = useClasses(schoolId);
  const arms = useArms(schoolId);
  const subjects = useSubjects(schoolId);
  const students = useStudents(schoolId);
  const grades = useGradeScales(schoolId);
  const components = useComponents(schoolId);
  const ensureSheet = useEnsureSheet();
  const saveScores = useSaveScores();
  const transition = useTransitionSheet();

  const currentSession = sessions.data?.find((s) => s.is_current) ?? sessions.data?.[0] ?? null;
  const currentTerm = terms.data?.find((t) => t.is_current) ?? terms.data?.[0] ?? null;

  const [sessionId, setSessionId] = React.useState("");
  const [termId, setTermId] = React.useState("");
  const [classId, setClassId] = React.useState("");
  const [armId, setArmId] = React.useState("");
  const [subjectId, setSubjectId] = React.useState("");
  const [sheetId, setSheetId] = React.useState<string | null>(null);

  React.useEffect(() => { if (!sessionId && currentSession) setSessionId(currentSession.id); }, [currentSession, sessionId]);
  React.useEffect(() => { if (!termId && currentTerm) setTermId(currentTerm.id); }, [currentTerm, termId]);

  const canLoad = !!schoolId && !!classId && !!subjectId && !!termId;

  React.useEffect(() => {
    if (!canLoad) { setSheetId(null); return; }
    ensureSheet.mutate({
      school_id: schoolId!, session_id: sessionId || null, term_id: termId,
      class_id: classId, arm_id: armId || null, subject_id: subjectId, user_id: userId,
    }, { onSuccess: (s) => setSheetId(s.id) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, sessionId, termId, classId, armId, subjectId, canLoad]);

  const sheet = useSheet(sheetId);
  const existing = useScoresForSheet(sheetId);

  const roster = React.useMemo(() => {
    const list = students.data ?? [];
    return list.filter((s) =>
      s.status === "active" &&
      (!classId || s.class_id === classId) &&
      (!armId || s.arm_id === armId),
    );
  }, [students.data, classId, armId]);

  const comps = (components.data ?? []).filter((c) => c.is_enabled);

  // draft[studentId][componentId] = number | null | undefined
  const [draft, setDraft] = React.useState<Record<string, Record<string, number | null>>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const next: Record<string, Record<string, number | null>> = {};
    (existing.data ?? []).forEach((s) => {
      next[s.student_id] = next[s.student_id] ?? {};
      next[s.student_id][s.component_id] = s.score == null ? null : Number(s.score);
    });
    setDraft(next);
    setErrors({});
  }, [existing.data]);

  const setCell = (studentId: string, componentId: string, raw: string, max: number) => {
    const key = `${studentId}::${componentId}`;
    if (raw === "") {
      setDraft((d) => ({ ...d, [studentId]: { ...(d[studentId] ?? {}), [componentId]: null } }));
      setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
      return;
    }
    const v = Number(raw);
    const err = validateScore(v, max);
    setErrors((e) => { const n = { ...e }; if (err) n[key] = err; else delete n[key]; return n; });
    setDraft((d) => ({ ...d, [studentId]: { ...(d[studentId] ?? {}), [componentId]: v } }));
  };

  // Keyboard navigation between cells
  const inputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>, rowIdx: number, colIdx: number) => {
    const rows = roster.length;
    const cols = comps.length;
    const move = (r: number, c: number) => {
      const t = inputRefs.current[`${r}-${c}`];
      if (t) { t.focus(); t.select(); }
    };
    if (e.key === "ArrowDown" || e.key === "Enter") { e.preventDefault(); move(Math.min(rows - 1, rowIdx + 1), colIdx); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(Math.max(0, rowIdx - 1), colIdx); }
    else if (e.key === "ArrowRight" && (e.currentTarget.selectionStart ?? 0) === e.currentTarget.value.length) {
      e.preventDefault(); move(rowIdx, Math.min(cols - 1, colIdx + 1));
    } else if (e.key === "ArrowLeft" && (e.currentTarget.selectionStart ?? 0) === 0) {
      e.preventDefault(); move(rowIdx, Math.max(0, colIdx - 1));
    }
  };

  const computed = React.useMemo(() => {
    // Convert draft to scores shape for calc
    const scoreRows = roster.flatMap((s) =>
      comps.map((c) => ({ component_id: c.id, score: draft[s.id]?.[c.id] ?? null })),
    );
    return computeSheetRows(
      roster.map((s) => s.id),
      roster.flatMap((s) => comps.map((c) => ({
        id: `${s.id}::${c.id}`, school_id: schoolId ?? "", sheet_id: sheetId, session_id: sessionId,
        term_id: termId, class_id: classId, arm_id: armId || null, subject_id: subjectId,
        student_id: s.id, component_id: c.id, score: draft[s.id]?.[c.id] ?? null,
        entered_by: userId, created_at: "", updated_at: "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any))),
      comps,
      grades.data ?? [],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, roster, comps, grades.data]);

  const dirtyCount = React.useMemo(() => {
    const existMap = new Map<string, number | null>();
    (existing.data ?? []).forEach((s) => existMap.set(`${s.student_id}::${s.component_id}`, s.score == null ? null : Number(s.score)));
    let n = 0;
    for (const sid of Object.keys(draft)) {
      for (const cid of Object.keys(draft[sid])) {
        const k = `${sid}::${cid}`;
        if ((existMap.get(k) ?? null) !== (draft[sid][cid] ?? null)) n++;
      }
    }
    return n;
  }, [draft, existing.data]);

  const save = async (finalize: boolean) => {
    if (!sheetId || !schoolId) return;
    if (Object.keys(errors).length) { toast.error("Fix invalid scores first"); return; }
    const rows: TablesInsert<"result_scores">[] = [];
    for (const s of roster) {
      for (const c of comps) {
        const v = draft[s.id]?.[c.id];
        if (v === undefined) continue;
        rows.push({
          school_id: schoolId, sheet_id: sheetId,
          session_id: sessionId || null, term_id: termId || null,
          class_id: classId || null, arm_id: armId || null,
          subject_id: subjectId, student_id: s.id, component_id: c.id,
          score: v, entered_by: userId,
        });
      }
    }
    try {
      await saveScores.mutateAsync(rows);
      if (finalize && sheet.data) {
        await transition.mutateAsync({ sheet: sheet.data, to: "pending_review", userId: userId! });
        toast.success("Submitted for review");
      } else {
        toast.success("Draft saved");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const status = sheet.data?.status ?? "draft";
  const meta = STATUS_META[status];
  const readOnly = status === "approved" || status === "published";

  return (
    <div className="space-y-4">
      <Card className="shadow-soft">
        <CardHeader className="pb-3"><CardTitle className="text-base">Result entry</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          <Select value={sessionId} onValueChange={setSessionId}>
            <SelectTrigger><SelectValue placeholder="Session" /></SelectTrigger>
            <SelectContent>
              {(sessions.data ?? []).map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={termId} onValueChange={setTermId}>
            <SelectTrigger><SelectValue placeholder="Term" /></SelectTrigger>
            <SelectContent>
              {(terms.data ?? []).filter((t) => !sessionId || t.session_id === sessionId).map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={classId} onValueChange={(v) => { setClassId(v); setArmId(""); }}>
            <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>
              {(classes.data ?? []).map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={armId} onValueChange={setArmId}>
            <SelectTrigger><SelectValue placeholder="Arm (optional)" /></SelectTrigger>
            <SelectContent>
              {(arms.data ?? []).filter((a) => !classId || a.class_id === classId).map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
            <SelectContent>
              {(subjects.data ?? []).map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader className="flex flex-col gap-3 pb-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">{roster.length} student{roster.length === 1 ? "" : "s"}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {dirtyCount ? `${dirtyCount} pending change${dirtyCount === 1 ? "" : "s"}` : "All changes saved"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("border-transparent", meta.className)}>{meta.label}</Badge>
            <Button size="sm" variant="outline" onClick={() => save(false)} disabled={saveScores.isPending || !canLoad || readOnly}>
              <Save className="mr-1.5 h-3.5 w-3.5" /> Save draft
            </Button>
            <Button size="sm" onClick={() => save(true)} disabled={saveScores.isPending || !canLoad || readOnly}>
              {saveScores.isPending || transition.isPending
                ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                : <Send className="mr-1.5 h-3.5 w-3.5" />}
              Submit for review
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!canLoad ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Pick a term, class and subject to start.</div>
          ) : comps.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No assessment components enabled. Configure them in the “Assessments” tab first.
            </div>
          ) : students.isLoading || existing.isLoading ? (
            <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : roster.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No active students in this selection.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[220px]">Student</TableHead>
                    {comps.map((c) => (
                      <TableHead key={c.id} className="w-24 text-center">
                        <div className="font-semibold">{c.code}</div>
                        <div className="text-[10px] font-normal text-muted-foreground">/{c.max_score} · {c.weight}%</div>
                      </TableHead>
                    ))}
                    <TableHead className="w-20 text-center">Total</TableHead>
                    <TableHead className="w-16 text-center">%</TableHead>
                    <TableHead className="w-16 text-center">Grade</TableHead>
                    <TableHead className="w-16 text-center">Pos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roster.map((s, ri) => {
                    const row = computed.find((r) => r.studentId === s.id);
                    const g = row ? resolveGrade(row.percentage, grades.data ?? []) : { grade: null };
                    return (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="text-sm font-medium">{s.first_name} {s.surname}</div>
                          <div className="text-[11px] text-muted-foreground">{s.admission_number ?? s.student_code}</div>
                        </TableCell>
                        {comps.map((c, ci) => {
                          const val = draft[s.id]?.[c.id];
                          const err = errors[`${s.id}::${c.id}`];
                          return (
                            <TableCell key={c.id} className="text-center">
                              <Input
                                ref={(el) => { inputRefs.current[`${ri}-${ci}`] = el; }}
                                type="number"
                                inputMode="decimal"
                                readOnly={readOnly}
                                value={val ?? ""}
                                onChange={(e) => setCell(s.id, c.id, e.target.value, Number(c.max_score))}
                                onKeyDown={(e) => onKey(e, ri, ci)}
                                className={cn("h-8 w-16 text-center mx-auto", err && "border-destructive")}
                              />
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center font-medium">{row ? row.total.toFixed(1) : "—"}</TableCell>
                        <TableCell className="text-center">{row ? `${row.percentage.toFixed(0)}%` : "—"}</TableCell>
                        <TableCell className="text-center font-semibold">{g.grade ?? "—"}</TableCell>
                        <TableCell className="text-center text-muted-foreground">{row?.position ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}