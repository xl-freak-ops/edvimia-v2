import * as React from "react";
import { toast } from "sonner";
import { Plus, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fmtDate, fmtMoney } from "@/lib/finance/format";
import { exportExpensesCsv } from "@/lib/finance/export";
import {
  useExpenses, useUpsertExpense, useDeleteExpense,
  useExpenseCategories, useUpsertExpenseCategory,
  type Expense,
} from "@/lib/finance/hooks";
import { useAuth } from "@/lib/auth/AuthProvider";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-foreground",
  pending_approval: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  approved: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  rejected: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
};

export function ExpensesPanel({ schoolId, currency }: { schoolId: string; currency: string }) {
  const list = useExpenses(schoolId);
  const del = useDeleteExpense(schoolId);
  const [open, setOpen] = React.useState(false);
  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Expenses</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => exportExpensesCsv((list.data ?? []) as Array<Record<string, unknown>>, currency)}>
            <Download className="mr-1 h-3.5 w-3.5" /> CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1 h-3.5 w-3.5" /> Add expense</Button>
            </DialogTrigger>
            <ExpenseForm schoolId={schoolId} onDone={() => setOpen(false)} />
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-left">Vendor</th>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(list.data ?? []).length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No expenses recorded.</td></tr>
              ) : (list.data ?? []).map((e: Record<string, unknown>) => (
                <tr key={e.id as string} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2">{fmtDate(e.expense_date as string)}</td>
                  <td className="px-3 py-2">{(e.expense_categories as { name?: string } | null)?.name ?? "—"}</td>
                  <td className="px-3 py-2">{(e.vendor as string) ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{e.description as string}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{fmtMoney(e.amount as number, currency)}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[e.status as string] ?? "bg-muted"}`}>
                      {String(e.status).replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      size="icon" variant="ghost"
                      onClick={async () => {
                        if (!confirm("Delete this expense?")) return;
                        try { await del.mutateAsync(e.id as string); toast.success("Deleted"); }
                        catch (err) { toast.error((err as Error).message); }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ExpenseForm({ schoolId, onDone }: { schoolId: string; onDone: () => void }) {
  const { userId } = useAuth();
  const cats = useExpenseCategories(schoolId);
  const upsertCat = useUpsertExpenseCategory(schoolId);
  const upsert = useUpsertExpense(schoolId);
  const [categoryId, setCategoryId] = React.useState("");
  const [newCat, setNewCat] = React.useState("");
  const [vendor, setVendor] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState("0");
  const [date, setDate] = React.useState<string>(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = React.useState<Expense["status"]>("pending_approval");

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader><DialogTitle>Add expense</DialogTitle></DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Category</Label>
          <div className="flex gap-2">
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Choose category" /></SelectTrigger>
              <SelectContent>
                {(cats.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="or new…" value={newCat} onChange={(e) => setNewCat(e.target.value)} className="w-40" />
            <Button
              type="button" variant="outline" size="sm"
              disabled={!newCat.trim()}
              onClick={async () => {
                try {
                  const c = await upsertCat.mutateAsync({ school_id: schoolId, name: newCat.trim() });
                  setCategoryId(c.id); setNewCat("");
                } catch (e) { toast.error((e as Error).message); }
              }}
            >Add</Button>
          </div>
        </div>
        <div><Label>Vendor</Label><Input value={vendor} onChange={(e) => setVendor(e.target.value)} /></div>
        <div><Label>Amount</Label><Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div>
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as Expense["status"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_approval">Pending approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      </div>
      <DialogFooter>
        <Button
          disabled={!description.trim() || Number(amount) <= 0 || upsert.isPending}
          onClick={async () => {
            try {
              await upsert.mutateAsync({
                school_id: schoolId,
                category_id: categoryId || null,
                vendor: vendor || null,
                description: description.trim(),
                amount: Number(amount),
                expense_date: date,
                status,
                created_by: userId,
                approved_by: status === "approved" || status === "paid" ? userId : null,
                approved_at: status === "approved" || status === "paid" ? new Date().toISOString() : null,
              });
              toast.success("Expense saved");
              onDone();
            } catch (e) { toast.error((e as Error).message); }
          }}
        >
          {upsert.isPending ? "Saving…" : "Save expense"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}