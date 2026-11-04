import * as React from "react";
import { CheckCircle2, XCircle, Loader2, Save, Undo2, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useSessions, useTerms, useClasses, useArms, useSubjects } from "@/lib/school/hooks";
import { useStudents } from "@/lib/students/hooks";
import { useMyStaff, useStaffAssignments } from "@/lib/staff/hooks";
import {
  useAttendanceForClass, useUpsertAttendance,
  STATUS_META, STATUS_ORDER,
  type AttendanceStatus,
} from "@/lib/attendance/hooks";
import { cn } from "@/lib/utils";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Student = Tables<"students">;

const ADMIN_ROLES = new Set(["school_admin", "super_admin", "principal", "vice_principal"]);

export function TakeAttendance() {
  const { school, userId, roles } = useAuth();
  const schoolId = school?.id ?? null;

  const isFormTeacher = roles.includes("form_teacher") && !roles.some((r) => ADMIN_ROLES.has(r));
  const myStaff = useMyStaff(schoolId, isFormTeacher ? userId : null);
  const myAssignments = useStaffAssignments(isFormTeacher ? (myStaff.data?.id ?? undefined) : undefined);

  const sessions = useSessions(schoolId);
  const terms = useTerms(schoolId);
  const classes = useClasses(schoolId);
  const arms = useArms(schoolId);
  const subjects = useSubjects(schoolId);
  const students = useStudents(schoolId);
  const upsert = useUpsertAttendance();

  const currentSession = sessions.data?.find((s) => s.is_current) ?? sessions.data?.[0] ?? null;
  const currentTerm = terms.data?.find((t) => t.is_current) ?? terms.data?.[0] ?? null;

  const [sessionId, setSessionId] = React.useState<string>("");
  const [termId, setTermId] = React.useState<string>("");
  const [date, setDate] = React.useState<string>(new Date().toISOString().slice(0, 10));
  const [classId, setClassId] = React.useState<string>("");
  const [armId, setArmId] = React.useState<string>("");
  const [subjectId, setSubjectId] = React.useState<string>("");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => { if (!sessionId && currentSession) setSessionId(currentSession.id); }, [currentSession, sessionId]);
  React.useEffect(() => { if (!termId && currentTerm) setTermId(currentTerm.id); }, [currentTerm, termId]);

  const assignedClassIds = React.useMemo(() => {
    if (!isFormTeacher || !myAssignments.data) return null;
    const ids = new Set<string>();
    for (const a of myAssignments.data) { if (a.class_id) ids.add(a.class_id); }
    return ids;
  }, [isFormTeacher, myAssignments.data]);

  const assignedArmIds = React.useMemo(() => {
    if (!isFormTeacher || !myAssignments.data) return null;
    const ids = new Set<string>();
    for (const a of myAssignments.data) { if (a.class_arm_id) ids.add(a.class_arm_id); }
    return ids;
  }, [isFormTeacher, myAssignments.data]);

  const visibleClasses = React.useMemo(() => {
    const all = classes.data ?? [];
    if (!assignedClassIds) return all;
    return all.filter((c) => assignedClassIds.has(c.id));
  }, [classes.data, assignedClassIds]);

  React.useEffect(() => {
    if (!isFormTeacher || classId || visibleClasses.length !== 1) return;
    setClassId(visibleClasses[0].id);
  }, [isFormTeacher, classId, visibleClasses]);

  const roster: Student[] = React.useMemo(() => {
    const list = students.data ?? [];
    return list.filter((s) =>
      (!classId || s.class_id === classId) &&
      (!armId || s.arm_id === armId) &&
      s.status === "active",
    );
  }, [students.data, classId, armId]);

  const existing = useAttendanceForClass({
    schoolId, date,
    classId: classId || null,
    armId: armId || null,
    subjectId: subjectId || null,
  });

  const [draft, setDraft] = React.useState<Record<string, AttendanceStatus>>({});
  const [history, setHistory] = React.useState<Array<Record<string, AttendanceStatus>>>([]);

  React.useEffect(() => {
    const seeded: Record<string, AttendanceStatus> = {};
    (existing.data ?? []).forEach((r) => { seeded[r.student_id] = r.status; });
    setDraft(seeded);
    setHistory([]);
  }, [existing.data]);

  const filtered = roster.filter((s) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return `${s.first_name} ${s.middle_name ?? ""} ${s.surname} ${s.admission_number ?? ""}`.toLowerCase().includes(q);
  });

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setHistory((h) => [...h, { ...draft }].slice(-20));
    setDraft((d) => ({ ...d, [studentId]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    setHistory((h) => [...h, { ...draft }].slice(-20));
    const next: Record<string, AttendanceStatus> = { ...draft };
    roster.forEach((s) => { next[s.id] = status; });
    setDraft(next);
  };

  const undo = () => {
    setHistory((h) => {
      if (!h.length) return h;
      const last = h[h.length - 1];
      setDraft(last);
      return h.slice(0, -1);
    });
  };

  const dirtyCount = React.useMemo(() => {
    const existingMap = new Map((existing.data ?? []).map((r) => [r.student_id, r.status] as const));
    let n = 0;
    Object.entries(draft).forEach(([sid, st]) => { if (existingMap.get(sid) !== st) n++; });
    return n;
  }, [draft, existing.data]);

  const canSubmit = !!schoolId && !!classId && !!date && roster.length > 0;

  const submit = async (finalize: boolean) => {
    if (!canSubmit || !schoolId) return;

    // Build an id-map from existing records so we can UPDATE by id instead of
    // relying on the (student_id, date, subject_id) conflict — which breaks when
    // subject_id is NULL (Postgres treats two NULLs as distinct, so the conflict
    // is never found and rows accumulate or error).
    const existingById = new Map((existing.data ?? []).map((r) => [r.student_id, r]));

    const toUpdate: Array<{ id: string; status: AttendanceStatus; is_finalized: boolean }> = [];
    const toInsert: TablesInsert<"attendance_records">[] = [];

    roster.forEach((s) => {
      const status = draft[s.id] ?? "present";
      const existing = existingById.get(s.id);
      if (existing) {
        toUpdate.push({ id: existing.id, status, is_finalized: finalize });
      } else {
        toInsert.push({
          school_id: schoolId,
          session_id: sessionId || null,
          term_id: termId || null,
          date,
          class_id: classId || null,
          arm_id: armId || null,
          subject_id: subjectId || null,
          student_id: s.id,
          status,
          marked_by: userId ?? null,
          marked_at: new Date().toISOString(),
          is_finalized: finalize,
        });
      }
    });

    try {
      await upsert.mutateAsync({ toUpdate, toInsert });
      toast.success(finalize ? "Attendance submitted" : "Draft saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save attendance");
    }
  };

  // Autosave when dirty (debounced 2.5s). Only fires when dirtyCount changes
  // so a failed save doesn't spin — the effect won't re-run until the user
  // makes another change.
  const autosaveRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    if (!dirtyCount || !canSubmit) return;
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => { void submit(false); }, 2500);
    return () => { if (autosaveRef.current) clearTimeout(autosaveRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirtyCount, canSubmit]);

  // Status bar text
  const statusText = upsert.isPending
    ? "Saving…"
    : dirtyCount > 0
    ? `${dirtyCount} unsaved change${dirtyCount === 1 ? "" : "s"} — saving shortly`
    : "All changes saved";

  return (
    <div className="space-y-4">
      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Take attendance</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
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
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Select
            value={classId}
            onValueChange={(v) => { setClassId(v); setArmId(""); }}
            disabled={isFormTeacher && visibleClasses.length === 1}
          >
            <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>
              {visibleClasses.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={armId} onValueChange={setArmId}>
            <SelectTrigger><SelectValue placeholder="Arm (optional)" /></SelectTrigger>
            <SelectContent>
              {(arms.data ?? [])
                .filter((a) => (!classId || a.class_id === classId) && (!assignedArmIds || assignedArmIds.has(a.id)))
                .map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger><SelectValue placeholder="Subject (optional)" /></SelectTrigger>
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
              <p className={cn(
                "text-xs",
                upsert.isPending || dirtyCount > 0 ? "text-amber-600" : "text-muted-foreground",
              )}>
                {upsert.isPending && <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />}
                {statusText}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-40" />
            <Button size="sm" variant="outline" onClick={() => markAll("present")}>
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> All Present
            </Button>
            <Button size="sm" variant="outline" onClick={() => markAll("absent")}>
              <XCircle className="mr-1.5 h-3.5 w-3.5" /> All Absent
            </Button>
            <Button size="sm" variant="ghost" onClick={undo} disabled={!history.length}>
              <Undo2 className="mr-1.5 h-3.5 w-3.5" /> Undo
            </Button>
            <Button size="sm" variant="outline" onClick={() => submit(false)} disabled={upsert.isPending || !canSubmit}>
              <Save className="mr-1.5 h-3.5 w-3.5" /> Save draft
            </Button>
            <Button size="sm" onClick={() => submit(true)} disabled={upsert.isPending || !canSubmit}>
              {upsert.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <BookOpen className="mr-1.5 h-3.5 w-3.5" />}
              Submit
            </Button>
          </div>
        </CardHeader>

        {/* Status key legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-b px-4 py-2.5">
          {STATUS_ORDER.map((st) => {
            const m = STATUS_META[st];
            return (
              <span key={st} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white", m.color.split(" ")[0])}>
                  {m.short}
                </span>
                {m.label}
              </span>
            );
          })}
        </div>

        <CardContent className="p-0">
          {!classId ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Pick a class to load the roster.</div>
          ) : students.isLoading || existing.isLoading ? (
            <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No active students in this selection.</div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((s) => {
                const status = draft[s.id] ?? "present";
                return (
                  <li key={s.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={s.photo_url ?? undefined} alt="" />
                        <AvatarFallback>{(s.first_name?.[0] ?? "") + (s.surname?.[0] ?? "")}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{s.first_name} {s.surname}</div>
                        <div className="truncate text-[11px] text-muted-foreground">{s.admission_number ?? s.student_code}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      {STATUS_ORDER.map((st) => {
                        const meta = STATUS_META[st];
                        const active = status === st;
                        return (
                          <button
                            key={st}
                            onClick={() => setStatus(s.id, st)}
                            className={cn(
                              "flex h-8 min-w-[2.5rem] items-center justify-center gap-1 rounded-md border px-2 text-xs font-semibold transition",
                              active
                                ? `${meta.color} border-transparent shadow-sm`
                                : "bg-background hover:bg-muted text-muted-foreground",
                            )}
                            title={meta.label}
                          >
                            <span>{meta.short}</span>
                          </button>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
