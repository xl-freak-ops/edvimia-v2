import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtDate, fmtMoney } from "@/lib/finance/format";
import { INVOICE_STATUS_META, useInvoice, useInvoiceItems, type InvoiceStatus } from "@/lib/finance/hooks";

export function InvoiceView({ invoiceId, currency }: { invoiceId: string; currency: string }) {
  const inv = useInvoice(invoiceId);
  const items = useInvoiceItems(invoiceId);
  const data = inv.data as Record<string, unknown> | null | undefined;
  if (!data) return <div className="p-8 text-center text-muted-foreground">Loading invoice…</div>;

  const s = data.students as { first_name?: string; surname?: string; admission_number?: string } | null;
  const sch = data.schools as { name?: string; address?: string; phone?: string; email?: string; logo_url?: string; currency?: string } | null;
  const cur = sch?.currency || currency;
  const meta = INVOICE_STATUS_META[data.status as InvoiceStatus];

  return (
    <div className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex items-center justify-between border-b p-6 print:hidden">
        <h2 className="text-lg font-semibold">Invoice</h2>
        <Button size="sm" variant="outline" onClick={() => window.print()}>
          <Printer className="mr-1 h-3.5 w-3.5" /> Print / PDF
        </Button>
      </div>
      <div className="p-8 print:p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            {sch?.logo_url && <img src={sch.logo_url} alt="" className="mb-2 h-12 w-12 rounded-lg object-cover" />}
            <div className="text-xl font-bold tracking-tight">{sch?.name ?? "School"}</div>
            {sch?.address && <div className="text-xs text-muted-foreground">{sch.address}</div>}
            <div className="text-xs text-muted-foreground">
              {sch?.phone ?? ""}{sch?.email ? ` · ${sch.email}` : ""}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Invoice</div>
            <div className="text-lg font-semibold">{data.invoice_number as string}</div>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.className}`}>{meta.label}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Billed to</div>
            <div className="text-sm font-medium">{s?.first_name} {s?.surname}</div>
            <div className="text-xs text-muted-foreground">Adm: {s?.admission_number ?? "—"}</div>
            <div className="text-xs text-muted-foreground">
              {(data.classes as { name?: string } | null)?.name ?? ""}
              {(data.class_arms as { name?: string } | null)?.name ? ` ${(data.class_arms as { name?: string }).name}` : ""}
            </div>
          </div>
          <div className="sm:text-right">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Issued </span>
              <span className="text-sm">{fmtDate(data.issue_date as string)}</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Due </span>
              <span className="text-sm">{fmtDate(data.due_date as string | null)}</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Term </span>
              <span className="text-sm">{(data.terms as { name?: string } | null)?.name ?? "—"}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-right">Discount</th>
                <th className="px-3 py-2 text-right">Penalty</th>
              </tr>
            </thead>
            <tbody>
              {(items.data ?? []).length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No line items.</td></tr>
              ) : (items.data ?? []).map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="px-3 py-2">{it.description}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(it.amount as number, cur)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{fmtMoney(it.discount as number, cur)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{fmtMoney(it.penalty as number, cur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <div className="w-full max-w-xs space-y-1.5 text-sm">
            <Row label="Subtotal" v={fmtMoney(data.subtotal as number, cur)} />
            <Row label="Discount" v={`- ${fmtMoney(data.discount_total as number, cur)}`} />
            <Row label="Penalty" v={fmtMoney(data.penalty_total as number, cur)} />
            <Row label="Total" bold v={fmtMoney(data.total as number, cur)} />
            <Row label="Paid" v={fmtMoney(data.amount_paid as number, cur)} />
            <div className="mt-2 flex justify-between border-t pt-2 text-base font-bold">
              <span>Balance</span><span>{fmtMoney(data.balance as number, cur)}</span>
            </div>
          </div>
        </div>

        {data.notes ? (
          <div className="mt-6 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            {data.notes as string}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, v, bold }: { label: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{v}</span>
    </div>
  );
}