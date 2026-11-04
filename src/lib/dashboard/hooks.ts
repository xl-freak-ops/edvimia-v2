import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ── Platform-wide stats for super_admin ─────────────────────

export function usePlatformStats() {
  return useQuery({
    queryKey: ["dashboard", "platform-stats"],
    queryFn: async () => {
      const [{ count: schoolCount, error: schoolErr }, { count: userCount, error: userErr }] =
        await Promise.all([
          supabase.from("schools").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
        ]);
      if (schoolErr) throw schoolErr;
      if (userErr) throw userErr;

      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const { count: newSchools, error: newSchoolsErr } = await supabase
        .from("schools")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthAgo.toISOString());
      if (newSchoolsErr) throw newSchoolsErr;

      return {
        schools: schoolCount ?? 0,
        users: userCount ?? 0,
        newSchoolsLast30d: newSchools ?? 0,
      };
    },
  });
}

// ── School-scoped stats shared by staff dashboards ──────────

export function useSchoolDashboardStats(schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!schoolId,
    queryKey: ["dashboard", "school-stats", schoolId],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 6);
      const weekAgoStr = weekAgo.toISOString().slice(0, 10);
      const monthStart = new Date();
      monthStart.setDate(1);

      const [
        { count: studentCount, error: studentErr },
        { count: staffCount, error: staffErr },
        { data: todayAttendance, error: todayAttErr },
        { data: weekAttendance, error: weekAttErr },
        { data: monthPayments, error: paymentsErr },
      ] = await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }).eq("school_id", schoolId!).eq("status", "active"),
        supabase.from("staff").select("*", { count: "exact", head: true }).eq("school_id", schoolId!).eq("status", "active"),
        supabase.from("attendance_records").select("status").eq("school_id", schoolId!).eq("date", today),
        supabase.from("attendance_records").select("status, date").eq("school_id", schoolId!).gte("date", weekAgoStr).lte("date", today),
        supabase.from("payments").select("amount").eq("school_id", schoolId!).gte("paid_at", monthStart.toISOString()),
      ]);
      if (studentErr) throw studentErr;
      if (staffErr) throw staffErr;
      if (todayAttErr) throw todayAttErr;
      if (weekAttErr) throw weekAttErr;
      if (paymentsErr) throw paymentsErr;

      const good = (rows: { status: string }[]) =>
        rows.filter((r) => r.status === "present" || r.status === "late" || r.status === "half_day").length;

      const todayRows = todayAttendance ?? [];
      const weekRows = weekAttendance ?? [];
      const feesThisMonth = (monthPayments ?? []).reduce((s, p) => s + Number(p.amount || 0), 0);

      return {
        totalStudents: studentCount ?? 0,
        totalStaff: staffCount ?? 0,
        attendanceTodayPct: todayRows.length ? Math.round((good(todayRows) / todayRows.length) * 100) : null,
        attendanceWeekPct: weekRows.length ? Math.round((good(weekRows) / weekRows.length) * 100) : null,
        feesThisMonth,
      };
    },
  });
}
