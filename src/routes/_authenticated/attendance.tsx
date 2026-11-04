import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck2, ClipboardList, LineChart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useAttendanceRange } from "@/lib/attendance/hooks";
import { useStudents } from "@/lib/students/hooks";
import { AttendanceStats } from "@/components/attendance/AttendanceStats";
import { AttendanceInsights } from "@/components/attendance/AttendanceInsights";
import { TakeAttendance } from "@/components/attendance/TakeAttendance";
import { AttendanceReports } from "@/components/attendance/AttendanceReports";
import { PermissionGate } from "@/components/auth/PermissionGate";

export const Route = createFileRoute("/_authenticated/attendance")({
  head: () => ({ meta: [{ title: "Attendance · Edvimia" }] }),
  component: AttendancePage,
});

function AttendancePage() {
  const { school } = useAuth();
  const schoolId = school?.id ?? null;
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);

  const todayRows = useAttendanceRange(schoolId, today, today);
  const rangeRows = useAttendanceRange(schoolId, monthAgo, today);
  const students = useStudents(schoolId);

  return (
    <PermissionGate permission="view_attendance">
      <AppShell>
        <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
            <p className="text-sm text-muted-foreground">
              Track, mark and analyse attendance for {school?.name ?? "your school"}.
            </p>
          </div>

          <AttendanceStats today={todayRows.data ?? []} />

          <Tabs defaultValue="take" className="space-y-4">
            <TabsList>
              <TabsTrigger value="take"><ClipboardList className="mr-1.5 h-3.5 w-3.5" /> Take</TabsTrigger>
              <TabsTrigger value="insights"><LineChart className="mr-1.5 h-3.5 w-3.5" /> Insights</TabsTrigger>
              <TabsTrigger value="reports"><CalendarCheck2 className="mr-1.5 h-3.5 w-3.5" /> Reports</TabsTrigger>
            </TabsList>
            <TabsContent value="take"><TakeAttendance /></TabsContent>
            <TabsContent value="insights">
              <AttendanceInsights range={rangeRows.data ?? []} students={students.data ?? []} />
            </TabsContent>
            <TabsContent value="reports"><AttendanceReports /></TabsContent>
          </Tabs>
        </div>
      </AppShell>
    </PermissionGate>
  );
}