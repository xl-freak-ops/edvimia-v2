import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["staff_status"];

const tones: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  on_leave: "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400",
  suspended: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  transferred: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400",
  terminated: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
  archived: "bg-muted text-muted-foreground border-border",
};

const labels: Record<string, string> = {
  active: "Active",
  on_leave: "On Leave",
  suspended: "Suspended",
  transferred: "Transferred",
  terminated: "Terminated",
  archived: "Archived",
};

export function StaffStatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        tones[status] ?? tones.archived,
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}

export const POSITION_LABELS: Record<Database["public"]["Enums"]["staff_position"], string> = {
  principal: "Principal",
  vice_principal: "Vice Principal",
  school_admin: "School Administrator",
  form_teacher: "Form Teacher",
  subject_teacher: "Subject Teacher",
  account_officer: "Account Officer",
  receptionist: "Receptionist",
  librarian: "Librarian",
  bursar: "Bursar",
  other: "Other Staff",
};