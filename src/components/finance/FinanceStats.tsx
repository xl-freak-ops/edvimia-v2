import { Card, CardContent } from "@/components/ui/card";
import { CircleDollarSign, Receipt, TrendingUp, AlertTriangle, Wallet, PiggyBank } from "lucide-react";
import { fmtMoney } from "@/lib/finance/format";
import type { Invoice, Payment, Expense } from "@/lib/finance/hooks";

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export function FinanceStats({
  invoices,
  payments,
  expenses,
  currency = "NGN",
}: {
  invoices: (Invoice & Record<string, unknown>)[];
  payments: (Payment & Record<string, unknown>)[];
  expenses: (Expense & Record<string, unknown>)[];
  currency?: string;
}) {
  const now = new Date();
  const expectedRevenue = invoices.reduce((s, i) => s + Number(i.total || 0), 0);
  const collected = invoices.reduce((s, i) => s + Number(i.amount_paid || 0), 0);
  const outstanding = invoices.reduce((s, i) => s + Number(i.balance || 0), 0);
  const outstandingCount = invoices.filter((i) => Number(i.balance || 0) > 0).length;
  const todayTotal = payments
    .filter((p) => isSameDay(new Date(p.paid_at), now))
    .reduce((s, p) => s + Number(p.amount || 0), 0);
  const monthTotal = payments
    .filter((p) => isSameMonth(new Date(p.paid_at), now))
    .reduce((s, p) => s + Number(p.amount || 0), 0);
  const monthExpense = expenses
    .filter((e) => isSameMonth(new Date(e.expense_date), now) && e.status !== "rejected" && e.status !== "draft")
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const netMonth = monthTotal - monthExpense;

  const items = [
    { label: "Total revenue", value: fmtMoney(collected, currency), icon: CircleDollarSign, tone: "bg-emerald-500/15 text-emerald-600" },
    { label: "Outstanding fees", value: fmtMoney(outstanding, currency), icon: AlertTriangle, tone: "bg-rose-500/15 text-rose-600", hint: `${outstandingCount} invoice${outstandingCount === 1 ? "" : "s"}` },
    { label: "Today's payments", value: fmtMoney(todayTotal, currency), icon: Receipt, tone: "bg-sky-500/15 text-sky-600" },
    { label: "This month", value: fmtMoney(monthTotal, currency), icon: TrendingUp, tone: "bg-violet-500/15 text-violet-600" },
    { label: "Expected revenue", value: fmtMoney(expectedRevenue, currency), icon: Wallet, tone: "bg-amber-500/15 text-amber-600" },
    { label: "Net (month)", value: fmtMoney(netMonth, currency), icon: PiggyBank, tone: netMonth >= 0 ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600", hint: `Expenses ${fmtMoney(monthExpense, currency)}` },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map((it) => (
        <Card key={it.label} className="shadow-soft">
          <CardContent className="flex items-start gap-3 p-4">
            <div className={`grid h-10 w-10 place-items-center rounded-xl ${it.tone}`}>
              <it.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold leading-none tracking-tight">{it.value}</div>
              <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{it.label}</div>
              {it.hint && <div className="mt-0.5 truncate text-xs text-muted-foreground">{it.hint}</div>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}