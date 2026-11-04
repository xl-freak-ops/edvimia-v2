import { useMemo } from "react";
import { Sparkles, TrendingUp, TrendingDown, Layers, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tables } from "@/integrations/supabase/types";

type Staff = Tables<"staff">;
type Assignment = Tables<"staff_assignments">;
type Attendance = Tables<"staff_attendance">;

export function StaffAIInsights({
  staff,
  assignments = [],
  attendance = [],
}: {
  staff: Staff[];
  assignments?: Assignment[];
  attendance?: Attendance[];
}) {
  const insights = useMemo(() => {
    const loadByStaff = new Map<string, number>();
    assignments.forEach((a) => loadByStaff.set(a.staff_id, (loadByStaff.get(a.staff_id) ?? 0) + 1));
    const overloaded = staff
      .filter((s) => (loadByStaff.get(s.id) ?? 0) >= 5)
      .slice(0, 3);

    const attByStaff = new Map<string, { total: number; absent: number }>();
    attendance.forEach((a) => {
      const rec = attByStaff.get(a.staff_id) ?? { total: 0, absent: 0 };
      rec.total += 1;
      if (a.status === "absent") rec.absent += 1;
      attByStaff.set(a.staff_id, rec);
    });
    const poorAttendance = staff
      .filter((s) => {
        const rec = attByStaff.get(s.id);
        return rec && rec.total >= 5 && rec.absent / rec.total > 0.2;
      })
      .slice(0, 3);

    // Star performers: 5+ classes with excellent attendance heuristic
    const stars = staff
      .filter((s) => (loadByStaff.get(s.id) ?? 0) >= 3 && s.status === "active")
      .slice(0, 3);

    return { overloaded, poorAttendance, stars };
  }, [staff, assignments, attendance]);

  const cards = [
    {
      icon: TrendingUp,
      tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
      title: "Outstanding performers",
      empty: "No standout performers yet — data will populate as assignments grow.",
      items: insights.stars.map((s) => `${s.full_name} · ${s.position.replace(/_/g, " ")}`),
    },
    {
      icon: TrendingDown,
      tone: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
      title: "Poor attendance",
      empty: "Attendance is healthy across the team.",
      items: insights.poorAttendance.map((s) => `${s.full_name} · needs follow-up`),
    },
    {
      icon: Layers,
      tone: "text-rose-600 dark:text-rose-400 bg-rose-500/10",
      title: "Workload risk",
      empty: "Workload is balanced across teachers.",
      items: insights.overloaded.map((s) => `${s.full_name} · 5+ concurrent assignments`),
    },
  ];

  return (
    <Card className="shadow-soft border-border/70">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent-brand/15 text-accent-brand">
            <Sparkles className="h-4 w-4" />
          </div>
          <CardTitle className="text-base">Edvi · Staff Intelligence</CardTitle>
        </div>
        <span className="hidden text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:inline">
          Live analysis
        </span>
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
                {c.items.map((t) => (
                  <li key={t} className="text-xs text-foreground/90">
                    • {t}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}