import * as React from "react";
import { toast } from "sonner";
import { Download, FileText, Plus, Search, Send, Printer, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { fmtDate, fmtMoney } from "@/lib/finance/format";
import { exportInvoicesCsv } from "@/lib/finance/export";
import {
  INVOICE_STATUS_META,
  useInvoices,
  useGenerateInvoicesForClass,
  type Invoice,
  type InvoiceStatus,
} from "@/lib/finance/hooks";
import { useClasses, useTerms, useArms } from "@/lib/school/hooks";
import { RecordPaymentDialog } from "./RecordPaymentDialog";
import { InvoiceView } from "./InvoiceView";

export function InvoicesPanel({
  schoolId, termId, currency,
}: {
  schoolId: string;
  termId: string | null;
  currency: string;
}) {
  const invoices = useInvoices(schoolId, termId);
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<InvoiceStatus | "all">("all");
  const [payInvoice, setPayInvoice] = React.useState<(Invoice & Record<string, unknown>) | null>(null);
  const [viewInvoiceId, setViewInvoiceId] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    return (invoices.data ?? []).filter((i: Record<string, unknown>) => {
      if (status !== "all" && i.status !== status) return false;
      if (!term) return true;
      const s = i.students as { first_name?: string; surname?: string; admission_number?: string } | null;
      const label = `${i.invoice_number} ${s?.first_name ?? ""} ${s?.surname ?? ""} ${s?.admission_number ?? ""}`.toLowerCase();
      return label.includes(term);
    });
  }, [invoices.data, q, status]);

  return (
    <>
      <Card className="shadow-soft">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-3">
          <CardTitle className="text-base">Invoices</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-8 w-56 pl-7" />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as InvoiceStatus | "all")}>
              <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(INVOICE_STATUS_META).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => exportInvoicesCsv(filtered as Array<Record<string, unknown>>, currency)}>
              <Download className="mr-1 h-3.5 w-3.5" /> CSV
            </Button>
            <BulkGenerateButton schoolId={schoolId} termId={termId} />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Invoice</th>
                  <th className="px-3 py-2 text-left">Student</th>
                  <th className="px-3 py-2 text-left">Class</th>
                  <th className="px-3 py-2 text-left">Term</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-right">Balance</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Due</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">
                    {invoices.isLoading ? "Loading…" : "No invoices match your filters."}
                  </td></tr>
                ) : filtered.map((i: Record<string, unknown>) => {
                  const s = i.students as { first_name?: string; surname?: string; admission_number?: string } | null;
                  const meta = INVOICE_STATUS_META[i.status as InvoiceStatus];
                  return (
                    <tr key={i.id as string} className="border-t hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{i.invoice_number as string}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium">{s?.first_name ?? ""} {s?.surname ?? ""}</div>
                        <div className="text-[11px] text-muted-foreground">{s?.admission_number ?? "—"}</div>
                      </td>
                      <td className="px-3 py-2">{(i.classes as { name?: string } | null)?.name ?? "—"}</td>
                      <td className="px-3 py-2">{(i.terms as { name?: string } | null)?.name ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(i.total as number, currency)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold">{fmtMoney(i.balance as number, currency)}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.className}`}>{meta.label}</span>
                      </td>
                      <td className="px-3 py-2">{fmtDate(i.due_date as string | null)}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setViewInvoiceId(i.id as string)}>
                            <FileText className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon" variant="ghost" title="Record payment"
                            disabled={Number(i.balance || 0) <= 0}
                            onClick={() => setPayInvoice(i as Invoice & Record<string, unknown>)}
                          >
                            <Receipt className="h-3.5 w-3.5 text-primary" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <RecordPaymentDialog
        schoolId={schoolId} invoice={payInvoice}
        open={!!payInvoice} onOpenChange={(v) => !v && setPayInvoice(null)}
        currency={currency}
      />

      <Dialog open={!!viewInvoiceId} onOpenChange={(v) => !v && setViewInvoiceId(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-auto p-0">
          {viewInvoiceId && <InvoiceView invoiceId={viewInvoiceId} currency={currency} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function BulkGenerateButton({ schoolId, termId }: { schoolId: string; termId: string | null }) {
  const classes = useClasses(schoolId);
  const terms = useTerms(schoolId);
  const arms = useArms(schoolId);
  const gen = useGenerateInvoicesForClass(schoolId);
  const [open, setOpen] = React.useState(false);
  const [classId, setClassId] = React.useState<string>("");
  const [armId, setArmId] = React.useState<string>("");
  const [selectedTerm, setSelectedTerm] = React.useState<string>(termId ?? "");
  React.useEffect(() => { if (termId) setSelectedTerm(termId); }, [termId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-1 h-3.5 w-3.5" /> Bulk invoice class</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Generate invoices for a class</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Class</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {(classes.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Arm (optional)</Label>
            <Select value={armId} onValueChange={setArmId}>
              <SelectTrigger><SelectValue placeholder="All arms" /></SelectTrigger>
              <SelectContent>
                {(arms.data ?? []).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Term</Label>
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
              <SelectContent>
                {(terms.data ?? []).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!classId || !selectedTerm || gen.isPending}
            onClick={async () => {
              try {
                const count = await gen.mutateAsync({ class_id: classId, term_id: selectedTerm, arm_id: armId || null });
                toast.success(`Generated ${count} invoice${count === 1 ? "" : "s"}`);
                setOpen(false);
              } catch (e) { toast.error((e as Error).message); }
            }}
          >
            {gen.isPending ? "Generating…" : <><Send className="mr-1 h-3.5 w-3.5" /> Generate</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}