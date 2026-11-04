import { Printer, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fmtDateTime, fmtMoney } from "@/lib/finance/format";
import { useReceiptForPayment } from "@/lib/finance/hooks";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function ReceiptDialog({
  paymentId, open, onOpenChange, currency,
}: {
  paymentId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currency: string;
}) {
  const receipt = useReceiptForPayment(paymentId);
  const paymentQ = useQuery({
    enabled: !!paymentId,
    queryKey: ["finance", "payment-detail", paymentId],
    queryFn: async () => {
      const { data, error } = await supabase.from("payments")
        .select("*, students(first_name, surname, admission_number, student_code, classes(name)), invoices(invoice_number, total, balance), schools(name, address, phone, email, logo_url, currency)")
        .eq("id", paymentId!).maybeSingle();
      if (error) throw error;
      return data as Record<string, unknown> | null;
    },
  });

  const p = paymentQ.data;
  const r = receipt.data;
  const sch = p?.schools as { name?: string; address?: string; phone?: string; email?: string; currency?: string } | null;
  const cur = sch?.currency || currency;
  const s = p?.students as { first_name?: string; surname?: string; admission_number?: string; classes?: { name?: string } } | null;
  const inv = p?.invoices as { invoice_number?: string; balance?: number } | null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-auto p-0">
        <div className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
          <div className="flex items-center justify-between border-b p-4 print:hidden">
            <div className="text-sm font-semibold">Receipt</div>
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="mr-1 h-3.5 w-3.5" /> Print
            </Button>
          </div>
          {!p || !r ? (
            <div className="p-8 text-center text-muted-foreground">Loading receipt…</div>
          ) : (
            <div className="p-6">
              <div className="text-center">
                <div className="text-lg font-bold tracking-tight">{sch?.name ?? "School"}</div>
                {sch?.address && <div className="text-[11px] text-muted-foreground">{sch.address}</div>}
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> Payment received
                </div>
              </div>

              <div className="mt-4 space-y-1 rounded-lg border bg-muted/30 p-3 text-sm">
                <Row k="Receipt No." v={r.receipt_number} mono />
                <Row k="Payment code" v={p.payment_code as string} mono />
                <Row k="Date" v={fmtDateTime(r.issued_at)} />
                <Row k="Student" v={`${s?.first_name ?? ""} ${s?.surname ?? ""}`} />
                <Row k="Admission No." v={s?.admission_number ?? "—"} />
                <Row k="Class" v={s?.classes?.name ?? "—"} />
                {inv?.invoice_number && <Row k="Invoice" v={inv.invoice_number} />}
                <Row k="Method" v={String(p.method).replace("_", " ").toUpperCase()} />
                {(p.reference as string) && <Row k="Reference" v={p.reference as string} />}
              </div>

              <div className="mt-4 rounded-lg border p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount paid</span>
                  <span className="text-xl font-bold tabular-nums">{fmtMoney(p.amount as number, cur)}</span>
                </div>
                <div className="mt-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">Outstanding balance</span>
                  <span className="tabular-nums">{fmtMoney(r.balance_after, cur)}</span>
                </div>
              </div>

              <div className="mt-4 text-center text-[10px] text-muted-foreground">
                Verify: <span className="font-mono">{r.verification_token}</span>
              </div>
              <div className="mt-1 text-center text-[10px] text-muted-foreground">
                Thank you for your payment.
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{k}</span>
      <span className={mono ? "font-mono" : ""}>{v}</span>
    </div>
  );
}