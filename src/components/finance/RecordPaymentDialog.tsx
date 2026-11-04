import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PAYMENT_METHOD_META, useRecordPayment, type Invoice, type PaymentMethod } from "@/lib/finance/hooks";
import { useAuth } from "@/lib/auth/AuthProvider";
import { fmtMoney } from "@/lib/finance/format";

export function RecordPaymentDialog({
  schoolId, invoice, open, onOpenChange, currency,
}: {
  schoolId: string;
  invoice: (Invoice & Record<string, unknown>) | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currency: string;
}) {
  const { userId } = useAuth();
  const record = useRecordPayment(schoolId);
  const [method, setMethod] = React.useState<PaymentMethod>("cash");
  const [amount, setAmount] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (open && invoice) {
      setAmount(String(Number(invoice.balance || 0)));
      setReference("");
      setNotes("");
      setMethod("cash");
    }
  }, [open, invoice]);

  if (!invoice) return null;
  const balance = Number(invoice.balance || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <div className="font-medium">{invoice.invoice_number}</div>
            <div className="text-xs text-muted-foreground">
              Balance owing: <span className="font-medium text-foreground">{fmtMoney(balance, currency)}</span>
            </div>
          </div>
          <div>
            <Label>Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PAYMENT_METHOD_META) as PaymentMethod[]).map((m) => (
                  <SelectItem key={m} value={m}>{PAYMENT_METHOD_META[m].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Amount</Label>
            <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <p className="mt-1 text-[11px] text-muted-foreground">Enter a partial amount for installments.</p>
          </div>
          <div>
            <Label>Reference</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Bank txn ref / cheque no." />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!amount || Number(amount) <= 0 || record.isPending}
            onClick={async () => {
              try {
                await record.mutateAsync({
                  school_id: schoolId,
                  payment_code: "",
                  invoice_id: invoice.id,
                  student_id: invoice.student_id,
                  method,
                  amount: Number(amount),
                  reference: reference || null,
                  notes: notes || null,
                  cashier_id: userId,
                });
                toast.success("Payment recorded — receipt generated");
                onOpenChange(false);
              } catch (e) { toast.error((e as Error).message); }
            }}
          >
            {record.isPending ? "Recording…" : `Record ${fmtMoney(Number(amount) || 0, currency)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}