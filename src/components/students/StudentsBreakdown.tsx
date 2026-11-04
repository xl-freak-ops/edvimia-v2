import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tables } from "@/integrations/supabase/types";

type Row = Tables<"students"> & { classes?: { name: string } | null };

function Bar({ label, count, total, tone }: { label: string; count: number; total: number; tone: string }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{count} · {pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className={`h-full rounded-full ${tone} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function StudentsBreakdown({ students }: { students: Row[] }) {
  const byClass = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of students) {
      const k = s.classes?.name ?? "Unassigned";
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [students]);

  const gender = useMemo(() => {
    const m = students.filter((s) => s.gender === "male").length;
    const f = students.filter((s) => s.gender === "female").length;
    const o = students.filter((s) => s.gender === "other").length;
    return { m, f, o, total: students.length };
  }, [students]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-sm">Students by Class</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {byClass.length === 0 ? (
            <p className="text-xs text-muted-foreground">No class assignments yet.</p>
          ) : (
            byClass.map(([name, count]) => (
              <Bar key={name} label={name} count={count} total={students.length} tone="bg-primary" />
            ))
          )}
        </CardContent>
      </Card>
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-sm">Students by Gender</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Bar label="Male" count={gender.m} total={gender.total} tone="bg-primary" />
          <Bar label="Female" count={gender.f} total={gender.total} tone="bg-accent-brand" />
          {gender.o > 0 && <Bar label="Other" count={gender.o} total={gender.total} tone="bg-muted-foreground" />}
        </CardContent>
      </Card>
    </div>
  );
}