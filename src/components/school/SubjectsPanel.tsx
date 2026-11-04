import { useState } from "react";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { EmptyState } from "./EmptyState";
import { schoolKeys, useCreateRow, useDeleteRow, useSubjects, useUpdateRow } from "@/lib/school/hooks";

const CATEGORIES = ["core", "elective", "practical"] as const;

export function SubjectsPanel({ schoolId }: { schoolId: string }) {
  const subjects = useSubjects(schoolId);
  const create = useCreateRow("subjects", schoolKeys.subjects(schoolId));
  const update = useUpdateRow("subjects", schoolKeys.subjects(schoolId));
  const del = useDeleteRow("subjects", schoolKeys.subjects(schoolId));

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [dept, setDept] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("core");

  const submit = async () => {
    if (!name.trim()) return toast.error("Name required");
    await create.mutateAsync({ school_id: schoolId, name: name.trim(), code: code.trim() || null, department: dept.trim() || null, category });
    setName(""); setCode(""); setDept(""); setCategory("core"); setOpen(false);
    toast.success("Subject added");
  };

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-primary" /> Subjects</CardTitle>
          <CardDescription>Configure subjects taught at your school.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New subject</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New subject</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mathematics" /></div>
                <div className="space-y-1.5"><Label>Code</Label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="MTH" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Department</Label><Input value={dept} onChange={(e) => setDept(e.target.value)} placeholder="Sciences" /></div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter><Button onClick={submit} disabled={create.isPending}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {subjects.data?.length ? (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.data.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="font-mono text-xs uppercase">{s.code ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{s.department ?? "—"}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{s.category}</Badge></TableCell>
                    <TableCell>
                      <Switch checked={s.is_active} onCheckedChange={(v) => update.mutate({ id: s.id, patch: { is_active: v } })} />
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => del.mutate(s.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState icon={BookOpen} title="No subjects yet" description="Add subjects so teachers can be assigned and results can be recorded." />
        )}
      </CardContent>
    </Card>
  );
}