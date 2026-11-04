import * as React from "react";
import { GraduationCap, CalendarCheck2, TrendingUp, BookOpen, Clock, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  useMyStudentRecord,
  useMyAttendance,
  useMyResults,
  useMyHomework,
  computeAttendanceSummary,
} from "@/lib/student-portal/hooks";

import { StudentAttendancePanel } from "./StudentAttendancePanel";
import { StudentResultsPanel } from "./StudentResultsPanel";
import { StudentTimetablePanel } from "./StudentTimetablePanel";
import { StudentHomeworkPanel } from "./StudentHomeworkPanel";
import { StudentAnnouncementsPanel } from "./StudentAnnouncementsPanel";
import { StudentAIAssistant } from "./StudentAIAssistant";
import { StudentMessagesPanel } from "./StudentMessagesPanel";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function StudentDashboard() {
  const { school, userId, profile } = useAuth();
  const schoolId = school?.id ?? null;

  const studentQ = useMyStudentRecord(userId, schoolId);
  const student = studentQ.data;

  const attendanceQ = useMyAttendance(student?.id);
  const attendanceSummary = computeAttendanceSummary(attendanceQ.data ?? []);

  const resultsQ = useMyResults(student?.id, schoolId);
  const results = resultsQ.data ?? [];

  const currentClassId = student?.current_class_id ?? null;
  const currentArmId = student?.current_arm_id ?? null;

  const homeworkQ = useMyHomework(currentClassId, currentArmId, schoolId);
  const homework = (homeworkQ.data ?? []) as Record<string, unknown>[];

  const now = new Date();
  const pendingHw = homework.filter(
    (hw) => new Date(hw.due_date as string) >= now
  );
  const soonHw = homework.filter((hw) => {
    const d = new Date(hw.due_date as string);
    const diff = (d.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return diff >= 0 && diff <= 3;
  });

  const avgScore =
    results.length > 0
      ? Math.round(results.reduce((s, r) => s + (r.total ?? 0), 0) / results.length)
      : null;

  const studentName = student
    ? `${student.first_name} ${student.surname}`
    : (profile?.full_name ?? "Student");

  const firstName = studentName.split(" ")[0];

  if (studentQ.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed bg-muted/30 px-6 py-14">
          <GraduationCap className="h-10 w-10 text-muted-foreground/50" />
          <div>
            <p className="font-semibold">Student record not linked</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your school admin needs to link your account to your student record.
              Contact them for assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const classLabel = [student.classes?.name, student.class_arms?.name].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6 lg:p-8 animate-fade-in">
      {/* Greeting */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {getGreeting()}, {firstName}! 👋
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {classLabel} · Adm: {student.admission_number ?? "–"}
          </p>
        </div>
        <div className="rounded-xl border bg-card px-4 py-2 text-center shadow-soft">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Status
          </p>
          <p className={cn(
            "text-sm font-bold",
            student.status === "active" ? "text-success" : "text-amber-500",
          )}>
            {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
          </p>
        </div>
      </div>

      {/* Quick stats */}
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
          label="Homework"
          value={String(pendingHw.length)}
          icon={BookOpen}
          accent="text-blue-600 dark:text-blue-400"
          sub="Pending"
        />
        <QuickStat
          label="Due Soon"
          value={String(soonHw.length)}
          icon={Clock}
          accent={soonHw.length > 0 ? "text-amber-500" : "text-muted-foreground"}
          sub="Within 3 days"
        />
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="homework">Homework</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <StudentAIAssistant
            studentName={studentName}
            attendancePct={attendanceSummary.pct}
            results={results.map((r) => ({
              subjectName: r.subject_name,
              total: r.total ?? 0,
              grade: r.grade,
            }))}
            upcomingHomework={soonHw.map((hw) => ({
              title: hw.title as string,
              subject: ((hw.subjects as Record<string, unknown> | null)?.name as string) ?? "Subject",
              dueDate: hw.due_date as string,
            }))}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <StudentAttendancePanel studentId={student.id} compact />
            <StudentResultsPanel studentId={student.id} schoolId={schoolId!} compact />
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
          <StudentAttendancePanel studentId={student.id} />
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          <StudentResultsPanel studentId={student.id} schoolId={schoolId!} />
        </TabsContent>

        <TabsContent value="timetable" className="mt-6">
          {currentClassId ? (
            <StudentTimetablePanel
              classId={currentClassId}
              armId={currentArmId}
              schoolId={schoolId!}
            />
          ) : (
            <EmptyPanel message="No class assigned yet." />
          )}
        </TabsContent>

        <TabsContent value="homework" className="mt-6">
          {currentClassId ? (
            <StudentHomeworkPanel
              studentId={student.id}
              classId={currentClassId}
              armId={currentArmId}
              schoolId={schoolId!}
            />
          ) : (
            <EmptyPanel message="No class assigned yet." />
          )}
        </TabsContent>

        <TabsContent value="announcements" className="mt-6">
          <StudentAnnouncementsPanel schoolId={schoolId!} userId={userId!} />
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <StudentMessagesPanel userId={userId!} schoolId={schoolId!} />
        </TabsContent>
      </Tabs>
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
            <p className={cn("text-2xl font-bold mt-1 tabular-nums", accent)}>{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
          </div>
          <div className={cn("rounded-lg bg-muted p-2", accent)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
