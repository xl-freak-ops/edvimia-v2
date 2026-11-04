import * as React from "react";
import { Sparkles, RefreshCw, BookOpen, TrendingUp, Calendar, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  studentName: string;
  attendancePct: number;
  results: Array<{ subjectName: string; total: number; grade: string | null }>;
  upcomingHomework: Array<{ title: string; subject: string; dueDate: string }>;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function buildTips(
  results: Props["results"],
  attendancePct: number,
  homework: Props["upcomingHomework"],
  variant: number,
): Array<{ icon: React.ComponentType<{ className?: string }>; text: string; accent: string }> {
  const tips: Array<{ icon: React.ComponentType<{ className?: string }>; text: string; accent: string }> = [];

  if (results.length > 0) {
    const sorted = [...results].sort((a, b) => (a.total ?? 0) - (b.total ?? 0));
    const weakest = sorted[0];
    const strongest = sorted[sorted.length - 1];

    if (weakest.total < 60) {
      tips.push({
        icon: TrendingUp,
        text: `Your ${weakest.subjectName} score (${weakest.total}/100) has room to grow. Try spending an extra 20 minutes daily on practice problems.`,
        accent: "text-amber-600 dark:text-amber-400",
      });
    }

    if (strongest.total >= 75) {
      tips.push({
        icon: BookOpen,
        text: variant % 2 === 0
          ? `You're excelling in ${strongest.subjectName} with ${strongest.total}/100! Keep up the great work.`
          : `${strongest.subjectName} is your strongest subject at ${strongest.total}/100. Consider helping classmates to reinforce your own understanding.`,
        accent: "text-success",
      });
    }
  }

  if (attendancePct < 90 && attendancePct > 0) {
    tips.push({
      icon: AlertTriangle,
      text: `Your attendance is at ${attendancePct}%. Regular attendance is strongly linked to better grades — aim for 95%+ this term.`,
      accent: "text-destructive",
    });
  }

  if (homework.length > 0) {
    const next = homework[0];
    tips.push({
      icon: Calendar,
      text: `You have ${homework.length} assignment${homework.length > 1 ? "s" : ""} upcoming. Start with "${next.title}" for ${next.subject} — due ${new Date(next.dueDate).toLocaleDateString()}.`,
      accent: "text-blue-600 dark:text-blue-400",
    });
  }

  if (tips.length === 0) {
    tips.push({
      icon: Sparkles,
      text: "Your academic data is loading. Check back once your results and attendance are available for personalised study tips.",
      accent: "text-accent-brand",
    });
  }

  return tips;
}

export function StudentAIAssistant({ studentName, attendancePct, results, upcomingHomework }: Props) {
  const [variant, setVariant] = React.useState(0);
  const firstName = studentName.split(" ")[0];
  const tips = buildTips(results, attendancePct, upcomingHomework, variant);

  return (
    <div className="relative overflow-hidden rounded-xl border border-accent-brand/20 bg-gradient-to-br from-accent-brand/10 via-card to-primary/5 p-4 shadow-soft">
      {/* Background glow */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent-brand/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-primary/10 blur-2xl" />

      <div className="relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent-brand to-primary shadow-glow">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-accent-brand to-primary bg-clip-text text-transparent">
                Edvi · Study Assistant
              </p>
              <p className="text-xs text-muted-foreground">
                {getGreeting()}, {firstName}!
              </p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-accent-brand"
            onClick={() => setVariant((v) => v + 1)}
            title="Get new tips"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Tips */}
        <div className="space-y-2.5">
          {tips.map((tip, i) => {
            const Icon = tip.icon;
            return (
              <div key={i} className="flex items-start gap-2.5">
                <div className={cn("mt-0.5 shrink-0", tip.accent)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <p className="text-sm leading-relaxed text-foreground">{tip.text}</p>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-muted-foreground border-t border-border/50 pt-2">
          Generated from your real academic data · Refresh for different tips
        </p>
      </div>
    </div>
  );
}
