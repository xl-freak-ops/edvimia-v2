import * as React from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  studentName: string;
  attendancePct: number;
  results: Array<{ subjectName: string; total: number; grade: string | null }>;
  outstandingBalance: number;
}

function buildSummary(
  studentName: string,
  attendancePct: number,
  results: Props["results"],
  outstandingBalance: number,
  variant: number,
): string {
  const firstName = studentName.split(" ")[0];

  if (results.length === 0 && attendancePct === 0) {
    return `Welcome to ${firstName}'s portal. As data becomes available — attendance records, results, and fee information — Edvi will generate personalized insights here to help you stay engaged in your child's education.`;
  }

  const sorted = [...results].sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const avg =
    results.length > 0
      ? Math.round(results.reduce((s, r) => s + (r.total ?? 0), 0) / results.length)
      : null;

  const attendanceNote =
    attendancePct >= 90
      ? `${firstName}'s attendance is excellent at ${attendancePct}% — keep encouraging that consistency.`
      : attendancePct >= 75
      ? `Attendance stands at ${attendancePct}%. There's room for improvement — try to minimise absences this term.`
      : `Attendance has dropped to ${attendancePct}%, which may impact performance. Please discuss this with the school.`;

  const performanceNote =
    avg != null
      ? variant % 2 === 0
        ? `${firstName} is averaging ${avg}/100 across ${results.length} subject${results.length > 1 ? "s" : ""}.`
        : `Overall academic average is ${avg}/100 this term.`
      : "";

  const bestNote = best
    ? variant % 3 === 0
      ? `Strongest performance is in ${best.subjectName} with ${best.total}/100.`
      : `${firstName} is excelling in ${best.subjectName} (${best.total}/100) — great work!`
    : "";

  const worstNote =
    worst && results.length > 1 && worst.total < 60
      ? `${worst.subjectName} (${worst.total}/100) may need extra attention — consider arranging revision sessions.`
      : worst && results.length > 1
      ? `${worst.subjectName} has the lowest score at ${worst.total}/100, but still within a solid range.`
      : "";

  const financeNote =
    outstandingBalance > 0
      ? `There is an outstanding fee balance of ${new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(outstandingBalance)}. Please settle this before the deadline to avoid disruptions.`
      : "All fees are up to date. ✓";

  return [attendanceNote, performanceNote, bestNote, worstNote, financeNote]
    .filter(Boolean)
    .join(" ");
}

export function ParentAISummary({
  studentName,
  attendancePct,
  results,
  outstandingBalance,
}: Props) {
  const [variant, setVariant] = React.useState(0);
  const summary = buildSummary(studentName, attendancePct, results, outstandingBalance, variant);

  return (
    <div className="relative overflow-hidden rounded-xl border border-accent-brand/20 bg-gradient-to-br from-accent-brand/10 via-card to-primary/5 p-4 shadow-soft">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent-brand/10 blur-2xl" />

      <div className="relative space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-accent-brand to-primary shadow-soft">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-accent-brand to-primary bg-clip-text text-transparent">
                Edvi · AI Insight
              </p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-accent-brand"
            onClick={() => setVariant((v) => v + 1)}
            title="Get new insights"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Summary text */}
        <p className="text-sm leading-relaxed text-foreground">{summary}</p>

        {/* Footer note */}
        <p className="text-[10px] text-muted-foreground">
          Generated from real attendance, results, and finance data · Not a substitute for professional advice
        </p>
      </div>
    </div>
  );
}
