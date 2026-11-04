import { useMemo } from "react";
import { CalendarCheck2, ClipboardList, Wallet, Users2, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendChartCard } from "./TrendChartCard";
import { BarChartCard } from "./BarChartCard";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useClasses, useSubjects, useSchool } from "@/lib/school/hooks";
import { useStudents } from "@/lib/students/hooks";
import { useAttendanceRange, attendanceRate } from "@/lib/attendance/hooks";
import { useComponents } from "@/lib/results/hooks";
import { useInvoices, useRecentPayments } from "@/lib/finance/hooks";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  buildAttendanceTrend,
  buildResultsBySubject,
  buildRevenueTrend,
  buildEnrollmentByClass,
} from "@/lib/analytics/hooks";
import { fmtMoney } from "@/lib/finance/format";

export function AnalyticsDashboard() {
  const { school } = useAuth();
  const schoolId = school?.id ?? null;
  const today = new Date().toISOString().slice(0, 10);
  const rangeStart = new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10);

  const students = useStudents(schoolId);
  const classes = useClasses(schoolId);
  const subjects = useSubjects(schoolId);
  const schoolQ = useSchool(schoolId);
  const currency = (schoolQ.data as { currency?: string } | null)?.currency ?? "NGN";

  const attendanceRows = useAttendanceRange(schoolId, rangeStart, today);
  const components = useComponents(schoolId);
  const invoices = useInvoices(schoolId, null);
  const payments = useRecentPayments(schoolId, 1000);

  // All-time result scores (across terms) for a subject-level snapshot.
  const allScores = useQuery({
    enabled: !!schoolId,
    queryKey: ["analytics", "all-scores", schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("result_scores")
        .select("*")
        .eq("school_id", schoolId!)
        .limit(5000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const attendanceTrend = useMemo(() => buildAttendanceTrend(attendanceRows.data ?? []), [attendanceRows.data]);
  const resultsBySubject = useMemo(
    () => buildResultsBySubject(allScores.data ?? [], components.data ?? [], subjects.data ?? []),
    [allScores.data, components.data, subjects.data],
  );
  const revenueTrend = useMemo(() => buildRevenueTrend(payments.data ?? []), [payments.data]);
  const enrollmentByClass = useMemo(
    () => buildEnrollmentByClass(students.data ?? [], classes.data ?? []),
    [students.data, classes.data],
  );

  const kpis = useMemo(() => {
    const rows = attendanceRows.data ?? [];
    const rate = attendanceRate(rows);
    const inv = invoices.data ?? [];
    const total = inv.reduce((s, i) => s + Number((i as { total?: number }).total || 0), 0);
    const paid = inv.reduce((s, i) => s + Number((i as { amount_paid?: number }).amount_paid || 0), 0);
    const collectionRate = total > 0 ? Math.round((paid / total) * 100) : 0;
    const scores = allScores.data ?? [];
    const avgPct = resultsBySubject.length
      ? Math.round(resultsBySubject.reduce((s, r) => s + r.avg, 0) / resultsBySubject.length)
      : 0;
    return {
      attendanceRate: rate,
      collectionRate,
      avgResultPct: avgPct,
      totalStudents: students.data?.length ?? 0,
      scoreEntries: scores.length,
    };
  }, [attendanceRows.data, invoices.data, allScores.data, resultsBySubject, students.data]);

  if (!schoolId) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={CalendarCheck2} label="Attendance rate (90d)" value={`${kpis.attendanceRate}%`} tone="text-emerald-600 bg-emerald-500/10" />
        <KpiCard icon={ClipboardList} label="Avg. subject score" value={`${kpis.avgResultPct}%`} tone="text-sky-600 bg-sky-500/10" />
        <KpiCard icon={Wallet} label="Fee collection rate" value={`${kpis.collectionRate}%`} tone="text-amber-600 bg-amber-500/10" />
        <KpiCard icon={Users2} label="Total enrolment" value={kpis.totalStudents} tone="text-primary bg-primary/10" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TrendChartCard
          icon={CalendarCheck2}
          title="Attendance trend"
          subtitle="Daily attendance rate, last 90 days"
          data={attendanceTrend}
          dataKey="rate"
          color="hsl(var(--primary))"
          valueFormatter={(v) => `${v}%`}
        />
        <TrendChartCard
          icon={TrendingUp}
          title="Revenue collected"
          subtitle="Monthly payments received"
          data={revenueTrend}
          dataKey="amount"
          color="hsl(var(--accent-brand))"
          valueFormatter={(v) => fmtMoney(v, currency)}
        />
        <BarChartCard
          icon={ClipboardList}
          title="Average score by subject"
          subtitle="All recorded terms"
          data={resultsBySubject}
          dataKey="avg"
          valueFormatter={(v) => `${v}%`}
        />
        <BarChartCard
          icon={Users2}
          title="Enrolment by class"
          subtitle="Active students per class"
          data={enrollmentByClass}
          dataKey="count"
        />
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, tone }: { icon: typeof CalendarCheck2; label: string; value: string | number; tone: string }) {
  return (
    <Card className="shadow-soft border-border/70">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xl font-bold tabular-nums leading-none">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
