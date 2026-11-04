import { useState } from "react";
import {
  ArrowRightLeft, ArrowUpCircle, UserX, LogOut, GraduationCap, Archive, Trash2, MoreVertical, Pencil, MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useChangeStudentStatus, useDeleteStudent } from "@/lib/students/hooks";
import { ComposeMessageDialog } from "@/components/communication/ComposeMessageDialog";
import { useClasses } from "@/lib/school/hooks";
import { StudentEditDialog } from "./StudentEditDialog";
import type { Tables } from "@/integrations/supabase/types";

type Student = Tables<"students">;
type Kind = "transfer" | "promote" | "suspend" | "withdraw" | "graduate" | "archive" | "delete" | null;

const canManage = (roles: string[]) =>
  roles.some((r) => ["super_admin", "school_admin", "principal", "vice_principal"].includes(r));

export function StudentActionsMenu({ student }: { student: Student }) {
  const { roles, school, userId } = useAuth();
  const navigate = useNavigate();
  const schoolId = school?.id ?? "";
  const { data: classes = [] } = useClasses(schoolId);
  const change = useChangeStudentStatus(schoolId);
  const del = useDeleteStudent(schoolId);

  const [kind, setKind] = useState<Kind>(null);
  const [note, setNote] = useState("");
  const [targetClass, setTargetClass] = useState<string>("");
  const [editOpen, setEditOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  const isSuper = roles.includes("super_admin");
  const allowed = canManage(roles);

  const close = () => { setKind(null); setNote(""); setTargetClass(""); };

  async function confirm() {
    if (!kind) return;
    try {
      if (kind === "delete") {
        await del.mutateAsync(student.id);
        toast.success("Student deleted");
        navigate({ to: "/students" });
        return;
      }
      const map: Record<Exclude<Kind, null | "delete" | "transfer" | "promote">, Student["status"]> = {
        suspend: "suspended",
        withdraw: "withdrawn",
        graduate: "graduated",
        archive: "archived",
      };
      if (kind === "transfer" || kind === "promote") {
        await change.mutateAsync({
          id: student.id,
          action: kind,
          to_class_id: targetClass || null,
          note,
          current: student,
        });
      } else {
        await change.mutateAsync({
          id: student.id,
          action: kind,
          to_status: map[kind],
          note,
          current: student,
        });
      }
      toast.success("Action completed");
      close();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <MoreVertical className="h-4 w-4" /> Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Student Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={!allowed} onClick={() => setKind("promote")}>
            <ArrowUpCircle className="mr-2 h-4 w-4" /> Promote
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!allowed} onClick={() => setKind("transfer")}>
            <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!allowed} onClick={() => setKind("suspend")}>
            <UserX className="mr-2 h-4 w-4" /> Suspend
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!allowed} onClick={() => setKind("withdraw")}>
            <LogOut className="mr-2 h-4 w-4" /> Withdraw
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!allowed} onClick={() => setKind("graduate")}>
            <GraduationCap className="mr-2 h-4 w-4" /> Graduate
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!allowed} onClick={() => setKind("archive")}>
            <Archive className="mr-2 h-4 w-4" /> Archive
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={!allowed} onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit profile
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!student.user_id}
            onClick={() => student.user_id && setComposeOpen(true)}
          >
            <MessageCircle className="mr-2 h-4 w-4" /> Send message
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!allowed}
            onClick={() => setKind("delete")}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <StudentEditDialog student={student} open={editOpen} onOpenChange={setEditOpen} />

      {student.user_id && (
        <ComposeMessageDialog
          schoolId={schoolId}
          senderId={userId ?? ""}
          defaultRecipientId={student.user_id}
          open={composeOpen}
          onOpenChange={setComposeOpen}
        />
      )}

      <Dialog open={kind !== null} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">{kind} student</DialogTitle>
            <DialogDescription>
              {kind === "delete"
                ? "This action is permanent and cannot be undone."
                : "This action will be logged in the student's status history."}
            </DialogDescription>
          </DialogHeader>
          {(kind === "transfer" || kind === "promote") && (
            <div className="space-y-2">
              <Label>Target class</Label>
              <Select value={targetClass} onValueChange={setTargetClass}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {kind !== "delete" && (
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button
              variant={kind === "delete" ? "destructive" : "default"}
              onClick={confirm}
              disabled={change.isPending || del.isPending}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}