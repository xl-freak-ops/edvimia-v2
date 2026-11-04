import * as React from "react";
import { CalendarCheck2, Loader2, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMyAttendance, computeAttendanceSummary } from "@/lib/student-portal/hooks";

interface Props {
  studentId: string;
  compact?: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  present: "bg-success",
  absent: "bg-destructive",
  late: "bg-amber-500",
  excused: "bg-blue-400",
  medical: "bg-blue-300",
  half_day: "bg-amber-300",
};

export function StudentAttendancePanel({ studentId, compact = false }: Props) {
  const { data: records = [], isLoading } = useMyAttendance(studentId);
  const summary = computeAttendanceSummary(records);

  if (isLoading) {
    return (
      <Card className="shadow-soft">
        <CardContent className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (records.length === 0) {
    return (
      <Card className="shadow-soft">
        <CardContent className="flex h-32 flex-col items-center justify-center gap-2">
          <CalendarCheck2 className="h-6 w-6 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No attendance records yet</p>
        </CardContent>
      </Card>
    );
  }

  const pctColor =
    summary.pct >= 90 ? "text-success" : summary.pct >= 75 ? "text-amber-500" : "text-destructive";
  const barColor =
    summary.pct >= 90 ? "bg-success" : summary.pct >= 75 ? "bg-amber-500" : "bg-destructive";

  // Streak
  let streak = 0;
  for (const r of records) {
    if (r.status === "present" || r.status === "late") streak++;
    else break;
  }

  const recent = records.slice(0, 30).reverse();

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarCheck2 className="h-4 w-4 text-primary" />
          My Attendance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Total", value: summary.total },
            { label: "Present", value: summary.present, cls: "text-success" },
            { label: "Absent", value: summary.absent, cls: "text-destructive" },
            { label: "Late", value: summary.late, cls: "text-amber-500" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-muted/50 p-2 text-center">
              <p className={cn("text-lg font-bold", s.cls)}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Attendance rate</p>
            <span className={cn("text-sm font-bold", pctColor)}>{summary.pct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", barColor)}
              style={{ width: `${summary.pct}%` }}
            />
          </div>
        </div>

        {streak >= 3 && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
            <Flame className="h-4 w-4 text-amber-500" />
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
              🔥 {streak} day attendance streak!
            </p>
          </div>
        )}

        {!compact && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Last {recent.length} sessions</p>
            <div className="flex flex-wrap gap-1">
              {recent.map((r) => (
                <div
                  key={r.id}
                  title={`${r.date}: ${r.status}`}
                  className={cn("h-4 w-4 rounded-sm cursor-help", STATUS_COLOR[r.status] ?? "bg-muted")}
                />
              ))}
            </div>
            <div className="mt-2 flex gap-3 flex-wrap">
              {[
                { label: "Present", cls: "bg-success" },
                { label: "Absent", cls: "bg-destructive" },
                { label: "Late", cls: "bg-amber-500" },
                { label: "Excused", cls: "bg-blue-400" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1">
                  <div className={cn("h-2.5 w-2.5 rounded-sm", l.cls)} />
                  <span className="text-[10px] text-muted-foreground">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
