import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AISummaryCard({ points }: { points: string[] }) {
  return (
    <Card className="shadow-soft border-primary/20 bg-gradient-to-br from-primary/[0.05] via-card to-accent-brand/[0.05]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-accent-brand" /> Edvi · Whole-School Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {points.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Once attendance, results, fees and staff data start flowing in, Edvi will summarize the school's
            overall status here.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {points.map((p, i) => (
              <li key={i} className="flex items-start gap-2 rounded-lg bg-background/60 px-3 py-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-brand" />
                {p}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
