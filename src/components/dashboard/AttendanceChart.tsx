import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CalendarCheck2 } from "lucide-react";
import { useAttendanceRange } from "@/lib/attendance/hooks";
import { buildAttendanceTrend, attendanceRateSummary } from "@/lib/dashboard/format";
import { EmptyState } from "@/components/school/EmptyState";

function last7Days() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 6);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export function AttendanceChart({ schoolId }: { schoolId: string | null | undefined }) {
  const { from, to } = last7Days();
  const { data: records = [], isLoading } = useAttendanceRange(schoolId, from, to);

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/70 shadow-soft">
        <CardContent className="flex h-56 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const trend = buildAttendanceTrend(records, from, to);
  const { avgRate, studentsTracked } = attendanceRateSummary(records);

  return (
    <Card className="rounded-2xl border-border/70 shadow-soft">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-semibold">Weekly attendance</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {records.length > 0 ? (
              <>
                Average <span className="font-semibold text-foreground">{avgRate}%</span> · {studentsTracked} students tracked
              </>
            ) : (
              "No attendance recorded this week"
            )}
          </p>
        </div>
        {records.length > 0 && (
          <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" /> Present rate
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        {records.length === 0 ? (
          <EmptyState
            icon={CalendarCheck2}
            title="No attendance data yet"
            description="Once attendance is marked for this school, weekly trends will appear here."
          />
        ) : (
          <div className="flex h-48 items-end gap-3 sm:gap-5">
            {trend.map((d) => (
              <div key={d.label} className="group flex h-full flex-1 flex-col items-center gap-2">
                <div className="relative flex h-full w-full max-w-[44px] items-end justify-center overflow-hidden rounded-lg bg-muted/40 transition-colors group-hover:bg-muted/70">
                  <div
                    className="w-full rounded-lg bg-gradient-to-t from-primary to-primary/70 transition-all duration-500"
                    style={{ height: `${d.rate}%` }}
                  />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">{d.label}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
