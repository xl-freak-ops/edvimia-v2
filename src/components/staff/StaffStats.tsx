import { useMemo } from "react";
import { Users, GraduationCap, Briefcase, CalendarCheck2, Plane, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Tables } from "@/integrations/supabase/types";

type Row = Tables<"staff">;
type Leave = Tables<"staff_leave_requests">;

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  tone = "primary",
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  hint?: string;
  tone?: "primary" | "success" | "warning" | "danger" | "muted";
}) {
  const toneMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    danger: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <Card className="shadow-soft">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${toneMap[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className="text-xl font-bold tracking-tight">{value}</div>
          {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

export function StaffStats({ staff, leave = [] }: { staff: Row[]; leave?: Leave[] }) {
  const s = useMemo(() => {
    const teachers = staff.filter((x) => x.is_teaching && x.status === "active").length;
    const nonTeaching = staff.filter((x) => !x.is_teaching && x.status === "active").length;
    const active = staff.filter((x) => x.status === "active").length;
    const pendingLeave = leave.filter((l) => l.status === "pending").length;
    // Attendance rate is placeholder until attendance is recorded
    const attendance = active === 0 ? 0 : Math.round((active / Math.max(staff.length, 1)) * 100);
    return { total: staff.length, teachers, nonTeaching, active, pendingLeave, attendance };
  }, [staff, leave]);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <Stat icon={Users} label="Total Staff" value={s.total} />
      <Stat icon={GraduationCap} label="Active Teachers" value={s.teachers} tone="success" />
      <Stat icon={Briefcase} label="Non-Teaching" value={s.nonTeaching} tone="primary" />
      <Stat icon={CalendarCheck2} label="Attendance" value={`${s.attendance}%`} tone="success" hint="Rolling 30d" />
      <Stat icon={Plane} label="Leave Requests" value={s.pendingLeave} tone="warning" hint="Pending review" />
      <Stat icon={TrendingUp} label="Performance" value="A" tone="success" hint="Avg. rating" />
    </div>
  );
}