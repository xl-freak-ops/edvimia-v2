import { Card } from "@/components/ui/card";
import { UserPlus, FileText, MessageSquare, Wallet, ClipboardList, CalendarPlus } from "lucide-react";

const actions = [
  { label: "Enroll student", icon: UserPlus, tone: "text-primary bg-primary/10" },
  { label: "Mark attendance", icon: ClipboardList, tone: "text-success bg-success/15" },
  { label: "Record payment", icon: Wallet, tone: "text-accent-brand bg-accent-brand/15" },
  { label: "Send announcement", icon: MessageSquare, tone: "text-info bg-info/15" },
  { label: "Generate report", icon: FileText, tone: "text-primary bg-primary/10" },
  { label: "Schedule event", icon: CalendarPlus, tone: "text-accent-brand bg-accent-brand/15" },
];

export function QuickActions() {
  return (
    <Card className="rounded-2xl border-border/70 p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">Quick actions</h3>
        <span className="text-xs text-muted-foreground">Customize</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {actions.map((a) => (
          <button
            key={a.label}
            className="group flex flex-col items-start gap-2.5 rounded-xl border border-transparent bg-muted/40 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-soft"
          >
            <span className={`grid h-9 w-9 place-items-center rounded-lg ${a.tone}`}>
              <a.icon className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold leading-tight">{a.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}