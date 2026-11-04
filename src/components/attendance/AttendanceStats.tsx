import { useMemo } from "react";
import { Users, UserCheck, UserX, Clock, HeartPulse, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Tables } from "@/integrations/supabase/types";

type Row = Tables<"attendance_records">;

function Stat({
  icon: Icon, label, value, hint, tone = "primary",
}: { icon: typeof Users; label: string; value: number | string; hint?: string; tone?: "primary" | "success" | "warning" | "danger" | "info" }) {
  const toneMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    danger: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    info: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
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

export function AttendanceStats({ today, staffToday }: { today: Row[]; staffToday?: number }) {
  const s = useMemo(() => {
    const total = today.length;
    const present = today.filter((r) => r.status === "present").length;
    const absent = today.filter((r) => r.status === "absent").length;
    const late = today.filter((r) => r.status === "late").length;
    const medical = today.filter((r) => r.status === "medical" || r.status === "excused").length;
    const rate = total === 0 ? 0 : Math.round(((present + late) / total) * 100);
    return { total, present, absent, late, medical, rate };
  }, [today]);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <Stat icon={UserCheck} label="Today's rate" value={`${s.rate}%`} tone="success" hint={`${s.total} marked`} />
      <Stat icon={Users} label="Present" value={s.present} tone="success" />
      <Stat icon={UserX} label="Absent" value={s.absent} tone="danger" />
      <Stat icon={Clock} label="Late" value={s.late} tone="warning" />
      <Stat icon={HeartPulse} label="Excused / Medical" value={s.medical} tone="info" />
      <Stat icon={GraduationCap} label="Teachers present" value={staffToday ?? "—"} tone="primary" />
    </div>
  );
}