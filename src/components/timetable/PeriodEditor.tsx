import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useSubjects } from "@/lib/school/hooks";
import { useCreatePeriod, useDeletePeriod, useUpdatePeriod, DEFAULT_PALETTE, type TimetablePeriod } from "@/lib/timetable/hooks";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Staff = Tables<"staff">;

export function PeriodEditor({
  open, onOpenChange, existing, defaults, staff,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  existing: TimetablePeriod | null;
  defaults: Partial<TablesInsert<"timetable_periods">>;
  staff: Staff[];
}) {
  const { school, userId } = useAuth();
  const subjects = useSubjects(school?.id ?? null);
  const create = useCreatePeriod();
  const update = useUpdatePeriod();
  const del = useDeletePeriod();

  const [form, setForm] = React.useState<Partial<TablesInsert<"timetable_periods">>>({});

  React.useEffect(() => {
    if (existing) setForm(existing);
    else setForm({
      kind: "class", start_time: "08:00", end_time: "08:45", color: DEFAULT_PALETTE[0], ...defaults,
    });
  }, [existing, defaults, open]);

  const save = async () => {
    if (!school?.id) return;
    const payload: TablesInsert<"timetable_periods"> = {
      school_id: school.id,
      session_id: form.session_id ?? null,
      term_id: form.term_id ?? null,
      class_id: form.class_id ?? null,
      arm_id: form.arm_id ?? null,
      day_of_week: form.day_of_week ?? 1,
      period_index: form.period_index ?? 1,
      start_time: form.start_time ?? "08:00",
      end_time: form.end_time ?? "08:45",
      kind: form.kind ?? "class",
      subject_id: form.subject_id ?? null,
      teacher_id: form.teacher_id ?? null,
      room: form.room ?? null,
      color: form.color ?? DEFAULT_PALETTE[0],
      note: form.note ?? null,
      created_by: userId ?? null,
    };
    try {
      if (existing) await update.mutateAsync({ id: existing.id, patch: payload });
      else await create.mutateAsync(payload);
      toast.success("Period saved");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const remove = async () => {
    if (!existing) return;
    try { await del.mutateAsync(existing.id); toast.success("Removed"); onOpenChange(false); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const busy = create.isPending || update.isPending || del.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{existing ? "Edit period" : "New period"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Start</label>
              <Input type="time" value={form.start_time ?? ""} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">End</label>
              <Input type="time" value={form.end_time ?? ""} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Type</label>
            <Select value={form.kind ?? "class"} onValueChange={(v) => setForm({ ...form, kind: v as TimetablePeriod["kind"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="class">Class</SelectItem>
                <SelectItem value="break">Break</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="assembly">Assembly</SelectItem>
                <SelectItem value="free">Free</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.kind === "class" && (
            <>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Subject</label>
                <Select value={form.subject_id ?? ""} onValueChange={(v) => setForm({ ...form, subject_id: v || null })}>
                  <SelectTrigger><SelectValue placeholder="Choose subject" /></SelectTrigger>
                  <SelectContent>
                    {(subjects.data ?? []).map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Teacher</label>
                <Select value={form.teacher_id ?? ""} onValueChange={(v) => setForm({ ...form, teacher_id: v || null })}>
                  <SelectTrigger><SelectValue placeholder="Assign teacher" /></SelectTrigger>
                  <SelectContent>
                    {staff.filter((s) => s.is_teaching).map((s) => (<SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Room</label>
                <Input value={form.room ?? ""} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="e.g. Block A / Rm 12" />
              </div>
            </>
          )}
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Colour</label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_PALETTE.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                  className={`h-7 w-7 rounded-full border-2 ${form.color === c ? "border-foreground" : "border-transparent"}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Note</label>
            <Textarea rows={2} value={form.note ?? ""} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
        </div>
        <DialogFooter className="justify-between sm:justify-between">
          <div>
            {existing && (
              <Button variant="ghost" onClick={remove} disabled={busy} className="text-destructive hover:text-destructive">
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
            <Button onClick={save} disabled={busy}>
              {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}