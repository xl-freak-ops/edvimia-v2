import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Loader2, Plus, Printer } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth/AuthProvider";
import { primaryRole } from "@/lib/auth/roles";
import { useSessions, useTerms, useClasses, useArms, useSubjects } from "@/lib/school/hooks";
import { useStaffList } from "@/lib/staff/hooks";
import { useSchoolTimetable, useTeacherTimetable, useTimetable, type TimetablePeriod } from "@/lib/timetable/hooks";
import { TimetableGrid } from "@/components/timetable/TimetableGrid";
import { PeriodEditor } from "@/components/timetable/PeriodEditor";
import { TimetableInsights } from "@/components/timetable/TimetableInsights";
import type { TablesInsert } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/timetable")({
  head: () => ({ meta: [{ title: "Timetable · Edvimia" }] }),
  component: TimetablePage,
});

function TimetablePage() {
  const { school, roles } = useAuth();
  const schoolId = school?.id ?? null;
  const role = primaryRole(roles);
  const canEdit = role === "school_admin" || role === "principal" || role === "vice_principal" || role === "super_admin";

  const sessions = useSessions(schoolId);
  const terms = useTerms(schoolId);
  const classes = useClasses(schoolId);
  const arms = useArms(schoolId);
  const subjects = useSubjects(schoolId);
  const staff = useStaffList(schoolId);

  const [termId, setTermId] = React.useState<string>("");
  const [classId, setClassId] = React.useState<string>("");
  const [armId, setArmId] = React.useState<string>("");
  const [teacherId, setTeacherId] = React.useState<string>("");

  const currentTerm = terms.data?.find((t) => t.is_current) ?? terms.data?.[0] ?? null;
  React.useEffect(() => { if (!termId && currentTerm) setTermId(currentTerm.id); }, [currentTerm, termId]);
  React.useEffect(() => { if (!classId && classes.data && classes.data.length) setClassId(classes.data[0].id); }, [classes.data, classId]);

  const classPeriods = useTimetable({ schoolId, classId: classId || null, armId: armId || null, termId: termId || null });
  const teacherPeriods = useTeacherTimetable(teacherId || null, termId || null);
  const schoolPeriods = useSchoolTimetable(schoolId, termId || null);

  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TimetablePeriod | null>(null);
  const [defaults, setDefaults] = React.useState<Partial<TablesInsert<"timetable_periods">>>({});

  const openNew = (day: number) => {
    const next = ((classPeriods.data ?? []).filter((p) => p.day_of_week === day).length) + 1;
    setEditing(null);
    setDefaults({
      session_id: sessions.data?.find((s) => s.is_current)?.id ?? null,
      term_id: termId || null, class_id: classId || null, arm_id: armId || null,
      day_of_week: day, period_index: next,
    });
    setEditorOpen(true);
  };

  return (
    <PermissionGate permission="view_timetable">
    <AppShell>
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Timetable</h1>
            <p className="text-sm text-muted-foreground">
              Design, assign and audit class schedules for {school?.name ?? "your school"}.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
          </Button>
        </div>

        <Card className="shadow-soft">
          <CardContent className="grid gap-3 p-4 md:grid-cols-4">
            <Select value={termId} onValueChange={setTermId}>
              <SelectTrigger><SelectValue placeholder="Term" /></SelectTrigger>
              <SelectContent>
                {(terms.data ?? []).map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
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
            {canEdit && (
              <Button onClick={() => openNew(1)} disabled={!classId}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add period
              </Button>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="class" className="space-y-4">
          <TabsList>
            <TabsTrigger value="class">Class view</TabsTrigger>
            <TabsTrigger value="teacher">Teacher view</TabsTrigger>
            <TabsTrigger value="school">School overview</TabsTrigger>
          </TabsList>

          <TabsContent value="class" className="space-y-4">
            {classPeriods.isLoading ? (
              <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <>
                <TimetableInsights periods={classPeriods.data ?? []} staff={staff.data ?? []} />
                <TimetableGrid
                  periods={classPeriods.data ?? []}
                  subjects={subjects.data ?? []}
                  staff={staff.data ?? []}
                  canEdit={canEdit}
                  onEdit={(p) => { setEditing(p); setEditorOpen(true); }}
                  onAdd={openNew}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="teacher" className="space-y-4">
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger className="max-w-xs"><SelectValue placeholder="Select teacher" /></SelectTrigger>
              <SelectContent>
                {(staff.data ?? []).filter((s) => s.is_teaching).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {teacherId && (
              <TimetableGrid
                periods={teacherPeriods.data ?? []}
                subjects={subjects.data ?? []}
                staff={staff.data ?? []}
                canEdit={false}
                onEdit={() => {}}
                onAdd={() => {}}
              />
            )}
          </TabsContent>

          <TabsContent value="school" className="space-y-4">
            <TimetableInsights periods={schoolPeriods.data ?? []} staff={staff.data ?? []} />
            <p className="text-xs text-muted-foreground">Total periods this term: {(schoolPeriods.data ?? []).length}</p>
          </TabsContent>
        </Tabs>

        <PeriodEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          existing={editing}
          defaults={defaults}
          staff={staff.data ?? []}
        />
      </div>
    </AppShell>
    </PermissionGate>
  );
}