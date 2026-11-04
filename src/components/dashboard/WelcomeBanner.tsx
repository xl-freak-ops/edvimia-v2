import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Download, Sparkles } from "lucide-react";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function WelcomeBanner({
  name,
  schoolName,
}: {
  name: string;
  schoolName: string | null;
}) {
  const now = new Date();
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shadow-soft">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
          {dateLabel}
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {greeting(now.getHours())}, <span className="bg-gradient-to-r from-primary to-accent-brand bg-clip-text text-transparent">{name}</span>
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
          {schoolName ? `Here's what's happening at ${schoolName} today.` : "Here's what's happening today."}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="h-10 gap-2 rounded-lg">
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button asChild className="h-10 gap-2 rounded-lg bg-foreground text-background shadow-soft hover:bg-foreground/90">
          <Link to="/ai">
            <Sparkles className="h-4 w-4 text-accent-brand" />
            Ask Edvi
          </Link>
        </Button>
      </div>
    </section>
  );
}
