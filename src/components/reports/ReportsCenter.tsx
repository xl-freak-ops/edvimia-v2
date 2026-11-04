import { useMemo, useState } from "react";
import { CalendarCheck2, ClipboardList, Wallet, Users, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ReportCategoryCard } from "./ReportCategoryCard";
import { EmptyState } from "@/components/school/EmptyState";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTerms, useClasses, useSubjects, useGradeScales } from "@/lib/school/hooks";
import { useStudents } from "@/lib/students/hooks";
import { useStaffList } from "@/lib/staff/hooks";
import { useAttendanceRange, attendanceRate } from "@/lib/attendance/hooks";
import { exportAttendanceCsv, exportAttendanceExcel } from "@/lib/attendance/export";
import { useComponents, useTermScores } from "@/lib/results/hooks";
import { exportResultsCsv } from "@/lib/results/export";
import { useInvoices, useRecentPayments } from "@/lib/finance/hooks";
import { exportInvoicesCsv, exportPaymentsCsv } from "@/lib/finance/export";
import { exportStaffCsv, exportStaffExcel } from "@/lib/staff/export";
import { exportStudentsCsv, exportStudentsExcel } from "@/lib/students/export";
import { fmtMoney } from "@/lib/finance/format";
import { useSchool } from "@/lib/school/hooks";

export function ReportsCenter() {
  const { school } = useAuth();
  const schoolId = school?.id ?? null;
  const [termId, setTermId] = useState<string>("");

  const terms = useTerms(schoolId);
  const activeTermId = termId || terms.data?.find((t) => t.is_current)?.id || terms.data?.[0]?.id || "";

  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);

  const students = useStudents(schoolId);
  const staff = useStaffList(schoolId);
  const classes = useClasses(schoolId);
  const subjects = useSubjects(schoolId);
  const gradeScales = useGradeScales(schoolId);
  const schoolQ = useSchool(schoolId);
  const currency = (schoolQ.data as { currency?: string } | null)?.currency ?? "NGN";

  const attendanceRows = useAttendanceRange(schoolId, monthAgo, today);
  const components = useComponents(schoolId);
  const termScores = useTermScores(schoolId, activeTermId || null);
  const invoices = useInvoices(schoolId, activeTermId || null);
  const payments = useRecentPayments(schoolId, 500);

  const attStats = useMemo(() => {
    const rows = attendanceRows.data ?? [];
    return { rate: attendanceRate(rows), records: rows.length };
  }, [attendanceRows.data]);

  const financeStats = useMemo(() => {
    const inv = invoices.data ?? [];
    const total = inv.reduce((s, i) => s + Number((i as { total?: number }).total || 0), 0);
    const paid = inv.reduce((s, i) => s + Number((i as { amount_paid?: number }).amount_paid || 0), 0);
    return { total, paid, rate: total > 0 ? Math.round((paid / total) * 100) : 0, count: inv.length };
  }, [invoices.data]);

  const resultStats = useMemo(() => {
    const scores = termScores.data ?? [];
    const studentSubjectSet = new Set(scores.map((s) => `${s.student_id}::${s.subject_id}`));
    return { entries: scores.length, tracked: studentSubjectSet.size };
  }, [termScores.data]);

  if (!schoolId) return null;

  return (
    <div className="space-y-6">
      <Card className="shadow-soft border-border/70">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" /> Report period
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Select value={activeTermId} onValueChange={setTermId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent>
              {(terms.data ?? []).map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Reports below reflect the selected term for results and finance, and the trailing 30 days for attendance.
          </p>
        </CardContent>
      </Card>

      {!terms.data?.length && !terms.isLoading ? (
        <EmptyState
          icon={BarChart3}
          title="No academic terms yet"
          description="Set up a term under School Setup to unlock results and finance reports."
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <ReportCategoryCard
          icon={CalendarCheck2}
          tone="bg-emerald-500/10 text-emerald-600"
          title="Attendance Report"
          description="Attendance records for the trailing 30 days across the school."
          stats={[
            { label: "Attendance rate", value: `${attStats.rate}%` },
            { label: "Records", value: attStats.records },
          ]}
          disabled={!attStats.records}
          onExportCsv={() => exportAttendanceCsv(attendanceRows.data ?? [])}
          onExportExcel={() => exportAttendanceExcel(attendanceRows.data ?? [])}
        />

        <ReportCategoryCard
          icon={ClipboardList}
          tone="bg-sky-500/10 text-sky-600"
          title="Academic Results Report"
          description="Per-subject percentage, grade and position for the selected term."
          stats={[
            { label: "Score entries", value: resultStats.entries },
            { label: "Student × subject", value: resultStats.tracked },
          ]}
          disabled={!resultStats.entries}
          onExportCsv={() =>
            exportResultsCsv({
              scores: termScores.data ?? [],
              components: components.data ?? [],
              students: students.data ?? [],
              subjects: subjects.data ?? [],
              gradeScale: gradeScales.data ?? [],
            })
          }
          onExportExcel={() =>
            exportResultsCsv({
              scores: termScores.data ?? [],
              components: components.data ?? [],
              students: students.data ?? [],
              subjects: subjects.data ?? [],
              gradeScale: gradeScales.data ?? [],
              filename: `results-${Date.now()}.xls`,
            })
          }
        />

        <ReportCategoryCard
          icon={Wallet}
          tone="bg-amber-500/10 text-amber-600"
          title="Finance Report"
          description="Invoices and payments recorded for the selected term."
          stats={[
            { label: "Collection rate", value: `${financeStats.rate}%` },
            { label: "Collected", value: fmtMoney(financeStats.paid, currency) },
            { label: "Expected", value: fmtMoney(financeStats.total, currency) },
            { label: "Invoices", value: financeStats.count },
          ]}
          disabled={!financeStats.count}
          onExportCsv={() => exportInvoicesCsv(invoices.data ?? [], currency)}
          onExportExcel={() => exportPaymentsCsv(payments.data ?? [], currency)}
        />

        <ReportCategoryCard
          icon={Users}
          tone="bg-violet-500/10 text-violet-600"
          title="Staff Directory Report"
          description="Full staff roster with position, department and contact details."
          stats={[
            { label: "Total staff", value: staff.data?.length ?? 0 },
            {
              label: "Active",
              value: (staff.data ?? []).filter((s) => (s as { status?: string }).status === "active").length,
            },
          ]}
          disabled={!staff.data?.length}
          onExportCsv={() => exportStaffCsv(staff.data ?? [])}
          onExportExcel={() => exportStaffExcel(staff.data ?? [])}
        />
      </div>

      <ReportCategoryCard
        icon={Users}
        tone="bg-primary/10 text-primary"
        title="Student Roster Report"
        description="Full enrolment list with class, arm and admission details."
        stats={[
          { label: "Total students", value: students.data?.length ?? 0 },
          { label: "Classes", value: classes.data?.length ?? 0 },
        ]}
        disabled={!students.data?.length}
        onExportCsv={() => exportStudentsCsv(students.data ?? [])}
        onExportExcel={() => exportStudentsExcel(students.data ?? [])}
      />
    </div>
  );
}
