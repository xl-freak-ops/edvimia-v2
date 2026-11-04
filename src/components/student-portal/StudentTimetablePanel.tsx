import * as React from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useMyTimetable } from "@/lib/student-portal/hooks";

interface Props {
  classId: string;
  armId: string | null;
  schoolId: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Deterministic color per subject name
function subjectColor(name: string) {
  const colors = [
    "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20",
    "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
    "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/20",
    "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20",
    "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
    "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20",
    "bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-500/20",
    "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/20",
  ];
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xfffff;
  return colors[hash % colors.length];
}

function formatTime(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export function StudentTimetablePanel({ classId, armId, schoolId }: Props) {
  const { data: periods = [], isLoading } = useMyTimetable(classId, armId, schoolId);

  if (isLoading) {
    return (
      <Card className="shadow-soft">
        <CardContent className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (periods.length === 0) {
    return (
      <Card className="shadow-soft">
        <CardContent className="flex h-32 flex-col items-center justify-center gap-2">
          <CalendarDays className="h-6 w-6 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No timetable configured yet</p>
        </CardContent>
      </Card>
    );
  }

  const byDay = DAYS.reduce(
    (acc, _, i) => {
      const dayNum = i + 1;
      acc[dayNum] = (periods as Record<string, unknown>[]).filter(
        (p) => p.day_of_week === dayNum
      );
      return acc;
    },
    {} as Record<number, Record<string, unknown>[]>,
  );

  const activeDays = DAYS.filter((_, i) => (byDay[i + 1] ?? []).length > 0);

  function PeriodCell({ p }: { p: Record<string, unknown> }) {
    const kind = p.kind as string;
    const subj = p.subjects as Record<string, unknown> | null;
    const staff = p.staff as Record<string, unknown> | null;
    const name = (subj?.name as string) ?? kind;
    const isBreak = kind === "break" || kind === "lunch" || kind === "assembly" || kind === "free";

    return (
      <div
        className={cn(
          "rounded-lg border px-2.5 py-2 text-xs",
          isBreak
            ? "bg-muted/30 text-muted-foreground border-border"
            : subjectColor(name),
        )}
      >
        <p className="font-semibold truncate">{name}</p>
        {staff && (
          <p className="text-[10px] opacity-70 mt-0.5 truncate">
            {staff.first_name as string} {(staff.last_name as string)?.charAt(0)}.
          </p>
        )}
        <p className="text-[10px] opacity-70 mt-0.5">
          {formatTime(p.start_time as string)} – {formatTime(p.end_time as string)}
        </p>
        {(p.room as string | null) && <p className="text-[10px] opacity-60">{p.room as string}</p>}
      </div>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4 text-primary" />
          My Timetable
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeDays[0] ?? "Monday"}>
          <TabsList className="flex-wrap h-auto gap-1 mb-4">
            {activeDays.map((day) => (
              <TabsTrigger key={day} value={day} className="text-xs">
                {day.slice(0, 3)}
              </TabsTrigger>
            ))}
          </TabsList>
          {activeDays.map((day, i) => (
            <TabsContent key={day} value={day}>
              <div className="space-y-2">
                {(byDay[i + 1] ?? []).map((p, pi) => (
                  <PeriodCell key={pi} p={p} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
