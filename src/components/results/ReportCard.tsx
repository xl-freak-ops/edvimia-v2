import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Tables } from "@/integrations/supabase/types";
import type { Component, ResultScore } from "@/lib/results/hooks";
import { computeStudentTotal, resolveGrade, ordinal } from "@/lib/results/calc";

type Student = Tables<"students">;
type School = Tables<"schools">;
type Subject = Tables<"subjects">;
type Grade = Tables<"grade_scales">;
type Meta = Tables<"result_meta">;

export function ReportCard({
  school, student, subjects, components, scores, grades, meta, termName,
}: {
  school: School | null;
  student: Student;
  subjects: Subject[];
  components: Component[];
  scores: ResultScore[];
  grades: Grade[];
  meta: Meta | null;
  termName?: string | null;
}) {
  // Per-subject totals for this student
  const rows = subjects.map((sub) => {
    const mine = scores.filter((s) => s.subject_id === sub.id && s.student_id === student.id);
    const { total, percentage } = computeStudentTotal(mine, components);
    const g = resolveGrade(percentage, grades);
    return { subject: sub, total, percentage, grade: g.grade, remark: g.remark, entries: mine };
  }).filter((r) => r.entries.length > 0);

  const overall = rows.length ? rows.reduce((a, b) => a + b.percentage, 0) / rows.length : 0;
  const best = [...rows].sort((a, b) => b.percentage - a.percentage)[0];
  const worst = [...rows].sort((a, b) => a.percentage - b.percentage)[0];
  const overallGrade = resolveGrade(overall, grades);

  return (
    <div className="space-y-4 print:space-y-2">
      <div className="flex items-center justify-between print:hidden">
        <div className="text-sm text-muted-foreground">Report card preview · {termName ?? "Current term"}</div>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="mr-1.5 h-3.5 w-3.5" /> Print / PDF
        </Button>
      </div>

      <div className="mx-auto max-w-4xl rounded-2xl border bg-card p-8 shadow-soft print:border-0 print:shadow-none">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-3">
            {school?.logo_url ? (
              <img src={school.logo_url} alt="" className="h-14 w-14 rounded-lg object-cover" />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-lg bg-primary/10 text-primary text-lg font-bold">
                {school?.name?.[0] ?? "E"}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold tracking-tight">{school?.name ?? "School"}</h1>
              <p className="text-xs text-muted-foreground">
                {[school?.address, school?.state, school?.country].filter(Boolean).join(", ")}
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-primary">Student Report Card</p>
            </div>
          </div>
          <Avatar className="h-16 w-16 rounded-lg">
            <AvatarImage src={student.photo_url ?? undefined} />
            <AvatarFallback className="rounded-lg text-lg">
              {(student.first_name?.[0] ?? "") + (student.surname?.[0] ?? "")}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Info grid */}
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-4">
          <Info k="Name" v={`${student.first_name} ${student.middle_name ?? ""} ${student.surname}`} />
          <Info k="Admission #" v={student.admission_number ?? student.student_code ?? "—"} />
          <Info k="Class" v={student.class_id ? "—" : "—"} />
          <Info k="Term" v={termName ?? "—"} />
          <Info k="Attendance" v={meta ? `${meta.attendance_present ?? 0}/${meta.attendance_total ?? 0}` : "—"} />
          <Info k="Overall %" v={`${overall.toFixed(1)}%`} />
          <Info k="Grade" v={overallGrade.grade ?? "—"} />
          <Info k="Position" v={ordinal(null)} />
        </div>

        {/* Scores table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="p-2">Subject</th>
                {components.filter((c) => c.is_enabled).map((c) => (
                  <th key={c.id} className="p-2 text-center">{c.code}<div className="text-[9px] font-normal">/{c.max_score}</div></th>
                ))}
                <th className="p-2 text-center">Total</th>
                <th className="p-2 text-center">%</th>
                <th className="p-2 text-center">Grade</th>
                <th className="p-2">Remark</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={components.length + 5} className="p-6 text-center text-xs text-muted-foreground">No scored subjects yet.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.subject.id} className="border-b">
                  <td className="p-2 font-medium">{r.subject.name}</td>
                  {components.filter((c) => c.is_enabled).map((c) => {
                    const cell = r.entries.find((x) => x.component_id === c.id);
                    return <td key={c.id} className="p-2 text-center">{cell?.score ?? "—"}</td>;
                  })}
                  <td className="p-2 text-center font-medium">{r.total.toFixed(1)}</td>
                  <td className="p-2 text-center">{r.percentage.toFixed(0)}%</td>
                  <td className="p-2 text-center font-semibold">{r.grade ?? "—"}</td>
                  <td className="p-2 text-xs text-muted-foreground">{r.remark ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <SummaryCard title="Best subject" value={best?.subject.name ?? "—"} sub={best ? `${best.percentage.toFixed(0)}%` : ""} />
          <SummaryCard title="Needs attention" value={worst?.subject.name ?? "—"} sub={worst ? `${worst.percentage.toFixed(0)}%` : ""} />
          <SummaryCard title="Promotion" value={(meta?.promotion ?? "pending").replace("_", " ")} sub={meta?.next_resumption ?? ""} />
        </div>

        {/* Comments */}
        <div className="mt-6 space-y-3">
          <Comment label="Form teacher's comment" text={meta?.form_teacher_comment} />
          <Comment label="Principal's comment" text={meta?.principal_comment} />
        </div>

        <div className="mt-8 flex items-end justify-between text-[11px] text-muted-foreground">
          <div>Generated by Edvimia · {new Date().toLocaleDateString()}</div>
          <div className="text-right">
            <div className="mb-6 border-b border-dashed border-muted-foreground/40 w-40" />
            Principal's signature
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="truncate text-sm font-medium">{v}</div>
    </div>
  );
}

function SummaryCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Comment({ label, text }: { label: string; text?: string | null }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{text || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}