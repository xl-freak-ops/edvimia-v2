import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck2, ClipboardList, Users, CalendarDays, Wallet, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useClasses, useSubjects, useGradeScales, useTerms } from "@/lib/school/hooks";
import { useStudents } from "@/lib/students/hooks";
import { useStaffList, useStaffAttendance } from "@/lib/staff/hooks";
import { useAttendanceRange, attendanceRate } from "@/lib/attendance/hooks";
import { useComponents, useTermScores } from "@/lib/results/hooks";
import { useInvoices, useRecentPayments } from "@/lib/finance/hooks";
import { useSchoolTimetable } from "@/lib/timetable/hooks";
import { buildResultsBySubject } from "@/lib/analytics/hooks";

import { AttendanceInsights } from "@/components/attendance/AttendanceInsights";
import { ResultsInsights } from "@/components/results/ResultsInsights";
import { StaffAIInsights } from "@/components/staff/StaffAIInsights";
import { TimetableInsights } from "@/components/timetable/TimetableInsights";
import { FinanceInsights } from "@/components/finance/FinanceInsights";
import { AISummaryCard } from "./AISummaryCard";
import { useSchool } from "@/lib/school/hooks";

export function AIIntelligenceCenter() {
  const { school } = useAuth();
  const schoolId = school?.id ?? null;
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);

  const students = useStudents(schoolId);
  const classes = useClasses(schoolId);
  const subjects = useSubjects(schoolId);
  const gradeScales = useGradeScales(schoolId);
  const terms = useTerms(schoolId);
  const currentTermId = terms.data?.find((t) => t.is_current)?.id ?? terms.data?.[0]?.id ?? null;

  const staffList = useStaffList(schoolId);
  const staffAttendance = useStaffAttendance(schoolId);
  const schoolQ = useSchool(schoolId);
  const currency = (schoolQ.data as { currency?: string } | null)?.currency ?? "NGN";

  const attendanceRange = useAttendanceRange(schoolId, monthAgo, today);
  const components = useComponents(schoolId);
  const termScores = useTermScores(schoolId, currentTermId);
  const invoices = useInvoices(schoolId, null);
  const payments = useRecentPayments(schoolId, 500);
  const timetable = useSchoolTimetable(schoolId, currentTermId);

  const assignments = useQuery({
    enabled: !!schoolId,
    queryKey: ["ai-center", "assignments", schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_assignments")
        .select("*")
        .eq("school_id", schoolId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const resultsBySubject = useMemo(
    () => buildResultsBySubject(termScores.data ?? [], components.data ?? [], subjects.data ?? []),
    [termScores.data, components.data, subjects.data],
  );

  const summaryPoints = useMemo(() => {
    const points: string[] = [];
    const attRows = attendanceRange.data ?? [];
    if (attRows.length) {
      const rate = attendanceRate(attRows);
      points.push(
        rate >= 85
          ? `Attendance is strong at ${rate}% over the last 30 days.`
          : `Attendance sits at ${rate}% over the last 30 days — below the 85% healthy benchmark.`,
      );
    }
    if (resultsBySubject.length) {
      const avg = Math.round(resultsBySubject.reduce((s, r) => s + r.avg, 0) / resultsBySubject.length);
      const weakest = resultsBySubject[resultsBySubject.length - 1];
      points.push(`Average score this term is ${avg}%, with ${weakest.label} trailing at ${weakest.avg}%.`);
    }
    const inv = invoices.data ?? [];
    if (inv.length) {
      const total = inv.reduce((s, i) => s + Number((i as { total?: number }).total || 0), 0);
      const paid = inv.reduce((s, i) => s + Number((i as { amount_paid?: number }).amount_paid || 0), 0);
      const rate = total > 0 ? Math.round((paid / total) * 100) : 0;
      points.push(`Fee collection is at ${rate}% of expected revenue for the current term.`);
    }
    const staffRows = staffAttendance.data ?? [];
    if (staffRows.length) {
      const good = staffRows.filter((r) => (r as { status?: string }).status === "present").length;
      const rate = Math.round((good / staffRows.length) * 100);
      points.push(`Staff attendance is running at ${rate}% for the tracked period.`);
    }
    return points;
  }, [attendanceRange.data, resultsBySubject, invoices.data, staffAttendance.data]);

  if (!schoolId) return null;

  return (
    <div className="space-y-6">
      <AISummaryCard points={summaryPoints} />

      <Tabs defaultValue="academics" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="academics"><ClipboardList className="mr-1.5 h-3.5 w-3.5" /> Academics</TabsTrigger>
          <TabsTrigger value="attendance"><CalendarCheck2 className="mr-1.5 h-3.5 w-3.5" /> Attendance</TabsTrigger>
          <TabsTrigger value="finance"><Wallet className="mr-1.5 h-3.5 w-3.5" /> Finance</TabsTrigger>
          <TabsTrigger value="staff"><Users className="mr-1.5 h-3.5 w-3.5" /> Staff</TabsTrigger>
          <TabsTrigger value="timetable"><CalendarDays className="mr-1.5 h-3.5 w-3.5" /> Timetable</TabsTrigger>
        </TabsList>

        <TabsContent value="academics">
          <ResultsInsights
            scores={termScores.data ?? []}
            components={components.data ?? []}
            students={students.data ?? []}
            classes={classes.data ?? []}
            subjects={subjects.data ?? []}
          />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceInsights range={attendanceRange.data ?? []} students={students.data ?? []} />
        </TabsContent>

        <TabsContent value="finance">
          <FinanceInsights invoices={invoices.data ?? []} payments={payments.data ?? []} currency={currency} />
        </TabsContent>

        <TabsContent value="staff">
          <StaffAIInsights
            staff={staffList.data ?? []}
            assignments={assignments.data ?? []}
            attendance={staffAttendance.data ?? []}
          />
        </TabsContent>

        <TabsContent value="timetable">
          <TimetableInsights periods={timetable.data ?? []} staff={staffList.data ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
