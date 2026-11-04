import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { usePublishedAnnouncements } from "@/lib/communication/hooks";
import { fmtDateTime } from "@/lib/finance/format";

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

export function CalendarWidget({ schoolId }: { schoolId: string | null | undefined }) {
  const { data: announcements = [] } = usePublishedAnnouncements(schoolId);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const monthLabel = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstWeekday + daysInMonth) / 7) * 7 }, (_, i) => {
    const d = i - firstWeekday + 1;
    return d > 0 && d <= daysInMonth ? d : null;
  });

  const upcoming = announcements
    .filter((a) => a.scheduled_at || a.created_at)
    .slice(0, 2);

  return (
    <Card className="rounded-2xl border-border/70 shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold">{monthLabel}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {DAY_LETTERS.map((d, i) => (
            <div key={i} className="py-1">{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((d, i) => (
            <button
              key={i}
              disabled={d === null}
              className={cn(
                "relative aspect-square rounded-lg text-xs font-medium transition-colors",
                d === null && "opacity-0",
                d !== null && "hover:bg-muted",
                d === today && "bg-primary text-primary-foreground font-semibold shadow-glow hover:bg-primary",
              )}
            >
              {d ?? ""}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-2 border-t border-border pt-3">
          {upcoming.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">No upcoming announcements</p>
          ) : (
            upcoming.map((a) => (
              <div key={a.id} className="flex items-start gap-2.5">
                <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", a.is_emergency ? "bg-destructive" : "bg-accent-brand")} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground">{fmtDateTime(a.published_at ?? a.created_at)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
