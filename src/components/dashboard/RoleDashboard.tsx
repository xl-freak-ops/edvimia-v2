import { useMemo } from "react";
import {
  Users,
  GraduationCap,
  Wallet,
  TrendingUp,
  Building2,
  CalendarCheck2,
  type LucideIcon,
} from "lucide-react";

import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { StatCard } from "@/components/dashboard/StatCard";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { CalendarWidget } from "@/components/dashboard/CalendarWidget";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { TasksWidget } from "@/components/dashboard/TasksWidget";
import { AnnouncementCard } from "@/components/dashboard/AnnouncementCard";
import { RecentStudentsTable } from "@/components/dashboard/RecentStudentsTable";
import { ParentDashboard } from "@/components/parent/ParentDashboard";
import { StudentDashboard } from "@/components/student-portal/StudentDashboard";
import { useAuth } from "@/lib/auth/AuthProvider";
import { usePlatformStats, useSchoolDashboardStats } from "@/lib/dashboard/hooks";
import { fmtMoney } from "@/lib/finance/format";
import type { AppRole } from "@/lib/auth/roles";
import { ROLE_LABEL } from "@/lib/auth/roles";

type Stat = {
  label: string;
  value: string;
  icon: LucideIcon;
  accent: "primary" | "success" | "brand" | "info";
};

export function RoleDashboard({ role }: { role: AppRole }) {
  // Delegate to dedicated portals for parent and student
  if (role === "parent") return <ParentDashboard />;
  if (role === "student") return <StudentDashboard />;

  const { profile, school } = useAuth();
  const schoolId = school?.id ?? null;
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  const platform = usePlatformStats();
  const schoolStats = useSchoolDashboardStats(schoolId);

  const stats: Stat[] = useMemo(() => {
    if (role === "super_admin") {
      const p = platform.data;
      if (!p) return [];
      return [
        { label: "Schools onboarded", value: String(p.schools), icon: Building2, accent: "primary" },
        { label: "Total users", value: p.users.toLocaleString(), icon: Users, accent: "success" },
        { label: "New schools (30d)", value: String(p.newSchoolsLast30d), icon: TrendingUp, accent: "brand" },
      ];
    }
    const s = schoolStats.data;
    if (!s) return [];
    return [
      { label: "Total students", value: s.totalStudents.toLocaleString(), icon: GraduationCap, accent: "primary" },
      { label: "Staff members", value: s.totalStaff.toLocaleString(), icon: Users, accent: "success" },
      {
        label: "Attendance today",
        value: s.attendanceTodayPct === null ? "No data" : `${s.attendanceTodayPct}%`,
        icon: CalendarCheck2,
        accent: "info",
      },
      { label: "Fees collected (month)", value: fmtMoney(s.feesThisMonth), icon: Wallet, accent: "brand" },
    ];
  }, [role, platform.data, schoolStats.data]);

  const showStudentsTable = ["school_admin", "principal", "vice_principal", "form_teacher"].includes(role);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6 lg:p-8">
      <WelcomeBanner name={firstName} schoolName={school?.name ?? null} />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </p>
          <h2 className="text-lg font-bold tracking-tight">{ROLE_LABEL[role]} dashboard</h2>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            icon={s.icon}
            accent={s.accent}
          />
        ))}
      </div>

      {role === "super_admin" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <QuickActions />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <AttendanceChart schoolId={schoolId} />
            <AnnouncementCard schoolId={schoolId} />
            {showStudentsTable && <RecentStudentsTable schoolId={schoolId} />}
          </div>
          <div className="space-y-4">
            <CalendarWidget schoolId={schoolId} />
            <TasksWidget />
            <QuickActions />
            <ActivityFeed schoolId={schoolId} />
          </div>
        </div>
      )}
    </div>
  );
}
