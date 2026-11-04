import { useMemo } from "react";
import { Sparkles, AlertTriangle, TrendingDown, Users2, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tables } from "@/integrations/supabase/types";

type Att = Tables<"attendance_records">;
type Student = Tables<"students">;

export function AttendanceInsights({ range, students }: { range: Att[]; students: Student[] }) {
  const insights = useMemo(() => {
    const byStudent = new Map<string, { total: number; absent: number; late: number }>();
    range.forEach((r) => {
      const rec = byStudent.get(r.student_id) ?? { total: 0, absent: 0, late: 0 };
      rec.total += 1;
      if (r.status === "absent") rec.absent += 1;
      if (r.status === "late") rec.late += 1;
      byStudent.set(r.student_id, rec);
    });
    const chronic = students.filter((s) => {
      const rec = byStudent.get(s.id);
      return rec && rec.total >= 5 && rec.absent / rec.total >= 0.3;
    }).slice(0, 3);
    const oftenLate = students.filter((s) => {
      const rec = byStudent.get(s.id);
      return rec && rec.late >= 3;
    }).slice(0, 3);

    // Poor-performing classes
    const byClass = new Map<string, { total: number; missed: number }>();
    range.forEach((r) => {
      const k = `${r.class_id ?? "-"}::${r.arm_id ?? "-"}`;
      const rec = byClass.get(k) ?? { total: 0, missed: 0 };
      rec.total += 1;
      if (r.status === "absent") rec.missed += 1;
      byClass.set(k, rec);
    });
    const worstClasses = Array.from(byClass.entries())
      .filter(([, v]) => v.total >= 10 && v.missed / v.total >= 0.2)
      .slice(0, 3)
      .map(([k, v]) => `Class ${k.replace("::", " · ")} — ${Math.round((v.missed / v.total) * 100)}% absence`);

    return { chronic, oftenLate, worstClasses };
  }, [range, students]);

  const cards = [
    {
      icon: TrendingDown, tone: "text-rose-600 dark:text-rose-400 bg-rose-500/10",
      title: "Chronic absentees",
      empty: "No chronic absenteeism detected.",
      items: insights.chronic.map((s) => `${s.first_name} ${s.surname} · needs immediate follow-up`),
    },
    {
      icon: AlertTriangle, tone: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
      title: "Frequently late",
      empty: "Punctuality is healthy.",
      items: insights.oftenLate.map((s) => `${s.first_name} ${s.surname} · 3+ late arrivals`),
    },
    {
      icon: Users2, tone: "text-primary bg-primary/10",
      title: "Classes to watch",
      empty: "All classes maintain healthy attendance.",
      items: insights.worstClasses,
    },
  ];

  return (
    <Card className="shadow-soft border-border/70">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent-brand/15 text-accent-brand">
            <Sparkles className="h-4 w-4" />
          </div>
          <CardTitle className="text-base">Edvi · Attendance Intelligence</CardTitle>
        </div>
        <span className="hidden text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:inline">
          Rolling 30 days
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
                {c.items.map((t) => (<li key={t} className="text-xs text-foreground/90">• {t}</li>))}
              </ul>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}