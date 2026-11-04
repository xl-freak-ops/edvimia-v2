import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileSpreadsheet } from "lucide-react";

export function ReportCategoryCard({
  icon: Icon,
  tone,
  title,
  description,
  stats,
  onExportCsv,
  onExportExcel,
  disabled,
}: {
  icon: LucideIcon;
  tone: string;
  title: string;
  description: string;
  stats: { label: string; value: string | number }[];
  onExportCsv: () => void;
  onExportExcel: () => void;
  disabled?: boolean;
}) {
  return (
    <Card className="shadow-soft border-border/70">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div className="flex items-center gap-3">
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border bg-muted/20 p-3">
              <div className="text-lg font-bold tabular-nums">{s.value}</div>
              <div className="text-[11px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={disabled} onClick={onExportCsv}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button size="sm" variant="outline" disabled={disabled} onClick={onExportExcel}>
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Export Excel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
