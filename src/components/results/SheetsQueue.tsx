import * as React from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useSheets, useTransitionSheet, STATUS_META, NEXT_ACTIONS, type ResultSheet, type WorkflowStatus } from "@/lib/results/hooks";
import { cn } from "@/lib/utils";

type Row = ResultSheet & {
  classes: { name: string } | null;
  class_arms: { name: string } | null;
  subjects: { name: string; code: string | null } | null;
};

export function SheetsQueue({ termId }: { termId: string | null }) {
  const { school, userId } = useAuth();
  const schoolId = school?.id ?? null;
  const sheets = useSheets(schoolId, termId);
  const transition = useTransitionSheet();
  const [filter, setFilter] = React.useState<WorkflowStatus | "all">("all");
  const [search, setSearch] = React.useState("");

  const rows = ((sheets.data ?? []) as Row[]).filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return `${s.classes?.name ?? ""} ${s.class_arms?.name ?? ""} ${s.subjects?.name ?? ""}`.toLowerCase().includes(q);
  });

  const act = async (sheet: ResultSheet, to: WorkflowStatus) => {
    if (!userId) return;
    let note: string | undefined;
    if (to === "rejected") {
      note = window.prompt("Reason for rejection?") ?? undefined;
      if (!note) return;
    }
    try {
      await transition.mutateAsync({ sheet, to, userId, note });
      toast.success(`Marked as ${STATUS_META[to].label}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-col gap-3 pb-3 md:flex-row md:items-center md:justify-between">
        <CardTitle className="text-base">Approval queue</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-48" />
          <Select value={filter} onValueChange={(v) => setFilter(v as WorkflowStatus | "all")}>
            <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(STATUS_META).map(([k, m]) => (
                <SelectItem key={k} value={k}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {sheets.isLoading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No result sheets for this term yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class · Arm</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s) => {
                  const meta = STATUS_META[s.status];
                  const actions = NEXT_ACTIONS[s.status] ?? [];
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm font-medium">
                        {s.classes?.name ?? "—"}{s.class_arms?.name ? ` · ${s.class_arms.name}` : ""}
                      </TableCell>
                      <TableCell className="text-sm">{s.subjects?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge className={cn("border-transparent", meta.className)}>{meta.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.updated_at ? new Date(s.updated_at).toLocaleString() : "—"}
                      </TableCell>
                      <TableCell className="flex justify-end gap-1">
                        {actions.map((a) => (
                          <Button key={a.to} size="sm"
                            variant={a.to === "rejected" ? "outline" : a.to === "published" ? "default" : "outline"}
                            className={a.to === "rejected" ? "text-destructive" : ""}
                            onClick={() => act(s, a.to)}
                            disabled={transition.isPending}>
                            {a.label}
                          </Button>
                        ))}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}