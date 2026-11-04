import * as React from "react";
import { Plus, AlertTriangle, MapPin, User as UserIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DAYS, detectConflicts, type TimetablePeriod } from "@/lib/timetable/hooks";
import type { Tables } from "@/integrations/supabase/types";

type Subject = Tables<"subjects">;
type Staff = Tables<"staff">;

export function TimetableGrid({
  periods, subjects, staff, canEdit, onEdit, onAdd,
}: {
  periods: TimetablePeriod[];
  subjects: Subject[];
  staff: Staff[];
  canEdit: boolean;
  onEdit: (p: TimetablePeriod) => void;
  onAdd: (day: number) => void;
}) {
  const conflicts = React.useMemo(() => detectConflicts(periods), [periods]);
  const subjectMap = React.useMemo(() => new Map(subjects.map((s) => [s.id, s.name])), [subjects]);
  const staffMap = React.useMemo(() => new Map(staff.map((s) => [s.id, s.full_name])), [staff]);

  const byDay = React.useMemo(() => {
    const m = new Map<number, TimetablePeriod[]>();
    DAYS.forEach((d) => m.set(d.i, []));
    periods.forEach((p) => {
      const arr = m.get(p.day_of_week) ?? [];
      arr.push(p);
      m.set(p.day_of_week, arr);
    });
    m.forEach((arr) => arr.sort((a, b) => a.start_time.localeCompare(b.start_time)));
    return m;
  }, [periods]);

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {DAYS.map((d) => {
        const list = byDay.get(d.i) ?? [];
        return (
          <Card key={d.i} className="shadow-soft">
            <div className="flex items-center justify-between px-4 pb-2 pt-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{d.short}</div>
                <div className="text-sm font-semibold">{d.long}</div>
              </div>
              {canEdit && (
                <Button size="sm" variant="ghost" onClick={() => onAdd(d.i)}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <CardContent className="space-y-2 px-3 pb-3 pt-0">
              {list.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-center text-[11px] text-muted-foreground">
                  No periods yet
                </div>
              ) : (
                list.map((p) => {
                  const conf = conflicts.get(p.id);
                  const subject = p.subject_id ? subjectMap.get(p.subject_id) : null;
                  const teacher = p.teacher_id ? staffMap.get(p.teacher_id) : null;
                  const color = p.color ?? "#6366f1";
                  return (
                    <button
                      key={p.id}
                      onClick={() => canEdit && onEdit(p)}
                      className={cn(
                        "group relative w-full overflow-hidden rounded-lg border border-border/70 bg-card px-3 py-2 text-left transition hover:shadow-sm",
                        canEdit && "cursor-pointer",
                      )}
                    >
                      <div className="absolute inset-y-0 left-0 w-1" style={{ background: color }} />
                      <div className="flex items-start justify-between gap-2 pl-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                              {p.start_time.slice(0, 5)} – {p.end_time.slice(0, 5)}
                            </span>
                            {p.kind !== "class" && (
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                                {p.kind}
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 truncate text-sm font-semibold">
                            {p.kind === "class" ? subject ?? "Untitled subject" : p.kind[0].toUpperCase() + p.kind.slice(1)}
                          </div>
                          {p.kind === "class" && (
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                              {teacher && <span className="inline-flex items-center gap-1"><UserIcon className="h-3 w-3" /> {teacher}</span>}
                              {p.room && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.room}</span>}
                            </div>
                          )}
                        </div>
                        {conf && conf.length > 0 && (
                          <span title={conf.join(", ")} className="shrink-0 rounded-md bg-rose-500/10 p-1 text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}