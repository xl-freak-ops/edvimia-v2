import * as React from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useFeeCategories, useUpsertFeeCategory, useDeleteFeeCategory, type FeeCategory } from "@/lib/finance/hooks";

export function FeeCategoriesPanel({ schoolId }: { schoolId: string }) {
  const cats = useFeeCategories(schoolId);
  const upsert = useUpsertFeeCategory(schoolId);
  const del = useDeleteFeeCategory(schoolId);
  const [editing, setEditing] = React.useState<FeeCategory | null>(null);
  const [open, setOpen] = React.useState(false);

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="text-base">Fee categories</CardTitle>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditing(null)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> New category
            </Button>
          </DialogTrigger>
          <CategoryForm
            key={editing?.id ?? "new"}
            schoolId={schoolId}
            initial={editing}
            onDone={() => { setOpen(false); setEditing(null); }}
            saving={upsert.isPending}
            onSubmit={async (row) => {
              try { await upsert.mutateAsync(row); toast.success("Category saved"); setOpen(false); setEditing(null); }
              catch (e) { toast.error((e as Error).message); }
            }}
          />
        </Dialog>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="divide-y rounded-lg border">
          {(cats.data ?? []).length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No fee categories yet. Add Tuition, PTA Levy, Exam Fee, etc.
            </div>
          ) : (
            (cats.data ?? []).map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {c.name}
                    {!c.is_active && <span className="rounded bg-muted px-1.5 text-[10px] uppercase">Inactive</span>}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {c.code ?? "—"}{c.description ? ` · ${c.description}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon" variant="ghost"
                    onClick={async () => {
                      if (!confirm(`Delete "${c.name}"?`)) return;
                      try { await del.mutateAsync(c.id); toast.success("Deleted"); }
                      catch (e) { toast.error((e as Error).message); }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryForm({
  schoolId, initial, onSubmit, saving,
}: {
  schoolId: string;
  initial: FeeCategory | null;
  onDone: () => void;
  saving: boolean;
  onSubmit: (row: {
    id?: string; school_id: string; name: string; code: string | null;
    description: string | null; is_active: boolean; display_order: number;
  }) => void;
}) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [code, setCode] = React.useState(initial?.code ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [active, setActive] = React.useState(initial?.is_active ?? true);

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{initial ? "Edit fee category" : "New fee category"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tuition Fee" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Code</Label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="TUI" /></div>
          <div className="flex items-end gap-2">
            <Switch checked={active} onCheckedChange={setActive} id="cat-active" />
            <Label htmlFor="cat-active">Active</Label>
          </div>
        </div>
        <div><Label>Description</Label><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      </div>
      <DialogFooter>
        <Button
          disabled={!name.trim() || saving}
          onClick={() => onSubmit({
            id: initial?.id, school_id: schoolId, name: name.trim(),
            code: code.trim() || null, description: description.trim() || null,
            is_active: active, display_order: initial?.display_order ?? 0,
          })}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}