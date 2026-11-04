import {
  AlertTriangle,
  Megaphone,
  BookOpen,
  Wallet,
  Bell,
  Calendar,
  ShieldAlert,
  MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  emergency: {
    label: "Emergency",
    icon: AlertTriangle,
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
  announcement: {
    label: "Announcement",
    icon: Megaphone,
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  },
  academic: {
    label: "Academic",
    icon: BookOpen,
    className: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
  },
  finance: {
    label: "Finance",
    icon: Wallet,
    className: "bg-success/15 text-success border-success/30",
  },
  reminder: {
    label: "Reminder",
    icon: Bell,
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  event: {
    label: "Event",
    icon: Calendar,
    className: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
  },
  disciplinary: {
    label: "Disciplinary",
    icon: ShieldAlert,
    className: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
  },
  general: {
    label: "General",
    icon: MessageSquare,
    className: "bg-muted text-muted-foreground border-border",
  },
};

interface Props {
  type: string;
  showIcon?: boolean;
  className?: string;
}

export function MessageTypeBadge({ type, showIcon = true, className }: Props) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.general;
  const Icon = config.icon;
  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-semibold",
        config.className,
        className,
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
