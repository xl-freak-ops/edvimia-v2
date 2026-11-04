import { Award, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { EmptyState } from "./EmptyState";
import { schoolKeys, useCreateRow, useDeleteRow, useGradeScales, useUpdateRow } from "@/lib/school/hooks";

const WAEC_DEFAULT = [
  { grade: "A1", min_score: 75, max_score: 100, remark: "Excellent", display_order: 1 },
  { grade: "B2", min_score: 70, max_score: 74.99, remark: "Very Good", display_order: 2 },
  { grade: "B3", min_score: 65, max_score: 69.99, remark: "Good", display_order: 3 },
  { grade: "C4", min_score: 60, max_score: 64.99, remark: "Credit", display_order: 4 },
  { grade: "C5", min_score: 55, max_score: 59.99, remark: "Credit", display_order: 5 },
  { grade: "C6", min_score: 50, max_score: 54.99, remark: "Credit", display_order: 6 },
  { grade: "D7", min_score: 45, max_score: 49.99, remark: "Pass", display_order: 7 },
  { grade: "E8", min_score: 40, max_score: 44.99, remark: "Pass", display_order: 8 },
  { grade: "F9", min_score: 0, max_score: 39.99, remark: "Fail", display_order: 9 },
];

export function GradingPanel({ schoolId }: { schoolId: string }) {
  const grades = useGradeScales(schoolId);
  const create = useCreateRow("grade_scales", schoolKeys.grades(schoolId));
  const update = useUpdateRow("grade_scales", schoolKeys.grades(schoolId));
  const del = useDeleteRow("grade_scales", schoolKeys.grades(schoolId));

  const [busy, setBusy] = useState(false);

  const seed = async () => {
    setBusy(true);
    try {
      for (const g of WAEC_DEFAULT) {
        await create.mutateAsync({ school_id: schoolId, ...g });
      }
      toast.success("WAEC grade scale loaded");
    } finally { setBusy(false); }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base"><Award className="h-4 w-4 text-primary" /> Grading system</CardTitle>
          <CardDescription>Define grade boundaries used across results and report cards.</CardDescription>
        </div>
        <div className="flex gap-2">
          {!grades.data?.length && <Button size="sm" variant="outline" onClick={seed} disabled={busy}>Use WAEC default</Button>}
          <Button size="sm" className="gap-1.5" onClick={() => create.mutate({ school_id: schoolId, grade: "NEW", min_score: 0, max_score: 0, remark: "", display_order: (grades.data?.length ?? 0) + 1 })}>
            <Plus className="h-3.5 w-3.5" /> Add row
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {grades.data?.length ? (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade</TableHead>
                  <TableHead>Min score</TableHead>
                  <TableHead>Max score</TableHead>
                  <TableHead>Remark</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.data.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell><Input defaultValue={g.grade} onBlur={(e) => e.target.value !== g.grade && update.mutate({ id: g.id, patch: { grade: e.target.value } })} className="h-8 w-20 font-mono uppercase" /></TableCell>
                    <TableCell><Input type="number" step="0.01" defaultValue={g.min_score} onBlur={(e) => update.mutate({ id: g.id, patch: { min_score: Number(e.target.value) } })} className="h-8 w-24" /></TableCell>
                    <TableCell><Input type="number" step="0.01" defaultValue={g.max_score} onBlur={(e) => update.mutate({ id: g.id, patch: { max_score: Number(e.target.value) } })} className="h-8 w-24" /></TableCell>
                    <TableCell><Input defaultValue={g.remark ?? ""} onBlur={(e) => e.target.value !== g.remark && update.mutate({ id: g.id, patch: { remark: e.target.value } })} className="h-8" /></TableCell>
                    <TableCell><Button size="icon" variant="ghost" onClick={() => del.mutate(g.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState icon={Award} title="No grade scale yet" description="Load the WAEC default or build your own scale row by row." action={<Button size="sm" onClick={seed} disabled={busy}>Use WAEC default</Button>} />
        )}
      </CardContent>
    </Card>
  );
}