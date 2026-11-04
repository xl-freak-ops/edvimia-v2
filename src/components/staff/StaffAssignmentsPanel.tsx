import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  useStaffAssignments,
  useCreateAssignment,
  useDeleteAssignment,
} from "@/lib/staff/hooks";
import { EmptyState } from "@/components/school/EmptyState";
import { Layers } from "lucide-react";

type Kind = "subject" | "class" | "class_arm" | "department" | "club";

type Row = {
  id: string;
  assignment_type: string;
  department: string | null;
  club_name: string | null;
  subjects?: { name: string } | null;
  classes?: { name: string } | null;
  class_arms?: { name: string } | null;
};

function rowLabel(r: Row): string {
  return (
    r.subjects?.name ??
    r.classes?.name ??
    r.class_arms?.name ??
    r.department ??
    r.club_name ??
    "—"
  );
}

export function StaffAssignmentsPanel({ staffId, schoolId }: { staffId: string; schoolId: string }) {
  const { data: rows = [], isLoading } = useStaffAssignments(staffId);
  const create = useCreateAssignment(staffId);
  const del = useDeleteAssignment(staffId);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("subject");
  const [label, setLabel] = useState("");

  async function add() {
    if (!label.trim()) return toast.error("Enter a name for this assignment");
    try {
      const trimmed = label.trim();
      await create.mutateAsync({
        staff_id: staffId,
        school_id: schoolId,
        assignment_type: kind,
        department: kind === "department" ? trimmed : null,
        club_name: kind === "club" ? trimmed : null,
      });
      toast.success("Assignment added");
      setLabel("");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add assignment");
    }
  }

  const grouped: Record<Kind, Row[]> = {
    subject: [], class: [], class_arm: [], department: [], club: [],
  };
  (rows as unknown as Row[]).forEach((r) => {
    const k = r.assignment_type as Kind;
    if (grouped[k]) grouped[k].push(r);
  });

  return (
    <Card className="shadow-soft">
      <CardContent className="p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Assignments</h3>
            <p className="text-xs text-muted-foreground">Subjects, classes, departments and clubs assigned to this staff member.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New assignment</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={kind} onValueChange={(v) => setKind(v as Kind)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subject">Subject</SelectItem>
                      <SelectItem value="class">Class</SelectItem>
                      <SelectItem value="class_arm">Class Arm</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                      <SelectItem value="club">Club</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Mathematics · JSS 2" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={add} disabled={create.isPending}>
                  {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Layers} title="No assignments yet" description="Assign this staff member to subjects, classes, departments or clubs." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {(Object.keys(grouped) as Kind[]).map((k) => {
              const items = grouped[k];
              if (items.length === 0) return null;
              return (
                <div key={k} className="rounded-lg border border-border/70 p-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {k.replace(/_/g, " ")}s
                  </div>
                  <ul className="space-y-1.5">
                    {items.map((r) => (
                      <li key={r.id} className="flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-1.5">
                        <span className="text-sm">{rowLabel(r)}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => del.mutate(r.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}