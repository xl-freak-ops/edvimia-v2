import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import { fmtMoney } from "@/lib/finance/format";
import type { Invoice, Payment } from "@/lib/finance/hooks";

export function FinanceInsights({
  invoices,
  payments,
  currency = "NGN",
}: {
  invoices: (Invoice & Record<string, unknown>)[];
  payments: (Payment & Record<string, unknown>)[];
  currency?: string;
}) {
  const insights = React.useMemo(() => {
    const now = Date.now();
    const overdue = invoices.filter((i) => {
      if (!i.due_date) return false;
      return new Date(i.due_date).getTime() < now && Number(i.balance || 0) > 0;
    });
    const outstandingTotal = invoices.reduce((s, i) => s + Number(i.balance || 0), 0);
    const collected = invoices.reduce((s, i) => s + Number(i.amount_paid || 0), 0);
    const expected = invoices.reduce((s, i) => s + Number(i.total || 0), 0);
    const rate = expected > 0 ? Math.round((collected / expected) * 100) : 0;

    // Revenue by fee type via items would need join; approximate via invoices per class
    const byClass = new Map<string, number>();
    for (const inv of invoices) {
      const name = (inv.classes as { name?: string } | null)?.name ?? "Unassigned";
      byClass.set(name, (byClass.get(name) ?? 0) + Number(inv.amount_paid || 0));
    }
    const topClass = Array.from(byClass.entries()).sort((a, b) => b[1] - a[1])[0];

    // Defaulters: students with >1 unpaid invoice
    const perStudent = new Map<string, { name: string; owed: number; unpaid: number }>();
    for (const inv of invoices) {
      const bal = Number(inv.balance || 0);
      if (bal <= 0) continue;
      const s = inv.students as { first_name?: string; surname?: string } | null;
      const id = String(inv.student_id);
      const name = `${s?.first_name ?? ""} ${s?.surname ?? ""}`.trim() || "Student";
      const prev = perStudent.get(id) ?? { name, owed: 0, unpaid: 0 };
      perStudent.set(id, { name, owed: prev.owed + bal, unpaid: prev.unpaid + 1 });
    }
    const atRisk = Array.from(perStudent.values())
      .filter((s) => s.unpaid >= 2)
      .sort((a, b) => b.owed - a.owed)
      .slice(0, 3);

    const items = [
      {
        icon: TrendingUp,
        tone: "text-emerald-600",
        title: `Collection rate ${rate}%`,
        body:
          rate >= 80
            ? `Strong performance — ${fmtMoney(collected, currency)} collected of ${fmtMoney(expected, currency)} expected.`
            : `Collected ${fmtMoney(collected, currency)} of ${fmtMoney(expected, currency)}. Follow up on outstanding invoices to boost this quarter.`,
      },
      {
        icon: AlertTriangle,
        tone: "text-rose-600",
        title:
          overdue.length > 0
            ? `${overdue.length} overdue invoice${overdue.length === 1 ? "" : "s"}`
            : "No overdue invoices",
        body:
          overdue.length > 0
            ? `Outstanding balance across overdue: ${fmtMoney(
                overdue.reduce((s, i) => s + Number(i.balance || 0), 0),
                currency,
              )}. Send reminders to parents today.`
            : `You currently have ${fmtMoney(outstandingTotal, currency)} outstanding across all invoices.`,
      },
      {
        icon: ArrowRight,
        tone: "text-sky-600",
        title: topClass ? `Top revenue class: ${topClass[0]}` : "No class revenue yet",
        body: topClass
          ? `${topClass[0]} has generated ${fmtMoney(topClass[1], currency)} so far this period.`
          : "Once payments come in, Edvi will surface the strongest revenue class.",
      },
    ];

    return { items, atRisk };
  }, [invoices, payments, currency]);

  return (
    <Card className="shadow-soft border-primary/20 bg-gradient-to-br from-primary/[0.04] to-accent-brand/[0.04]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-accent-brand" />
          Edvi financial insights
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {insights.items.map((it) => (
          <div key={it.title} className="rounded-xl border bg-background/60 p-3">
            <div className={`flex items-center gap-1.5 text-sm font-semibold ${it.tone}`}>
              <it.icon className="h-4 w-4" />
              {it.title}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">{it.body}</p>
          </div>
        ))}
        {insights.atRisk.length > 0 && (
          <div className="md:col-span-3 rounded-xl border bg-background/60 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Likely defaulters
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {insights.atRisk.map((s) => (
                <div key={s.name} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                  <span className="truncate font-medium">{s.name}</span>
                  <span className="tabular-nums text-rose-600">{fmtMoney(s.owed, currency)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}