import * as React from "react";
import { Wallet, Loader2, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useChildInvoices, useChildPayments } from "@/lib/parent/hooks";

interface Props {
  studentId: string;
  schoolId: string;
}

const STATUS_STYLES: Record<string, string> = {
  paid: "text-success bg-success/10 border-success/30",
  partial: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30",
  overdue: "text-destructive bg-destructive/10 border-destructive/30",
  issued: "text-blue-700 dark:text-blue-400 bg-blue-500/10 border-blue-500/30",
  draft: "text-muted-foreground bg-muted border-border",
  cancelled: "text-muted-foreground bg-muted border-border",
};

function fmt(n: number | null, currency = "NGN") {
  if (n == null) return "–";
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, minimumFractionDigits: 0 }).format(n);
}

export function ChildFinanceCard({ studentId, schoolId }: Props) {
  const { data: invoices = [], isLoading: invLoading } = useChildInvoices(studentId, schoolId);
  const { data: payments = [], isLoading: payLoading } = useChildPayments(studentId, schoolId);

  const isLoading = invLoading || payLoading;

  if (isLoading) {
    return (
      <Card className="shadow-soft">
        <CardContent className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card className="shadow-soft">
        <CardContent className="flex h-32 flex-col items-center justify-center gap-2">
          <Wallet className="h-6 w-6 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No invoices yet</p>
        </CardContent>
      </Card>
    );
  }

  const totalInvoiced = invoices.reduce((s, i) => s + ((i as Record<string, unknown>).total as number ?? 0), 0);
  const totalPaid = payments.reduce((s, p) => s + ((p as Record<string, unknown>).amount as number ?? 0), 0);
  const outstanding = Math.max(0, totalInvoiced - totalPaid);

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-4 w-4 text-primary" />
          Finance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Total Billed", value: totalInvoiced, cls: "text-foreground" },
            { label: "Total Paid", value: totalPaid, cls: "text-success" },
            { label: "Outstanding", value: outstanding, cls: outstanding > 0 ? "text-destructive" : "text-success" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-muted/50 p-2 text-center">
              <p className={cn("text-sm font-bold tabular-nums", s.cls)}>{fmt(s.value)}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <Separator />

        {/* Invoice list */}
        <div className="space-y-2">
          {invoices.map((inv) => {
            const i = inv as Record<string, unknown>;
            const term = i.terms as Record<string, unknown> | null;
            const total = i.total as number;
            const status = i.status as string;
            const dueDate = i.due_date as string | null;
            return (
              <div key={i.id as string} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{term?.name as string ?? "Invoice"}</p>
                  {dueDate && (
                    <p className="text-[11px] text-muted-foreground">
                      Due: {new Date(dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className="font-mono text-sm font-semibold tabular-nums">{fmt(total)}</span>
                <Badge variant="outline" className={cn("text-[10px] shrink-0", STATUS_STYLES[status] ?? "")}>
                  {status}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  onClick={() => toast.info("Receipt download coming soon")}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
