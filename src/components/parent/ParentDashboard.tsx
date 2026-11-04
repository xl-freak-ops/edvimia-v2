import * as React from "react";
import {
  CalendarCheck2, TrendingUp, Wallet, HeartHandshake, Loader2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  useLinkedStudents,
  useChildAttendanceSummary,
  useChildResults,
  useChildInvoices,
  useChildPayments,
  useChildHomework,
  type ChildSummary,
} from "@/lib/parent/hooks";

import { ChildSelector } from "./ChildSelector";
import { ChildAttendanceCard } from "./ChildAttendanceCard";
import { ChildResultsCard } from "./ChildResultsCard";
import { ChildFinanceCard } from "./ChildFinanceCard";
import { ParentAnnouncementsPanel } from "./ParentAnnouncementsPanel";
import { ParentMessagesPanel } from "./ParentMessagesPanel";
import { ParentAISummary } from "./ParentAISummary";

export function ParentDashboard() {
  const { school, userId, profile } = useAuth();
  const schoolId = school?.id ?? null;

  const linkedQ = useLinkedStudents(userId, schoolId);
  const [selected, setSelected] = React.useState<ChildSummary | null>(null);

  // Auto-select first child when data loads
  React.useEffect(() => {
    if (linkedQ.data && linkedQ.data.length > 0 && !selected) {
      setSelected(linkedQ.data[0]);
    }
  }, [linkedQ.data, selected]);

  const student = selected?.student ?? null;
  const studentId = student?.id ?? null;

  const attendanceSummary = useChildAttendanceSummary(studentId);
  const resultsQ = useChildResults(studentId, schoolId);
  const invoicesQ = useChildInvoices(studentId, schoolId);
  const paymentsQ = useChildPayments(studentId, schoolId);

  const results = resultsQ.data ?? [];
  const invoices = invoicesQ.data ?? [];
  const payments = paymentsQ.data ?? [];

  const totalInvoiced = invoices.reduce(
    (s, i) => s + ((i as Record<string, unknown>).total as number ?? 0), 0
  );
  const totalPaid = payments.reduce(
    (s, p) => s + ((p as Record<string, unknown>).amount as number ?? 0), 0
  );
  const outstanding = Math.max(0, totalInvoiced - totalPaid);

  const avgScore =
    results.length > 0
      ? Math.round(results.reduce((s, r) => s + (r.total ?? 0), 0) / results.length)
      : null;

  const studentName = student
    ? `${student.first_name} ${student.surname}`.trim()
    : "Child";

  const firstName = (profile?.full_name ?? userId ?? "Parent").split(" ")[0];

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Parent Portal
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {school?.name ?? "Your School"} · Stay connected to your children's progress
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 shadow-soft">
          <HeartHandshake className="h-4 w-4 text-accent-brand" />
          <span className="text-sm font-medium">
            {linkedQ.data?.length ?? 0} Child{(linkedQ.data?.length ?? 0) !== 1 ? "ren" : ""} Linked
          </span>
        </div>
      </div>

      {/* Child selector */}
      {linkedQ.isLoading ? (
        <div className="flex h-20 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ChildSelector
          children={linkedQ.data ?? []}
          selected={selected}
          onSelect={setSelected}
        />
      )}

      {/* Content — only shown when a child is selected */}
      {student && schoolId && (
        <>
          {/* Quick stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <QuickStat
              label="Attendance"
              value={attendanceSummary.total > 0 ? `${attendanceSummary.pct}%` : "–"}
              icon={CalendarCheck2}
              accent={
                attendanceSummary.pct >= 90
                  ? "text-success"
                  : attendanceSummary.pct >= 75
                  ? "text-amber-500"
                  : "text-destructive"
              }
              sub="This term"
            />
            <QuickStat
              label="Avg Score"
              value={avgScore != null ? `${avgScore}/100` : "–"}
              icon={TrendingUp}
              accent={
                avgScore == null
                  ? "text-muted-foreground"
                  : avgScore >= 70
                  ? "text-success"
                  : avgScore >= 50
                  ? "text-amber-500"
                  : "text-destructive"
              }
              sub="Across subjects"
            />
            <QuickStat
              label="Outstanding"
              value={outstanding > 0 ? formatNGN(outstanding) : "Nil"}
              icon={Wallet}
              accent={outstanding > 0 ? "text-destructive" : "text-success"}
              sub="Fee balance"
            />
            <QuickStat
              label="Subjects"
              value={String(results.length)}
              icon={TrendingUp}
              accent="text-blue-600 dark:text-blue-400"
              sub="With results"
            />
          </div>

          {/* Main tabs */}
          <Tabs defaultValue="overview">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="finance">Finance</TabsTrigger>
              <TabsTrigger value="announcements">Announcements</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              <ParentAISummary
                studentName={studentName}
                attendancePct={attendanceSummary.pct}
                results={results.map((r) => ({
                  subjectName: r.subject_name,
                  total: r.total ?? 0,
                  grade: r.grade,
                }))}
                outstandingBalance={outstanding}
              />
              <div className="grid gap-4 lg:grid-cols-2">
                <ChildAttendanceCard studentId={student.id} compact />
                <ChildResultsCard studentId={student.id} schoolId={schoolId} compact />
              </div>
            </TabsContent>

            <TabsContent value="attendance" className="mt-6">
              <ChildAttendanceCard studentId={student.id} />
            </TabsContent>

            <TabsContent value="results" className="mt-6">
              <ChildResultsCard studentId={student.id} schoolId={schoolId} />
            </TabsContent>

            <TabsContent value="finance" className="mt-6">
              <ChildFinanceCard studentId={student.id} schoolId={schoolId} />
            </TabsContent>

            <TabsContent value="announcements" className="mt-6">
              <ParentAnnouncementsPanel schoolId={schoolId} userId={userId!} />
            </TabsContent>

            <TabsContent value="messages" className="mt-6">
              <ParentMessagesPanel schoolId={schoolId} userId={userId!} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function QuickStat({
  label, value, icon: Icon, accent, sub,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  sub: string;
}) {
  return (
    <Card className="shadow-soft">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className={cn("text-xl font-bold mt-1 tabular-nums truncate", accent)}>{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
          </div>
          <div className={cn("rounded-lg bg-muted p-2 shrink-0", accent)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatNGN(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    notation: "compact",
  }).format(amount);
}
