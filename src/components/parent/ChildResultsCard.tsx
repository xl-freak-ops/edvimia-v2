import * as React from "react";
import { TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useChildResults } from "@/lib/parent/hooks";

interface Props {
  studentId: string;
  schoolId: string;
  compact?: boolean;
}

const GRADE_COLOR: Record<string, string> = {
  A: "text-success bg-success/10 border-success/30",
  B: "text-blue-700 dark:text-blue-400 bg-blue-500/10 border-blue-500/30",
  C: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30",
  D: "text-destructive bg-destructive/10 border-destructive/30",
  E: "text-destructive bg-destructive/10 border-destructive/30",
  F: "text-destructive bg-destructive/10 border-destructive/30",
};

function gradeColor(grade: string | null) {
  if (!grade) return "text-muted-foreground";
  const g = grade.charAt(0).toUpperCase();
  return GRADE_COLOR[g] ?? "text-muted-foreground";
}

export function ChildResultsCard({ studentId, schoolId, compact = false }: Props) {
  const { data: results = [], isLoading } = useChildResults(studentId, schoolId);

  if (isLoading) {
    return (
      <Card className="shadow-soft">
        <CardContent className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="shadow-soft">
        <CardContent className="flex h-32 flex-col items-center justify-center gap-2">
          <TrendingUp className="h-6 w-6 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No results published yet</p>
        </CardContent>
      </Card>
    );
  }

  // Sort by total descending; show current term first
  const sorted = [...results].sort((a, b) => {
    if (a.is_current_term !== b.is_current_term) return a.is_current_term ? -1 : 1;
    return (b.total ?? 0) - (a.total ?? 0);
  });

  const displayed = compact ? sorted.slice(0, 4) : sorted;
  const avg = results.length > 0
    ? Math.round(results.reduce((s, r) => s + (r.total ?? 0), 0) / results.length)
    : 0;

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Results
          </span>
          <span className="text-sm font-semibold text-muted-foreground">
            Avg: <span className="text-foreground">{avg}</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-[11px] text-muted-foreground uppercase tracking-wide">
                <th className="text-left pb-2 font-medium">Subject</th>
                <th className="text-right pb-2 font-medium">Total</th>
                <th className="text-right pb-2 font-medium">Grade</th>
                {!compact && <th className="text-right pb-2 font-medium">Position</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {displayed.map((r, i) => (
                <tr key={`${r.subject_id}-${r.term_id}`} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2 pr-3 font-medium">{r.subject_name}</td>
                  <td className="py-2 text-right font-mono font-semibold">{r.total ?? "–"}</td>
                  <td className="py-2 text-right">
                    <Badge variant="outline" className={cn("text-[11px]", gradeColor(r.grade))}>
                      {r.grade ?? "–"}
                    </Badge>
                  </td>
                  {!compact && (
                    <td className="py-2 text-right text-muted-foreground text-xs">
                      {r.position ? `${r.position}${ordinal(r.position)}` : "–"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
