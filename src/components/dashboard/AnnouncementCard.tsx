import { Card } from "@/components/ui/card";
import { Megaphone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { usePublishedAnnouncements } from "@/lib/communication/hooks";

export function AnnouncementCard({ schoolId }: { schoolId: string | null | undefined }) {
  const { data: announcements = [], isLoading } = usePublishedAnnouncements(schoolId);

  if (isLoading) {
    return (
      <Card className="flex h-40 items-center justify-center rounded-2xl border-border/70 shadow-soft">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  const latest = announcements[0];
  if (!latest) return null;

  return (
    <Card className="relative overflow-hidden rounded-2xl border-border/70 bg-gradient-to-br from-primary via-primary to-[oklch(0.42_0.2_265)] p-6 text-primary-foreground shadow-elevated">
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-accent-brand/30 blur-3xl" />
      <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="relative">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur">
          <Megaphone className="h-3 w-3" /> {latest.is_emergency ? "Urgent announcement" : "Latest announcement"}
        </div>
        <h3 className="text-xl font-bold leading-tight tracking-tight">{latest.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-primary-foreground/85">{latest.body}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button asChild size="sm" className="rounded-lg bg-white text-primary shadow-soft hover:bg-white/90">
            <Link to="/communication">View all</Link>
          </Button>
          {latest.created_at && (
            <span className="text-xs text-primary-foreground/70">
              {formatDistanceToNow(new Date(latest.created_at), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
