import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { Megaphone, AlertTriangle, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useParentAnnouncements,
  useMarkParentAnnouncementRead,
} from "@/lib/parent/hooks";
import type { AnnouncementWithSender } from "@/lib/communication/hooks";
import { MESSAGE_TYPES } from "@/lib/communication/hooks";

interface Props {
  schoolId: string;
  userId: string;
}

export function ParentAnnouncementsPanel({ schoolId, userId }: Props) {
  const { data: announcements = [], isLoading } = useParentAnnouncements(schoolId);
  const markRead = useMarkParentAnnouncementRead(userId);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [read, setRead] = React.useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = React.useState("all");

  const filtered =
    typeFilter === "all" ? announcements : announcements.filter((a) => a.type === typeFilter);

  async function handleExpand(ann: AnnouncementWithSender) {
    const id = ann.id;
    setExpanded(expanded === id ? null : id);
    if (!read.has(id)) {
      setRead((prev) => new Set([...prev, id]));
      try {
        await markRead.mutateAsync(id);
      } catch {
        /* silent */
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center">
        <Megaphone className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">No announcements yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        <TypeChip label="All" active={typeFilter === "all"} onClick={() => setTypeFilter("all")} />
        {MESSAGE_TYPES.map((t) => (
          <TypeChip
            key={t.value}
            label={t.label}
            active={typeFilter === t.value}
            onClick={() => setTypeFilter(t.value)}
          />
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((ann) => {
          const isExpanded = expanded === ann.id;
          const isUnread = !read.has(ann.id);
          return (
            <div
              key={ann.id}
              className={cn(
                "rounded-xl border bg-card transition-all",
                ann.is_emergency && "border-l-4 border-l-destructive",
                isUnread && !ann.is_emergency && "border-l-4 border-l-primary",
              )}
            >
              <button
                className="flex w-full items-start gap-3 p-4 text-left"
                onClick={() => handleExpand(ann)}
              >
                <div className="mt-0.5 shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {ann.is_emergency && (
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                    )}
                    <span className={cn("text-sm truncate", isUnread && "font-semibold")}>
                      {ann.title}
                    </span>
                    {isUnread && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {ann.profiles?.full_name ?? "School"} ·{" "}
                    {formatDistanceToNow(new Date(ann.created_at), { addSuffix: true })}
                  </p>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 pb-4 pt-3">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{ann.body}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TypeChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:border-primary/40",
      )}
    >
      {label}
    </button>
  );
}
