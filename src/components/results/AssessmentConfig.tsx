import * as React from "react";
import { Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  useComponents, useUpsertComponent, useDeleteComponent, useSeedDefaultAssessments,
  type Component,
} from "@/lib/results/hooks";

export function AssessmentConfig({ schoolId }: { schoolId: string }) {
  const q = useComponents(schoolId);
  const upsert = useUpsertComponent(schoolId);
  const del = useDeleteComponent(schoolId);
  const seed = useSeedDefaultAssessments(schoolId);

  const items = q.data ?? [];
  const totalWeight = items.filter((i) => i.is_enabled).reduce((a, b) => a + Number(b.weight), 0);

  const [draft, setDraft] = React.useState<Record<string, Partial<Component>>>({});
  const patch = (id: string, p: Partial<Component>) =>
    setDraft((d) => ({ ...d, [id]: { ...d[id], ...p } }));

  const hasDraft = Object.keys(draft).length > 0;

  const save = async (row: Component) => {
    const p = draft[row.id] ?? {};
    try {
      await upsert.mutateAsync({ ...row, ...p });
      setDraft((d) => { const n = { ...d }; delete n[row.id]; return n; });
      toast.success(`${(p.name ?? row.name) as string} saved`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const saveAll = async () => {
    const dirtyIds = Object.keys(draft);
    if (!dirtyIds.length) return;
    try {
      await Promise.all(
        dirtyIds.map((id) => {
          const row = items.find((c) => c.id === id);
          if (!row) return Promise.resolve();
          return upsert.mutateAsync({ ...row, ...draft[id] });
        })
      );
      setDraft({});
      toast.success("All changes saved");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const addNew = async () => {
    try {
      await upsert.mutateAsync({
        school_id: schoolId,
        code: `NEW${Date.now().toString(36).slice(-4).toUpperCase()}`,
        name: "New assessment",
        weight: 0, max_score: 10,
        display_order: items.length + 1,
        is_enabled: true, is_exam: false,
      });
      toast.success("Component added");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-col gap-3 pb-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-base">Assessment structure</CardTitle>
          <p className="text-xs text-muted-foreground">
            Total weight:{" "}
            <span className={totalWeight === 100 ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
              {totalWeight}%
            </span>{" "}(should sum to 100%)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasDraft && (
            <Button size="sm" onClick={saveAll} disabled={upsert.isPending}>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Save changes
            </Button>
          )}
          {items.length === 0 && (
            <Button size="sm" variant="outline" onClick={() => seed.mutate()} disabled={seed.isPending}>
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Seed defaults
            </Button>
          )}
          <Button size="sm" variant={hasDraft ? "outline" : "default"} onClick={addNew}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[7rem] w-28">Code</TableHead>
                <TableHead className="min-w-[11rem]">Name</TableHead>
                <TableHead className="w-24">Weight %</TableHead>
                <TableHead className="w-24">Max</TableHead>
                <TableHead className="w-16">Exam</TableHead>
                <TableHead className="w-20">Enabled</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No components yet — seed the Nigerian default (CA1/CA2/Assignment/Project/Exam) to get started.
                  </TableCell>
                </TableRow>
              ) : items.map((c) => {
                const d = draft[c.id] ?? {};
                const merged = { ...c, ...d };
                const isDirty = !!draft[c.id];
                return (
                  <TableRow key={c.id} className={isDirty ? "bg-amber-50/60 dark:bg-amber-950/20" : undefined}>
                    <TableCell className="font-mono text-xs min-w-[7rem]">
                      <Input
                        className="h-8 min-w-0 w-full"
                        value={merged.code as string}
                        onChange={(e) => patch(c.id, { code: e.target.value })}
                      />
                    </TableCell>
                    <TableCell className="min-w-[11rem]">
                      <Input
                        className="h-8 min-w-0 w-full"
                        value={merged.name as string}
                        onChange={(e) => patch(c.id, { name: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 w-20"
                        type="number"
                        value={String(merged.weight)}
                        onChange={(e) => patch(c.id, { weight: Number(e.target.value) })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 w-20"
                        type="number"
                        value={String(merged.max_score)}
                        onChange={(e) => patch(c.id, { max_score: Number(e.target.value) })}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch checked={!!merged.is_exam} onCheckedChange={(v) => patch(c.id, { is_exam: v })} />
                    </TableCell>
                    <TableCell>
                      <Switch checked={!!merged.is_enabled} onCheckedChange={(v) => patch(c.id, { is_enabled: v })} />
                    </TableCell>
                    <TableCell className="flex justify-end gap-1">
                      {isDirty ? (
                        <Button
                          size="sm"
                          onClick={() => save(c)}
                          disabled={upsert.isPending}
                          title="Save this row"
                        >
                          <Save className="mr-1 h-3.5 w-3.5" /> Save
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled
                          className="opacity-30"
                          title="No changes"
                        >
                          <Save className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => del.mutate(c.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
