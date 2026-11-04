import { useMemo } from "react";
import { Sparkles, AlertTriangle, Users2, Clock, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { detectConflicts, type TimetablePeriod } from "@/lib/timetable/hooks";
import type { Tables } from "@/integrations/supabase/types";

type Staff = Tables<"staff">;

export function TimetableInsights({ periods, staff }: { periods: TimetablePeriod[]; staff: Staff[] }) {
  const data = useMemo(() => {
    const conflicts = detectConflicts(periods);
    const conflictCount = conflicts.size;

    const load = new Map<string, number>();
    periods.filter((p) => p.kind === "class" && p.teacher_id).forEach((p) => {
      load.set(p.teacher_id!, (load.get(p.teacher_id!) ?? 0) + 1);
    });
    const overloaded = staff
      .filter((s) => (load.get(s.id) ?? 0) >= 20)
      .slice(0, 3)
      .map((s) => `${s.full_name} · ${load.get(s.id)} periods / week`);

    // Empty slots by class
    const freeCount = periods.filter((p) => p.kind === "free").length;

    return { conflictCount, overloaded, freeCount };
  }, [periods, staff]);

  const cards = [
    {
      icon: AlertTriangle, tone: "text-rose-600 dark:text-rose-400 bg-rose-500/10",
      title: "Conflicts", items: data.conflictCount ? [`${data.conflictCount} conflicting period${data.conflictCount === 1 ? "" : "s"}`] : [],
      empty: "No conflicts detected. Schedule is clean.",
    },
    {
      icon: Users2, tone: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
      title: "Teacher overload", items: data.overloaded, empty: "Teacher load is balanced.",
    },
    {
      icon: Clock, tone: "text-primary bg-primary/10",
      title: "Free / gap periods", items: data.freeCount ? [`${data.freeCount} free periods available for revision`] : [],
      empty: "Every class period is committed.",
    },
  ];

  return (
    <Card className="shadow-soft border-border/70">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent-brand/15 text-accent-brand">
          <Sparkles className="h-4 w-4" />
        </div>
        <CardTitle className="text-base">Edvi · Timetable Intelligence</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.title} className="rounded-xl border border-border/70 bg-card/60 p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className={`grid h-7 w-7 place-items-center rounded-md ${c.tone}`}>
                <c.icon className="h-3.5 w-3.5" />
              </div>
              <div className="text-sm font-semibold">{c.title}</div>
            </div>
            {c.items.length === 0 ? (
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Lightbulb className="mt-0.5 h-3 w-3 shrink-0" /> {c.empty}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {c.items.map((t) => (<li key={t} className="text-xs text-foreground/90">• {t}</li>))}
              </ul>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}