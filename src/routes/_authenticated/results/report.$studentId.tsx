import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { z } from "zod";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useSubjects, useGradeScales, useTerms, useSchool } from "@/lib/school/hooks";
import { useStudent } from "@/lib/students/hooks";
import { useComponents, useTermScores, useResultMeta } from "@/lib/results/hooks";
import { ReportCard } from "@/components/results/ReportCard";

const searchSchema = z.object({ term: z.string().optional() });

export const Route = createFileRoute("/_authenticated/results/report/$studentId")({
  head: () => ({ meta: [{ title: "Report Card · Edvimia" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: ReportPage,
});

function ReportPage() {
  const { studentId } = Route.useParams();
  const { term: termParam } = Route.useSearch();
  const { school } = useAuth();
  const schoolId = school?.id ?? null;
  const schoolFull = useSchool(schoolId);

  const terms = useTerms(schoolId);
  const currentTerm = terms.data?.find((t) => t.is_current) ?? terms.data?.[0] ?? null;
  const termId = termParam ?? currentTerm?.id ?? null;

  const student = useStudent(studentId);
  const subjects = useSubjects(schoolId);
  const grades = useGradeScales(schoolId);
  const components = useComponents(schoolId);
  const termScores = useTermScores(schoolId, termId);
  const metaRows = useResultMeta(schoolId, termId);

  const meta = (metaRows.data ?? []).find((m) => m.student_id === studentId) ?? null;
  const termName = terms.data?.find((t) => t.id === termId)?.name ?? null;

  if (!student.data) {
    return (
      <AppShell>
        <div className="grid place-items-center py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <PermissionGate permission="view_results">
    <AppShell>
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
        <ReportCard
          school={(schoolFull.data ?? null) as never}
          student={student.data as never}
          subjects={subjects.data ?? []}
          components={components.data ?? []}
          scores={(termScores.data ?? []).filter((s) => s.student_id === studentId)}
          grades={grades.data ?? []}
          meta={meta}
          termName={termName}
        />
      </div>
    </AppShell>
    </PermissionGate>
  );
}