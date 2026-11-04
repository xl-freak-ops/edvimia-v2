import { fmtDate, fmtMoney } from "./format";

function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [keys.join(","), ...rows.map((r) => keys.map((k) => escape(r[k])).join(","))].join("\n");
}

export function download(filename: string, content: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportInvoicesCsv(invoices: Array<Record<string, unknown>>, currency: string) {
  const rows = invoices.map((i) => ({
    invoice_number: i.invoice_number as string,
    student: `${(i.students as { first_name?: string })?.first_name ?? ""} ${(i.students as { surname?: string })?.surname ?? ""}`.trim(),
    admission_number: (i.students as { admission_number?: string })?.admission_number ?? "",
    class: (i.classes as { name?: string })?.name ?? "",
    term: (i.terms as { name?: string })?.name ?? "",
    status: i.status,
    issue_date: fmtDate(i.issue_date as string),
    due_date: fmtDate(i.due_date as string | null),
    total: fmtMoney(i.total as number, currency),
    paid: fmtMoney(i.amount_paid as number, currency),
    balance: fmtMoney(i.balance as number, currency),
  }));
  download(`invoices-${Date.now()}.csv`, toCsv(rows));
}

export function exportPaymentsCsv(payments: Array<Record<string, unknown>>, currency: string) {
  const rows = payments.map((p) => ({
    code: p.payment_code as string,
    invoice: (p.invoices as { invoice_number?: string })?.invoice_number ?? "",
    student: `${(p.students as { first_name?: string })?.first_name ?? ""} ${(p.students as { surname?: string })?.surname ?? ""}`.trim(),
    method: p.method,
    amount: fmtMoney(p.amount as number, currency),
    reference: (p.reference as string) ?? "",
    paid_at: fmtDate(p.paid_at as string),
  }));
  download(`payments-${Date.now()}.csv`, toCsv(rows));
}

export function exportExpensesCsv(expenses: Array<Record<string, unknown>>, currency: string) {
  const rows = expenses.map((e) => ({
    date: fmtDate(e.expense_date as string),
    category: (e.expense_categories as { name?: string })?.name ?? "",
    vendor: (e.vendor as string) ?? "",
    description: e.description as string,
    amount: fmtMoney(e.amount as number, currency),
    status: e.status as string,
  }));
  download(`expenses-${Date.now()}.csv`, toCsv(rows));
}