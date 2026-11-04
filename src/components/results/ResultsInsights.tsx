import { Sparkles, TrendingDown, TrendingUp, Trophy, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResultScore, Component } from "@/lib/results/hooks";
import type { Tables } from "@/integrations/supabase/types";
import { computeStudentTotal } from "@/lib/results/calc";

type Student = Tables<"students">;
type Class = Tables<"classes">;
type Subject = Tables<"subjects">;

export function ResultsInsights({
  scores, components, students, classes, subjects, passMark = 40,
}: {
  scores: ResultScore[];
  components: Component[];
  students: Student[];
  classes: Class[];
  subjects: Subject[];
  passMark?: number;
}) {
  const perStudentSubject = new Map<string, { studentId: string; subjectId: string; pct: number }>();
  for (const s of scores) {
    const k = `${s.student_id}::${s.subject_id}`;
    if (!perStudentSubject.has(k)) {
      const list = scores.filter((x) => x.student_id === s.student_id && x.subject_id === s.subject_id);
      const { percentage } = computeStudentTotal(list, components);
      perStudentSubject.set(k, { studentId: s.student_id, subjectId: s.subject_id, pct: percentage });
    }
  }

  const classAvg = new Map<string, { sum: number; n: number }>();
  const subjectAvg = new Map<string, { sum: number; n: number }>();
  for (const { studentId, subjectId, pct } of perStudentSubject.values()) {
    const st = students.find((s) => s.id === studentId);
    if (st?.class_id) {
      const a = classAvg.get(st.class_id) ?? { sum: 0, n: 0 };
      a.sum += pct; a.n += 1; classAvg.set(st.class_id, a);
    }
    const b = subjectAvg.get(subjectId) ?? { sum: 0, n: 0 };
    b.sum += pct; b.n += 1; subjectAvg.set(subjectId, b);
  }

  const classRank = [...classAvg.entries()]
    .map(([id, v]) => ({ id, name: classes.find((c) => c.id === id)?.name ?? "—", avg: v.n ? v.sum / v.n : 0 }))
    .sort((a, b) => b.avg - a.avg);
  const subjectRank = [...subjectAvg.entries()]
    .map(([id, v]) => ({ id, name: subjects.find((s) => s.id === id)?.name ?? "—", avg: v.n ? v.sum / v.n : 0 }))
    .sort((a, b) => b.avg - a.avg);

  const best = classRank[0];
  const worst = classRank[classRank.length - 1];
  const hardestSubject = subjectRank[subjectRank.length - 1];
  const atRisk = [...perStudentSubject.values()].filter((x) => x.pct > 0 && x.pct < passMark).length;
  const outstanding = [...perStudentSubject.values()].filter((x) => x.pct >= 80).length;

  const items = [
    { icon: Trophy, tone: "text-emerald-600 bg-emerald-500/10",
      title: best ? `${best.name} leading` : "No class data",
      body: best ? `Average ${best.avg.toFixed(1)}% across scored subjects.` : "Enter scores to unlock class rankings." },
    { icon: TrendingDown, tone: "text-rose-600 bg-rose-500/10",
      title: worst && worst !== best ? `${worst.name} needs support` : "All classes tracking well",
      body: worst && worst !== best ? `Sitting at ${worst.avg.toFixed(1)}% — consider intervention.` : "No class is significantly behind yet." },
    { icon: AlertTriangle, tone: "text-amber-600 bg-amber-500/10",
      title: `${atRisk} at-risk score${atRisk === 1 ? "" : "s"}`,
      body: hardestSubject ? `Hardest subject: ${hardestSubject.name} (${hardestSubject.avg.toFixed(1)}%).` : "No subject flagged." },
    { icon: TrendingUp, tone: "text-sky-600 bg-sky-500/10",
      title: `${outstanding} outstanding performance${outstanding === 1 ? "" : "s"}`,
      body: "Students scoring 80% or higher in a subject this term." },
  ];

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-accent-brand" /> Edvi · Academic insights
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((it, i) => (
          <div key={i} className="rounded-xl border bg-muted/20 p-3">
            <div className={`mb-2 grid h-8 w-8 place-items-center rounded-lg ${it.tone}`}>
              <it.icon className="h-4 w-4" />
            </div>
            <div className="text-sm font-semibold">{it.title}</div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{it.body}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}