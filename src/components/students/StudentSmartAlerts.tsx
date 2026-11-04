import { useMemo } from "react";
import { AlertTriangle, Cake, FileWarning, HeartPulse, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Tables } from "@/integrations/supabase/types";

type Row = Tables<"students">;

function isIncomplete(s: Row) {
  return !s.date_of_birth || !s.class_id || !s.home_address;
}
function birthdayThisWeek(s: Row) {
  if (!s.date_of_birth) return false;
  const now = new Date();
  const d = new Date(s.date_of_birth);
  d.setFullYear(now.getFullYear());
  const diff = (d.getTime() - now.getTime()) / 86400000;
  return diff >= -0.5 && diff <= 7;
}

export function StudentSmartAlerts({ students }: { students: Row[] }) {
  const s = useMemo(() => {
    const recent = [...students]
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, 5);
    const incomplete = students.filter(isIncomplete).length;
    const medical = students.filter((x) => x.medical_conditions).length;
    const birthdays = students.filter(birthdayThisWeek).length;
    // Duplicate detection: same first + surname + dob
    const key = (x: Row) => `${x.first_name}|${x.surname}|${x.date_of_birth ?? ""}`.toLowerCase();
    const counts = new Map<string, number>();
    students.forEach((x) => counts.set(key(x), (counts.get(key(x)) ?? 0) + 1));
    const dupes = Array.from(counts.values()).filter((v) => v > 1).length;
    return { recent, incomplete, medical, birthdays, dupes };
  }, [students]);

  const items = [
    { icon: FileWarning, tone: "warning", label: "Incomplete profiles", value: s.incomplete },
    { icon: AlertTriangle, tone: "danger", label: "Possible duplicates", value: s.dupes },
    { icon: HeartPulse, tone: "primary", label: "Medical alerts", value: s.medical },
    { icon: Cake, tone: "success", label: "Birthdays this week", value: s.birthdays },
  ] as const;

  const map = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-600",
    warning: "bg-amber-500/10 text-amber-600",
    danger: "bg-rose-500/10 text-rose-600",
  };

  return (
    <Card className="shadow-soft">
      <CardContent className="p-4 md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent-brand" />
          <h3 className="text-sm font-semibold">Smart alerts</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <div key={it.label} className="flex items-center gap-3 rounded-lg border bg-card/50 p-3">
              <div className={`grid h-9 w-9 place-items-center rounded-lg ${map[it.tone]}`}>
                <it.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">{it.label}</div>
                <div className="text-lg font-bold tabular-nums">{it.value}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}