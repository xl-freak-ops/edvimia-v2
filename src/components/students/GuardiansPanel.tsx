import { useState } from "react";
import { Mail, Phone, MessageCircle, Shield, User, Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/school/EmptyState";
import { GuardianDialog } from "./GuardianDialog";
import { useGuardians, useDeleteGuardian } from "@/lib/students/hooks";
import type { Guardian } from "@/lib/students/hooks";

interface Props {
  studentId: string;
  schoolId: string;
}

export function GuardiansPanel({ studentId, schoolId }: Props) {
  const { data = [] } = useGuardians(studentId);
  const deleteGuardian = useDeleteGuardian();

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Guardian | null>(null);
  const [deleting, setDeleting] = useState<Guardian | null>(null);

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteGuardian.mutateAsync({ id: deleting.id, student_id: deleting.student_id });
      toast.success("Guardian removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove guardian");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <div className="space-y-3">
        {data.length === 0 ? (
          <EmptyState
            icon={User}
            title="No guardians recorded"
            description="Add parent or guardian contact details for this student."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.map((g) => (
              <GuardianCard
                key={g.id}
                guardian={g}
                onEdit={() => setEditing(g)}
                onDelete={() => setDeleting(g)}
              />
            ))}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="gap-2 w-full"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-4 w-4" /> Add guardian
        </Button>
      </div>

      {/* Add dialog */}
      <GuardianDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        studentId={studentId}
        schoolId={schoolId}
      />

      {/* Edit dialog */}
      <GuardianDialog
        open={!!editing}
        onClose={() => setEditing(null)}
        studentId={studentId}
        schoolId={schoolId}
        guardian={editing ?? undefined}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove guardian?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleting?.full_name}</strong> from this
              student's record. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function GuardianCard({
  guardian: g,
  onEdit,
  onDelete,
}: {
  guardian: Guardian;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-sm truncate">{g.full_name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {g.relationship}
              {g.occupation ? ` · ${g.occupation}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {g.is_primary && (
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/10 text-primary text-[10px]"
              >
                Primary
              </Badge>
            )}
            {g.is_emergency && (
              <Badge
                variant="outline"
                className="border-rose-500/20 bg-rose-500/10 text-rose-600 text-[10px]"
              >
                <Shield className="mr-1 h-3 w-3" />
                Emergency
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {g.email && <Row icon={Mail}>{g.email}</Row>}
        {g.phone && <Row icon={Phone}>{g.phone}</Row>}
        {g.whatsapp && <Row icon={MessageCircle}>{g.whatsapp}</Row>}
        {g.address && <p className="text-xs text-muted-foreground">{g.address}</p>}
      </CardContent>
    </Card>
  );
}

function Row({ icon: Icon, children }: { icon: typeof Mail; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span>{children}</span>
    </div>
  );
}
