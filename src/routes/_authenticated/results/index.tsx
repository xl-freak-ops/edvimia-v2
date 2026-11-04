import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { BookOpen, ClipboardList, LineChart, Settings2, GraduationCap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useSessions, useTerms, useClasses, useSubjects } from "@/lib/school/hooks";
import { useStudents } from "@/lib/students/hooks";
import { useComponents, useSheets, useTermScores } from "@/lib/results/hooks";
import { ResultsStats } from "@/components/results/ResultsStats";
import { ResultsInsights } from "@/components/results/ResultsInsights";
import { AssessmentConfig } from "@/components/results/AssessmentConfig";
import { ResultEntry } from "@/components/results/ResultEntry";
import { SheetsQueue } from "@/components/results/SheetsQueue";

export const Route = createFileRoute("/_authenticated/results/")({
  head: () => ({ meta: [{ title: "Results · Edvimia" }] }),
  component: ResultsPage,
});

function ResultsPage() {
  const { school } = useAuth();
  const schoolId = school?.id ?? null;
  const sessions = useSessions(schoolId);
  const terms = useTerms(schoolId);
  const classes = useClasses(schoolId);
  const subjects = useSubjects(schoolId);
  const students = useStudents(schoolId);
  const components = useComponents(schoolId);

  const currentTerm = terms.data?.find((t) => t.is_current) ?? terms.data?.[0] ?? null;
  const [termId, setTermId] = React.useState<string>("");
  React.useEffect(() => { if (!termId && currentTerm) setTermId(currentTerm.id); }, [currentTerm, termId]);

  const sheets = useSheets(schoolId, termId || null);
  const termScores = useTermScores(schoolId, termId || null);

  return (
    <PermissionGate permission="view_results">
    <AppShell>
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Results</h1>
            <p className="text-sm text-muted-foreground">
              End-to-end assessment, grading, approval and reporting for {school?.name ?? "your school"}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={termId} onValueChange={setTermId}>
              <SelectTrigger className="h-9 w-48"><SelectValue placeholder="Select term" /></SelectTrigger>
              <SelectContent>
                {(terms.data ?? []).map((t) => {
                  const ses = sessions.data?.find((s) => s.id === t.session_id);
                  return <SelectItem key={t.id} value={t.id}>{ses ? `${ses.name} · ` : ""}{t.name}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ResultsStats
          sheets={sheets.data ?? []}
          scores={termScores.data ?? []}
          components={components.data ?? []}
        />

        <ResultsInsights
          scores={termScores.data ?? []}
          components={components.data ?? []}
          students={students.data ?? []}
          classes={classes.data ?? []}
          subjects={subjects.data ?? []}
        />

        <Tabs defaultValue="entry" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="entry"><ClipboardList className="mr-1.5 h-3.5 w-3.5" /> Score entry</TabsTrigger>
            <TabsTrigger value="approvals"><LineChart className="mr-1.5 h-3.5 w-3.5" /> Approvals</TabsTrigger>
            <TabsTrigger value="cards"><BookOpen className="mr-1.5 h-3.5 w-3.5" /> Report cards</TabsTrigger>
            <TabsTrigger value="config"><Settings2 className="mr-1.5 h-3.5 w-3.5" /> Assessments</TabsTrigger>
          </TabsList>
          <TabsContent value="entry"><ResultEntry /></TabsContent>
          <TabsContent value="approvals"><SheetsQueue termId={termId || null} /></TabsContent>
          <TabsContent value="cards">
            <StudentPicker students={students.data ?? []} termId={termId} />
          </TabsContent>
          <TabsContent value="config">
            {schoolId ? <AssessmentConfig schoolId={schoolId} /> : null}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
    </PermissionGate>
  );
}

function StudentPicker({ students, termId }: { students: ReturnType<typeof useStudents>["data"] extends infer T ? T : never; termId: string }) {
  const [q, setQ] = React.useState("");
  const list = (students ?? []).filter((s) => {
    const t = `${s.first_name} ${s.surname} ${s.admission_number ?? ""}`.toLowerCase();
    return t.includes(q.toLowerCase());
  }).slice(0, 30);
  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Generate a report card</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          className="h-9 w-full max-w-md rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          placeholder="Search student by name or admission number…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <ul className="divide-y rounded-lg border">
          {list.length === 0 ? (
            <li className="p-6 text-center text-sm text-muted-foreground">No students match.</li>
          ) : list.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{s.first_name} {s.surname}</div>
                <div className="truncate text-[11px] text-muted-foreground">{s.admission_number ?? s.student_code}</div>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link
                  to="/results/report/$studentId"
                  params={{ studentId: s.id }}
                  search={{ term: termId || undefined }}
                >
                  <GraduationCap className="mr-1.5 h-3.5 w-3.5" /> Open
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}