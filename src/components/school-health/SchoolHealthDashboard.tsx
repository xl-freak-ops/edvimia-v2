import { useMemo } from "react";
import { CalendarCheck2, ClipboardList, Wallet, Users, MessageSquare, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/school/EmptyState";
import { HealthGauge } from "./HealthGauge";
import { overallHealthScore, healthBand, type HealthDimension } from "@/lib/school-health/calc";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useAttendanceRange, attendanceRate } from "@/lib/attendance/hooks";
import { useComponents } from "@/lib/results/hooks";
import { useInvoices } from "@/lib/finance/hooks";
import { useStaffAttendance, useStaffList } from "@/lib/staff/hooks";
import { useAllAnnouncements } from "@/lib/communication/hooks";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { buildResultsBySubject } from "@/lib/analytics/hooks";
import { useSubjects } from "@/lib/school/hooks";

export function SchoolHealthDashboard() {
  const { school } = useAuth();
  const schoolId = school?.id ?? null;
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);

  const attendanceRows = useAttendanceRange(schoolId, monthAgo, today);
  const components = useComponents(schoolId);
  const subjects = useSubjects(schoolId);
  const invoices = useInvoices(schoolId, null);
  const staffAttendance = useStaffAttendance(schoolId);
  const staffList = useStaffList(schoolId);
  const announcements = useAllAnnouncements(schoolId);

  const allScores = useQuery({
    enabled: !!schoolId,
    queryKey: ["school-health", "all-scores", schoolId],
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

  const dimensions: HealthDimension[] = useMemo(() => {
    const attRows = attendanceRows.data ?? [];
    const attScore = attRows.length ? attendanceRate(attRows) : -1;

    const resultsBySubject = buildResultsBySubject(allScores.data ?? [], components.data ?? [], subjects.data ?? []);
    const academicScore = resultsBySubject.length
      ? Math.round(resultsBySubject.reduce((s, r) => s + r.avg, 0) / resultsBySubject.length)
      : -1;

    const inv = invoices.data ?? [];
    const total = inv.reduce((s, i) => s + Number((i as { total?: number }).total || 0), 0);
    const paid = inv.reduce((s, i) => s + Number((i as { amount_paid?: number }).amount_paid || 0), 0);
    const financeScore = total > 0 ? Math.round((paid / total) * 100) : -1;

    const staffRows = staffAttendance.data ?? [];
    const staffGood = staffRows.filter((r) => (r as { status?: string }).status === "present").length;
    const staffScore = staffRows.length ? Math.round((staffGood / staffRows.length) * 100) : -1;

    const ann = announcements.data ?? [];
    const publishedRatio = ann.length ? Math.round((ann.filter((a) => a.is_published).length / ann.length) * 100) : -1;

    return [
      {
        key: "attendance", label: "Student Attendance", score: attScore,
        detail: attScore >= 0 ? `${attScore}% present over the last 30 days.` : "No attendance data recorded yet.",
      },
      {
        key: "academic", label: "Academic Performance", score: academicScore,
        detail: academicScore >= 0 ? `${academicScore}% average score across subjects.` : "No result scores recorded yet.",
      },
      {
        key: "finance", label: "Fee Collection", score: financeScore,
        detail: financeScore >= 0 ? `${financeScore}% of expected fees collected.` : "No invoices issued yet.",
      },
      {
        key: "staff", label: "Staff Attendance", score: staffScore,
        detail: staffScore >= 0 ? `${staffScore}% staff attendance rate this period.` : "Staff attendance not yet tracked.",
      },
      {
        key: "communication", label: "Communication Activity", score: publishedRatio,
        detail: publishedRatio >= 0 ? `${publishedRatio}% of announcements published to the school community.` : "No announcements sent yet.",
      },
    ];
  }, [attendanceRows.data, allScores.data, components.data, subjects.data, invoices.data, staffAttendance.data, announcements.data]);

  const overall = overallHealthScore(dimensions);
  const hasAnyData = dimensions.some((d) => d.score >= 0);

  if (!schoolId) return null;

  if (!hasAnyData) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No data yet to compute school health"
        description="Once you record attendance, results, fees or staff activity, Edvi will calculate a live health score here."
      />
    );
  }

  const icons: Record<string, typeof CalendarCheck2> = {
    attendance: CalendarCheck2,
    academic: ClipboardList,
    finance: Wallet,
    staff: Users,
    communication: MessageSquare,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
      <Card className="shadow-soft border-primary/20 bg-gradient-to-br from-primary/[0.04] to-accent-brand/[0.04]">
        <CardHeader className="pb-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-accent-brand" /> Overall School Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <HealthGauge score={overall} />
          <p className="text-center text-xs text-muted-foreground">
            Composite score across attendance, academics, finance, staffing and communication.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {dimensions.map((d) => {
          const Icon = icons[d.key] ?? Sparkles;
          const score = d.score >= 0 ? d.score : 0;
          const band = healthBand(score);
          return (
            <Card key={d.key} className="shadow-soft border-border/70">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`grid h-8 w-8 place-items-center rounded-lg ${band.tone}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold">{d.label}</span>
                  </div>
                  <span className="text-sm font-bold tabular-nums">{d.score >= 0 ? `${d.score}%` : "—"}</span>
                </div>
                <Progress value={score} className="mb-2 h-1.5" />
                <p className="text-xs text-muted-foreground">{d.detail}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
