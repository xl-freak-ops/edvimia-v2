import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAddGuardian, useUpdateGuardian } from "@/lib/students/hooks";
import type { Guardian } from "@/lib/students/hooks";

const RELATIONSHIPS = [
  "Father",
  "Mother",
  "Guardian",
  "Uncle",
  "Aunt",
  "Grandparent",
  "Sibling",
  "Step-parent",
  "Emergency Contact",
  "Other",
];

type FormState = {
  full_name: string;
  relationship: string;
  custom_relationship: string;
  occupation: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  is_primary: boolean;
  is_emergency: boolean;
};

function empty(): FormState {
  return {
    full_name: "",
    relationship: "Father",
    custom_relationship: "",
    occupation: "",
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    is_primary: false,
    is_emergency: false,
  };
}

function fromGuardian(g: Guardian): FormState {
  const known = RELATIONSHIPS.includes(g.relationship);
  return {
    full_name: g.full_name,
    relationship: known ? g.relationship : "Other",
    custom_relationship: known ? "" : g.relationship,
    occupation: g.occupation ?? "",
    email: g.email ?? "",
    phone: g.phone ?? "",
    whatsapp: g.whatsapp ?? "",
    address: g.address ?? "",
    is_primary: g.is_primary ?? false,
    is_emergency: g.is_emergency ?? false,
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  studentId: string;
  schoolId: string;
  /** Pass an existing guardian to edit it, omit for add mode */
  guardian?: Guardian;
}

export function GuardianDialog({ open, onClose, studentId, schoolId, guardian }: Props) {
  const isEdit = !!guardian;
  const add = useAddGuardian(schoolId);
  const update = useUpdateGuardian();

  const [form, setForm] = useState<FormState>(guardian ? fromGuardian(guardian) : empty);

  // Reset form when dialog opens/closes or target guardian changes
  useEffect(() => {
    if (open) setForm(guardian ? fromGuardian(guardian) : empty());
  }, [open, guardian]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const effectiveRelationship =
    form.relationship === "Other" ? form.custom_relationship : form.relationship;

  const busy = add.isPending || update.isPending;
  const canSave = form.full_name.trim() && effectiveRelationship.trim();

  async function handleSave() {
    const payload = {
      full_name: form.full_name.trim(),
      relationship: effectiveRelationship.trim(),
      occupation: form.occupation.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      address: form.address.trim() || null,
      is_primary: form.is_primary,
      is_emergency: form.is_emergency,
    };

    try {
      if (isEdit && guardian) {
        await update.mutateAsync({ id: guardian.id, student_id: guardian.student_id, patch: payload });
        toast.success("Guardian updated");
      } else {
        await add.mutateAsync({ ...payload, student_id: studentId });
        toast.success("Guardian added");
      }
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save guardian");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit guardian" : "Add guardian"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Name & relationship */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Full name <span className="text-destructive">*</span></Label>
              <Input
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                placeholder="e.g. Emeka Okafor"
              />
            </div>
            <div className="space-y-2">
              <Label>Relationship <span className="text-destructive">*</span></Label>
              <Select value={form.relationship} onValueChange={(v) => set("relationship", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.relationship === "Other" && (
            <div className="space-y-2">
              <Label>Specify relationship <span className="text-destructive">*</span></Label>
              <Input
                value={form.custom_relationship}
                onChange={(e) => set("custom_relationship", e.target.value)}
                placeholder="e.g. Family friend"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Occupation</Label>
            <Input
              value={form.occupation}
              onChange={(e) => set("occupation", e.target.value)}
              placeholder="e.g. Engineer"
            />
          </div>

          {/* Contact */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="guardian@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+234 800 000 0000"
              />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp number</Label>
              <Input
                value={form.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
                placeholder="+234 800 000 0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              rows={2}
              placeholder="Guardian's home/office address"
            />
          </div>

          {/* Flags */}
          <div className="flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={form.is_primary}
                onCheckedChange={(v) => set("is_primary", !!v)}
              />
              Primary contact
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={form.is_emergency}
                onCheckedChange={(v) => set("is_emergency", !!v)}
              />
              Emergency contact
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave || busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save changes" : "Add guardian"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
