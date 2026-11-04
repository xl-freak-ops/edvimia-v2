import { useMemo } from "react";
import { Users, UserPlus, GraduationCap, ArrowRightLeft, UserX, School } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Tables } from "@/integrations/supabase/types";

type Row = Tables<"students">;

function Stat({
  icon: Icon,
  label,
  value,
  tone = "primary",
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
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
        </div>
      </CardContent>
    </Card>
  );
}

export function StudentsStats({ students }: { students: Row[] }) {
  const s = useMemo(() => {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 864e5).toISOString();
    return {
      total: students.length,
      newAdmissions: students.filter((x) => x.created_at > monthAgo).length,
      graduated: students.filter((x) => x.status === "graduated").length,
      transferred: students.filter((x) => x.status === "transferred").length,
      suspended: students.filter((x) => x.status === "suspended").length,
      active: students.filter((x) => x.status === "active").length,
    };
  }, [students]);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <Stat icon={Users} label="Total Students" value={s.total} />
      <Stat icon={UserPlus} label="New Admissions" value={s.newAdmissions} tone="success" />
      <Stat icon={School} label="Active" value={s.active} tone="primary" />
      <Stat icon={GraduationCap} label="Graduated" value={s.graduated} tone="muted" />
      <Stat icon={ArrowRightLeft} label="Transferred" value={s.transferred} tone="warning" />
      <Stat icon={UserX} label="Suspended" value={s.suspended} tone="danger" />
    </div>
  );
}