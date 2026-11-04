import { Sparkles, TrendingDown, TrendingUp, AlertTriangle, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";

export function StudentAIInsights({ student }: { student: Tables<"students"> }) {
  const name = `${student.first_name} ${student.surname}`;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="shadow-soft lg:col-span-2 border-accent-brand/20 bg-gradient-to-br from-accent-brand/5 via-background to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-accent-brand" /> Edvi Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <p>
            <span className="font-semibold">{name}</span> is currently{" "}
            <Badge variant="outline" className="mx-0.5 border-primary/20 bg-primary/10 text-primary">
              {student.status}
            </Badge>{" "}
            in the school register. Based on admission records and recent activity, Edvi has generated
            the following preliminary observations.
          </p>
          <p className="text-muted-foreground">
            Connect attendance, grading and finance modules to unlock full AI analytics including
            performance forecasting and personalised intervention plans.
          </p>
        </CardContent>
      </Card>
      <div className="space-y-3">
        <Signal icon={TrendingUp} tone="success" label="Outstanding" value="Awaiting data" />
        <Signal icon={TrendingDown} tone="warning" label="Declining performance" value="No signals" />
        <Signal icon={AlertTriangle} tone="danger" label="At-risk" value="Not flagged" />
        <Signal icon={Target} tone="primary" label="Recommended plan" value="Baseline monitoring" />
      </div>
    </div>
  );
}

function Signal({
  icon: Icon, tone, label, value,
}: { icon: typeof Sparkles; tone: "primary" | "success" | "warning" | "danger"; label: string; value: string }) {
  const map = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-600",
    warning: "bg-amber-500/10 text-amber-600",
    danger: "bg-rose-500/10 text-rose-600",
  };
  return (
    <Card className="shadow-soft">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${map[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className="truncate text-sm font-semibold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}