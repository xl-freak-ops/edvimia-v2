import * as React from "react";
import { AlertTriangle, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMarkAnnouncementRead } from "@/lib/communication/hooks";
import type { Announcement } from "@/lib/communication/hooks";

interface Props {
  announcements: Announcement[];
  userId: string | null | undefined;
  readIds?: string[];
}

export function EmergencyAlertBanner({ announcements, userId, readIds = [] }: Props) {
  const [dismissed, setDismissed] = React.useState<string[]>([]);
  const markRead = useMarkAnnouncementRead(userId);

  const unread = announcements.filter(
    (a) => a.is_emergency && a.is_published && !readIds.includes(a.id) && !dismissed.includes(a.id)
  );

  if (unread.length === 0) return null;

  const latest = unread[0];

  function handleDismiss() {
    setDismissed((prev) => [...prev, latest.id]);
    if (userId) markRead.mutate(latest.id);
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-destructive/40 px-4 py-3",
        "bg-gradient-to-r from-destructive/15 to-destructive/5",
        "animate-fade-in",
      )}
    >
      <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-destructive">Emergency Alert</span>
          {unread.length > 1 && (
            <span className="rounded-full bg-destructive/20 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
              +{unread.length - 1} more
            </span>
          )}
        </div>
        <p className="text-sm font-medium truncate">{latest.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{latest.body}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
          onClick={handleDismiss}
        >
          <Eye className="h-3 w-3" />
          View
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
          onClick={handleDismiss}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
