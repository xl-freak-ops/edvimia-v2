import * as React from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { fmtMoney } from "@/lib/finance/format";
import { useFeeStructures, useUpsertFeeStructure, useDeleteFeeStructure, useFeeCategories } from "@/lib/finance/hooks";
import { useClasses, useTerms, useSessions, useArms } from "@/lib/school/hooks";

export function FeeStructuresPanel({ schoolId, currency }: { schoolId: string; currency: string }) {
  const list = useFeeStructures(schoolId);
  const del = useDeleteFeeStructure(schoolId);
  const [open, setOpen] = React.useState(false);
  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Fee structure</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-3.5 w-3.5" /> Add fee</Button>
          </DialogTrigger>
          <StructureForm schoolId={schoolId} onDone={() => setOpen(false)} />
        </Dialog>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Fee</th>
                <th className="px-3 py-2 text-left">Class</th>
                <th className="px-3 py-2 text-left">Term</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-right">Discount</th>
                <th className="px-3 py-2 text-right">Penalty</th>
                <th className="px-3 py-2 text-left">Due</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(list.data ?? []).length === 0 ? (
                <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No fees configured.</td></tr>
              ) : (list.data ?? []).map((r: Record<string, unknown>) => (
                <tr key={r.id as string} className="border-t">
                  <td className="px-3 py-2 font-medium">
                    {(r.fee_categories as { name?: string } | null)?.name ?? "—"}
                    {!r.mandatory && <span className="ml-2 rounded bg-muted px-1.5 text-[10px] uppercase">Optional</span>}
                  </td>
                  <td className="px-3 py-2">{(r.classes as { name?: string } | null)?.name ?? "All"}</td>
                  <td className="px-3 py-2">{(r.terms as { name?: string } | null)?.name ?? "All"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(r.amount as number, currency)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{fmtMoney(r.discount_amount as number, currency)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{fmtMoney(r.penalty_amount as number, currency)}</td>
                  <td className="px-3 py-2">{(r.due_date as string) ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      size="icon" variant="ghost"
                      onClick={async () => {
                        if (!confirm("Delete this fee?")) return;
                        try { await del.mutateAsync(r.id as string); toast.success("Removed"); }
                        catch (e) { toast.error((e as Error).message); }
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

function StructureForm({ schoolId, onDone }: { schoolId: string; onDone: () => void }) {
  const cats = useFeeCategories(schoolId);
  const classes = useClasses(schoolId);
  const terms = useTerms(schoolId);
  const sessions = useSessions(schoolId);
  const arms = useArms(schoolId);
  const upsert = useUpsertFeeStructure(schoolId);

  const [categoryId, setCategoryId] = React.useState("");
  const [classId, setClassId] = React.useState<string>("");
  const [termId, setTermId] = React.useState<string>("");
  const [armId, setArmId] = React.useState<string>("");
  const [amount, setAmount] = React.useState<string>("0");
  const [discount, setDiscount] = React.useState<string>("0");
  const [penalty, setPenalty] = React.useState<string>("0");
  const [mandatory, setMandatory] = React.useState(true);
  const [dueDate, setDueDate] = React.useState<string>("");

  return (
    <DialogContent className="sm:max-w-xl">
      <DialogHeader><DialogTitle>Add fee</DialogTitle></DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {(cats.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Amount</Label>
          <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <Label>Class (optional)</Label>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
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
          <Label>Term (optional)</Label>
          <Select value={termId} onValueChange={setTermId}>
            <SelectTrigger><SelectValue placeholder="All terms" /></SelectTrigger>
            <SelectContent>
              {(terms.data ?? []).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Due date</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div><Label>Discount</Label><Input inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} /></div>
        <div><Label>Late penalty</Label><Input inputMode="decimal" value={penalty} onChange={(e) => setPenalty(e.target.value)} /></div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <Switch id="mandatory" checked={mandatory} onCheckedChange={setMandatory} />
          <Label htmlFor="mandatory">Compulsory for all students</Label>
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={!categoryId || Number(amount) < 0 || upsert.isPending}
          onClick={async () => {
            try {
              const session = (sessions.data ?? []).find((s) => s.is_current) ?? (sessions.data ?? [])[0];
              await upsert.mutateAsync({
                school_id: schoolId,
                category_id: categoryId,
                class_id: classId || null,
                arm_id: armId || null,
                term_id: termId || null,
                session_id: session?.id ?? null,
                amount: Number(amount) || 0,
                discount_amount: Number(discount) || 0,
                penalty_amount: Number(penalty) || 0,
                mandatory,
                due_date: dueDate || null,
                is_active: true,
              });
              toast.success("Fee saved");
              onDone();
            } catch (e) { toast.error((e as Error).message); }
          }}
        >
          {upsert.isPending ? "Saving…" : "Save fee"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}