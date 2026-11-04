import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type FeeCategory = Tables<"fee_categories">;
export type FeeStructure = Tables<"fee_structures">;
export type Invoice = Tables<"invoices">;
export type InvoiceItem = Tables<"invoice_items">;
export type Payment = Tables<"payments">;
export type Receipt = Tables<"receipts">;
export type Expense = Tables<"expenses">;
export type ExpenseCategory = Tables<"expense_categories">;
export type InvoiceStatus = Invoice["status"];
export type PaymentMethod = Payment["method"];

export const financeKeys = {
  feeCategories: (sid: string) => ["finance", "fee-cats", sid] as const,
  feeStructures: (sid: string) => ["finance", "fee-structures", sid] as const,
  invoices: (sid: string, termId?: string | null) =>
    ["finance", "invoices", sid, termId ?? "-"] as const,
  invoice: (id: string) => ["finance", "invoice", id] as const,
  invoiceItems: (id: string) => ["finance", "invoice-items", id] as const,
  payments: (sid: string) => ["finance", "payments", sid] as const,
  studentInvoices: (sid: string, studentId: string) =>
    ["finance", "student-invoices", sid, studentId] as const,
  studentPayments: (sid: string, studentId: string) =>
    ["finance", "student-payments", sid, studentId] as const,
  receipts: (sid: string) => ["finance", "receipts", sid] as const,
  expenses: (sid: string) => ["finance", "expenses", sid] as const,
  expenseCategories: (sid: string) => ["finance", "expense-cats", sid] as const,
  audit: (sid: string) => ["finance", "audit", sid] as const,
};

/* -------- Fee categories -------- */
export function useFeeCategories(sid: string | null | undefined) {
  return useQuery({
    enabled: !!sid,
    queryKey: financeKeys.feeCategories(sid ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_categories").select("*").eq("school_id", sid!)
        .order("display_order", { ascending: true }).order("name");
      if (error) throw error;
      return (data ?? []) as FeeCategory[];
    },
  });
}

export function useUpsertFeeCategory(sid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: TablesInsert<"fee_categories">) => {
      const { data, error } = await supabase.from("fee_categories")
        .upsert(row, { onConflict: "school_id,name" }).select().single();
      if (error) throw error;
      return data as FeeCategory;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.feeCategories(sid) }),
  });
}

export function useDeleteFeeCategory(sid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fee_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.feeCategories(sid) }),
  });
}

/* -------- Fee structures -------- */
export function useFeeStructures(sid: string | null | undefined) {
  return useQuery({
    enabled: !!sid,
    queryKey: financeKeys.feeStructures(sid ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_structures")
        .select("*, fee_categories(name), classes(name), terms(name), class_arms(name)")
        .eq("school_id", sid!).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertFeeStructure(sid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: TablesInsert<"fee_structures"> & { id?: string }) => {
      const { data, error } = await supabase.from("fee_structures")
        .upsert(row).select().single();
      if (error) throw error;
      return data as FeeStructure;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.feeStructures(sid) }),
  });
}

export function useDeleteFeeStructure(sid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fee_structures").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.feeStructures(sid) }),
  });
}

/* -------- Invoices -------- */
export function useInvoices(sid: string | null | undefined, termId?: string | null) {
  return useQuery({
    enabled: !!sid,
    queryKey: financeKeys.invoices(sid ?? "", termId ?? null),
    queryFn: async () => {
      let q = supabase.from("invoices")
        .select("*, students(id, first_name, surname, admission_number, student_code), classes(name), class_arms(name), terms(name)")
        .eq("school_id", sid!)
        .order("created_at", { ascending: false })
        .limit(500);
      if (termId) q = q.eq("term_id", termId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useInvoice(id: string | null | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: financeKeys.invoice(id ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices")
        .select("*, students(id, first_name, surname, admission_number, student_code), classes(name), class_arms(name), terms(name), schools(name, logo_url, address, country, currency, phone, email)")
        .eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useInvoiceItems(invoiceId: string | null | undefined) {
  return useQuery({
    enabled: !!invoiceId,
    queryKey: financeKeys.invoiceItems(invoiceId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase.from("invoice_items")
        .select("*").eq("invoice_id", invoiceId!).order("created_at");
      if (error) throw error;
      return (data ?? []) as InvoiceItem[];
    },
  });
}

export function useCreateInvoice(sid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {
      invoice: TablesInsert<"invoices">;
      items: Array<Omit<TablesInsert<"invoice_items">, "invoice_id" | "school_id">>;
    }) => {
      const { data: inv, error } = await supabase.from("invoices")
        .insert(v.invoice).select().single();
      if (error) throw error;
      if (v.items.length) {
        const rows = v.items.map((it) => ({ ...it, invoice_id: inv.id, school_id: sid }));
        const { error: iErr } = await supabase.from("invoice_items").insert(rows);
        if (iErr) throw iErr;
      }
      return inv as Invoice;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance", "invoices", sid] });
    },
  });
}

export function useUpdateInvoice(sid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: TablesUpdate<"invoices"> }) => {
      const { data, error } = await supabase.from("invoices").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data as Invoice;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["finance", "invoices", sid] });
      qc.invalidateQueries({ queryKey: financeKeys.invoice(vars.id) });
    },
  });
}

export function useGenerateInvoicesForClass(sid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { term_id: string; class_id: string; arm_id?: string | null }) => {
      const { data, error } = await supabase.rpc("generate_invoices_for_class", {
        _school_id: sid,
        _term_id: v.term_id,
        _class_id: v.class_id,
        _arm_id: v.arm_id ?? undefined,
      });
      if (error) throw error;
      return (data as number) ?? 0;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance", "invoices", sid] }),
  });
}

/* -------- Student-scoped -------- */
export function useStudentInvoices(sid: string | null | undefined, studentId: string | null | undefined) {
  return useQuery({
    enabled: !!sid && !!studentId,
    queryKey: financeKeys.studentInvoices(sid ?? "", studentId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices")
        .select("*, terms(name)").eq("school_id", sid!).eq("student_id", studentId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useStudentPayments(sid: string | null | undefined, studentId: string | null | undefined) {
  return useQuery({
    enabled: !!sid && !!studentId,
    queryKey: financeKeys.studentPayments(sid ?? "", studentId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase.from("payments")
        .select("*, invoices(invoice_number)").eq("school_id", sid!).eq("student_id", studentId!)
        .order("paid_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* -------- Payments -------- */
export function useRecentPayments(sid: string | null | undefined, limit = 100) {
  return useQuery({
    enabled: !!sid,
    queryKey: [...financeKeys.payments(sid ?? ""), limit],
    queryFn: async () => {
      const { data, error } = await supabase.from("payments")
        .select("*, students(first_name, surname, admission_number), invoices(invoice_number)")
        .eq("school_id", sid!).order("paid_at", { ascending: false }).limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRecordPayment(sid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: TablesInsert<"payments">) => {
      const { data, error } = await supabase.from("payments").insert(row).select().single();
      if (error) throw error;
      return data as Payment;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["finance"] });
      qc.invalidateQueries({ queryKey: financeKeys.invoice(data.invoice_id ?? "") });
    },
  });
}

/* -------- Receipts -------- */
export function useReceiptForPayment(paymentId: string | null | undefined) {
  return useQuery({
    enabled: !!paymentId,
    queryKey: ["finance", "receipt", paymentId],
    queryFn: async () => {
      const { data, error } = await supabase.from("receipts")
        .select("*").eq("payment_id", paymentId!).maybeSingle();
      if (error) throw error;
      return data as Receipt | null;
    },
  });
}

/* -------- Expenses -------- */
export function useExpenseCategories(sid: string | null | undefined) {
  return useQuery({
    enabled: !!sid,
    queryKey: financeKeys.expenseCategories(sid ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase.from("expense_categories")
        .select("*").eq("school_id", sid!).order("name");
      if (error) throw error;
      return (data ?? []) as ExpenseCategory[];
    },
  });
}

export function useUpsertExpenseCategory(sid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: TablesInsert<"expense_categories">) => {
      const { data, error } = await supabase.from("expense_categories")
        .upsert(row, { onConflict: "school_id,name" }).select().single();
      if (error) throw error;
      return data as ExpenseCategory;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.expenseCategories(sid) }),
  });
}

export function useExpenses(sid: string | null | undefined) {
  return useQuery({
    enabled: !!sid,
    queryKey: financeKeys.expenses(sid ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase.from("expenses")
        .select("*, expense_categories(name)")
        .eq("school_id", sid!).order("expense_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertExpense(sid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: TablesInsert<"expenses"> & { id?: string }) => {
      const { data, error } = await supabase.from("expenses")
        .upsert(row).select().single();
      if (error) throw error;
      return data as Expense;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.expenses(sid) }),
  });
}

export function useDeleteExpense(sid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.expenses(sid) }),
  });
}

/* -------- Meta -------- */
export const PAYMENT_METHOD_META: Record<PaymentMethod, { label: string; className: string }> = {
  cash: { label: "Cash", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  bank_transfer: { label: "Bank Transfer", className: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  pos: { label: "POS", className: "bg-violet-500/15 text-violet-700 dark:text-violet-300" },
  card: { label: "Card", className: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300" },
  online: { label: "Online", className: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  cheque: { label: "Cheque", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  scholarship: { label: "Scholarship", className: "bg-teal-500/15 text-teal-700 dark:text-teal-300" },
  waiver: { label: "Waiver", className: "bg-slate-500/15 text-slate-700 dark:text-slate-300" },
  discount: { label: "Discount", className: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300" },
};

export const INVOICE_STATUS_META: Record<InvoiceStatus, { label: string; className: string }> = {
  draft:     { label: "Draft",     className: "bg-muted text-foreground" },
  issued:    { label: "Issued",    className: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  partial:   { label: "Partial",   className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  paid:      { label: "Paid",      className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  overdue:   { label: "Overdue",   className: "bg-rose-500/15 text-rose-700 dark:text-rose-300" },
  cancelled: { label: "Cancelled", className: "bg-slate-500/15 text-slate-700 dark:text-slate-300" },
};