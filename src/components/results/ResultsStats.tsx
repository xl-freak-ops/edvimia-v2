import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ClipboardList, TrendingDown, TrendingUp } from "lucide-react";
import type { ResultScore, ResultSheet, Component } from "@/lib/results/hooks";
import { computeStudentTotal } from "@/lib/results/calc";

type Item = { label: string; value: string | number; icon: React.ElementType; hint?: string; tone?: string };

function Tile({ item }: { item: Item }) {
  return (
    <Card className="shadow-soft">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${item.tone ?? "bg-primary/10 text-primary"}`}>
          <item.icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-xl font-semibold leading-none tracking-tight">{item.value}</div>
          <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{item.label}</div>
          {item.hint && <div className="mt-0.5 truncate text-xs text-muted-foreground">{item.hint}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

export function ResultsStats({
  sheets, scores, components, passMark = 40,
}: {
  sheets: ResultSheet[];
  scores: ResultScore[];
  components: Component[];
  passMark?: number;
}) {
  const published = sheets.filter((s) => s.status === "published").length;
  const pending = sheets.filter((s) => s.status !== "published" && s.status !== "rejected").length;

  const bucket = new Map<string, ResultScore[]>();
  for (const s of scores) {
    const k = `${s.student_id}::${s.subject_id}::${s.term_id ?? "-"}`;
    let arr = bucket.get(k);
    if (!arr) { arr = []; bucket.set(k, arr); }
    arr.push(s);
  }
  let pass = 0, fail = 0;
  for (const list of bucket.values()) {
    const { percentage } = computeStudentTotal(list, components);
    if (percentage >= passMark) pass++; else if (percentage > 0) fail++;
  }

  const items: Item[] = [
    { label: "Published", value: published, icon: CheckCircle2, tone: "bg-emerald-500/15 text-emerald-600" },
    { label: "Pending",   value: pending,   icon: ClipboardList, tone: "bg-amber-500/15 text-amber-600" },
    { label: "Passed",    value: pass,      icon: TrendingUp,    tone: "bg-sky-500/15 text-sky-600" },
    { label: "Failed",    value: fail,      icon: TrendingDown,  tone: "bg-rose-500/15 text-rose-600" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => <Tile key={it.label} item={it} />)}
    </div>
  );
}