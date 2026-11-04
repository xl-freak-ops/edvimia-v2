import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { LucideIcon } from "lucide-react";

export function BarChartCard({
  icon: Icon,
  title,
  subtitle,
  data,
  dataKey,
  color = "hsl(var(--accent-brand))",
  valueFormatter,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  data: Array<Record<string, unknown>>;
  dataKey: string;
  color?: string;
  valueFormatter?: (v: number) => string;
}) {
  const config: ChartConfig = { [dataKey]: { label: title, color } };

  return (
    <Card className="shadow-soft border-border/70">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent-brand/10 text-accent-brand">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="grid h-[180px] place-items-center text-xs text-muted-foreground">
            Not enough data yet
          </div>
        ) : (
          <ChartContainer config={config} className="h-[180px] w-full">
            <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} interval={0} angle={-15} height={40} textAnchor="end" />
              <YAxis tickLine={false} axisLine={false} fontSize={11} width={32} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (valueFormatter ? valueFormatter(Number(value)) : String(value))}
                  />
                }
              />
              <Bar dataKey={dataKey} fill={`var(--color-${dataKey})`} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
