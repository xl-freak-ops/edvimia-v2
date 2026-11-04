import { Download, Receipt as ReceiptIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtDateTime, fmtMoney } from "@/lib/finance/format";
import { exportPaymentsCsv } from "@/lib/finance/export";
import { PAYMENT_METHOD_META, type Payment, type PaymentMethod } from "@/lib/finance/hooks";

export function PaymentsList({
  payments, currency, onOpenReceipt,
}: {
  payments: (Payment & Record<string, unknown>)[];
  currency: string;
  onOpenReceipt: (paymentId: string) => void;
}) {
  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Recent payments</CardTitle>
        <Button size="sm" variant="outline" onClick={() => exportPaymentsCsv(payments as Array<Record<string, unknown>>, currency)}>
          <Download className="mr-1 h-3.5 w-3.5" /> CSV
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Code</th>
                <th className="px-3 py-2 text-left">Student</th>
                <th className="px-3 py-2 text-left">Invoice</th>
                <th className="px-3 py-2 text-left">Method</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No payments yet.</td></tr>
              ) : payments.map((p) => {
                const s = p.students as { first_name?: string; surname?: string; admission_number?: string } | null;
                const meta = PAYMENT_METHOD_META[p.method as PaymentMethod];
                return (
                  <tr key={p.id} className="border-t hover:bg-muted/30">
                    <td className="px-3 py-2 font-mono text-xs">{p.payment_code}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{s?.first_name} {s?.surname}</div>
                      <div className="text-[11px] text-muted-foreground">{s?.admission_number ?? "—"}</div>
                    </td>
                    <td className="px-3 py-2 text-xs">{(p.invoices as { invoice_number?: string } | null)?.invoice_number ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.className}`}>{meta.label}</span>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">{fmtMoney(p.amount as number, currency)}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{fmtDateTime(p.paid_at)}</td>
                    <td className="px-3 py-2 text-right">
                      <Button size="icon" variant="ghost" onClick={() => onOpenReceipt(p.id)}>
                        <ReceiptIcon className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}