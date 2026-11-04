import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down";
  icon: LucideIcon;
  accent?: "primary" | "brand" | "success" | "info";
  spark?: number[];
};

const accentMap = {
  primary: "bg-primary/10 text-primary",
  brand: "bg-accent-brand/15 text-accent-brand",
  success: "bg-success/15 text-success",
  info: "bg-info/15 text-info",
} as const;

function Spark({ data, color }: { data: number[]; color: string }) {
  const w = 96;
  const h = 32;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-90">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StatCard({
  label,
  value,
  delta,
  trend = "up",
  icon: Icon,
  accent = "primary",
  spark,
}: StatCardProps) {
  return (
    <Card className="group relative overflow-hidden rounded-2xl border-border/70 bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-transform group-hover:scale-105",
            accentMap[accent],
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between">
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              trend === "up"
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive",
            )}
          >
            {trend === "up" ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {delta}
          </span>
        ) : <span />}
        {spark && (
          <Spark
            data={spark}
            color={trend === "up" ? "var(--success)" : "var(--destructive)"}
          />
        )}
      </div>
    </Card>
  );
}