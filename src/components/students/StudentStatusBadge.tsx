import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["student_status"];

const MAP: Record<Status, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  graduated: { label: "Graduated", cls: "bg-primary/10 text-primary border-primary/20" },
  transferred: { label: "Transferred", cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  suspended: { label: "Suspended", cls: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20" },
  withdrawn: { label: "Withdrawn", cls: "bg-muted text-muted-foreground border-border" },
  archived: { label: "Archived", cls: "bg-muted text-muted-foreground border-border" },
};

export function StudentStatusBadge({ status }: { status: Status }) {
  const s = MAP[status];
  return (
    <Badge variant="outline" className={`font-medium ${s.cls}`}>
      {s.label}
    </Badge>
  );
}