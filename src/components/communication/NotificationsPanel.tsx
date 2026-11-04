import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead,
  type Notification,
} from "@/lib/communication/hooks";
import { MessageTypeBadge } from "./MessageTypeBadge";

interface Props {
  schoolId: string;
  userId: string;
}

export function NotificationsPanel({ schoolId, userId }: Props) {
  const { data: notifications = [], isLoading } = useNotifications(userId, schoolId);
  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead(userId, schoolId);

  const unread = notifications.filter((n) => !n.is_read);

  async function handleMarkAll() {
    await markAll.mutateAsync();
  }

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center">
        <Bell className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">No notifications yet</p>
        <p className="text-xs text-muted-foreground">
          Published announcements automatically send notifications to all targeted users.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {unread.length > 0 ? (
            <span>
              <span className="font-semibold text-foreground">{unread.length}</span> unread
            </span>
          ) : (
            "All caught up"
          )}
        </p>
        {unread.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={handleMarkAll}
            disabled={markAll.isPending}
          >
            {markAll.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCheck className="h-3 w-3" />
            )}
            Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map((n) => (
          <NotificationRow
            key={n.id}
            notification={n}
            onRead={() => markOne.mutateAsync(n.id)}
          />
        ))}
      </div>
    </div>
  );
}

function NotificationRow({
  notification: n,
  onRead,
}: {
  notification: Notification;
  onRead: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3 transition-colors cursor-pointer",
        !n.is_read && "bg-primary/5 border-primary/20",
        n.is_read && "bg-card",
        n.type === "emergency" && !n.is_read && "bg-destructive/5 border-destructive/20",
      )}
      onClick={() => { if (!n.is_read) onRead(); }}
    >
      <div className="mt-0.5 shrink-0">
        {!n.is_read && (
          <span className="block h-2 w-2 rounded-full bg-primary" />
        )}
        {n.is_read && (
          <span className="block h-2 w-2 rounded-full bg-muted" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <span className={cn("text-sm truncate", !n.is_read && "font-semibold")}>
            {n.title}
          </span>
          <MessageTypeBadge type={n.type} showIcon={false} />
        </div>
        {n.body && (
          <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
        )}
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
