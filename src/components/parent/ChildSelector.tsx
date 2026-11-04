import { GraduationCap } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChildSummary } from "@/lib/parent/hooks";

interface Props {
  children: ChildSummary[];
  selected: ChildSummary | null;
  onSelect: (c: ChildSummary) => void;
}

export function ChildSelector({ children: kids, selected, onSelect }: Props) {
  if (kids.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/30 px-6 py-10 text-center">
        <GraduationCap className="h-8 w-8 text-muted-foreground/50" />
        <div>
          <p className="text-sm font-medium text-muted-foreground">No children linked yet</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ask your school admin to link your account to your child's record.
          </p>
        </div>
      </div>
    );
  }

  if (kids.length === 1) {
    const c = kids[0];
    const s = c.student;
    const name = `${s.first_name} ${s.surname}`.trim();
    const className = [s.classes?.name, s.class_arms?.name].filter(Boolean).join(" ");
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-soft">
        <Avatar className="h-10 w-10">
          <AvatarImage src={s.photo_url ?? undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent-brand/20 text-sm font-semibold">
            {name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{name}</p>
          <p className="text-xs text-muted-foreground">{className}</p>
        </div>
        <StatusBadge status={s.status} />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex gap-2 min-w-max">
        {kids.map((c) => {
          const s = c.student;
          const name = `${s.first_name} ${s.surname}`.trim();
          const cls = [s.classes?.name, s.class_arms?.name].filter(Boolean).join(" ");
          const isSelected = selected?.student.id === s.id;
          return (
            <button
              key={c.link.id}
              onClick={() => onSelect(c)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all text-left",
                "hover:border-primary/40 hover:bg-primary/5",
                isSelected
                  ? "border-primary bg-primary/10 shadow-soft"
                  : "border-border bg-card",
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={s.photo_url ?? undefined} />
                <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-primary/20 to-accent-brand/20">
                  {name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className={cn("text-sm font-medium", isSelected && "text-primary")}>{name}</p>
                <p className="text-[11px] text-muted-foreground">{cls}</p>
              </div>
              <StatusBadge status={s.status} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] shrink-0",
        isActive ? "text-success border-success/40 bg-success/10" : "text-amber-600 border-amber-400/40 bg-amber-50 dark:bg-amber-950/20",
      )}
    >
      <span className={cn("mr-1 h-1.5 w-1.5 rounded-full inline-block", isActive ? "bg-success" : "bg-amber-500")} />
      {isActive ? "Active" : status}
    </Badge>
  );
}
