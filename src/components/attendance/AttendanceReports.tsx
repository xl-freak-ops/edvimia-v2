import * as React from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useAttendanceRange, STATUS_META, type AttendanceStatus } from "@/lib/attendance/hooks";
import { useStudents } from "@/lib/students/hooks";

function toCSV(rows: string[][]): string {
  return rows.map((r) => r.map((c) => `"${(c ?? "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
}
function downloadBlob(name: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export function AttendanceReports() {
  const { school } = useAuth();
  const schoolId = school?.id ?? null;
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date(new Date().setDate(1)).toISOString().slice(0, 10);
  const [from, setFrom] = React.useState(monthStart);
  const [to, setTo] = React.useState(today);
  const [range, setRange] = React.useState<"custom" | "day" | "week" | "month" | "term">("month");

  React.useEffect(() => {
    const now = new Date();
    if (range === "day") { const d = now.toISOString().slice(0, 10); setFrom(d); setTo(d); }
    else if (range === "week") {
      const w = new Date(now); w.setDate(now.getDate() - 6);
      setFrom(w.toISOString().slice(0, 10)); setTo(now.toISOString().slice(0, 10));
    }
    else if (range === "month") {
      const m = new Date(now.getFullYear(), now.getMonth(), 1);
      setFrom(m.toISOString().slice(0, 10)); setTo(now.toISOString().slice(0, 10));
    }
    else if (range === "term") {
      const t = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      setFrom(t.toISOString().slice(0, 10)); setTo(now.toISOString().slice(0, 10));
    }
  }, [range]);

  const rows = useAttendanceRange(schoolId, from, to);
  const students = useStudents(schoolId);

  const summary = React.useMemo(() => {
    const byStudent = new Map<string, Record<AttendanceStatus, number> & { total: number }>();
    (rows.data ?? []).forEach((r) => {
      const rec = byStudent.get(r.student_id) ?? { present: 0, absent: 0, late: 0, excused: 0, medical: 0, half_day: 0, remote: 0, total: 0 } as any;
      rec[r.status] = (rec[r.status] ?? 0) + 1;
      rec.total += 1;
      byStudent.set(r.student_id, rec);
    });
    return byStudent;
  }, [rows.data]);

  const roster = students.data ?? [];

  const buildCsv = () => {
    const header = ["Admission", "Name", "Total", "Present", "Absent", "Late", "Excused", "Medical", "Half Day", "Rate %"];
    const body = roster.map((s) => {
      const r = summary.get(s.id) as any;
      const total = r?.total ?? 0;
      const good = (r?.present ?? 0) + (r?.late ?? 0) + (r?.half_day ?? 0);
      const rate = total ? Math.round((good / total) * 100) : 0;
      return [
        s.admission_number ?? "", `${s.first_name} ${s.surname}`,
        String(total), String(r?.present ?? 0), String(r?.absent ?? 0),
        String(r?.late ?? 0), String(r?.excused ?? 0), String(r?.medical ?? 0), String(r?.half_day ?? 0),
        `${rate}`,
      ];
    });
    return toCSV([header, ...body]);
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-soft">
        <CardHeader className="pb-3"><CardTitle className="text-base">Reports</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="w-40">
            <label className="mb-1 block text-xs text-muted-foreground">Range</label>
            <Select value={range} onValueChange={(v) => setRange(v as typeof range)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="term">This term</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">From</label>
            <Input type="date" value={from} onChange={(e) => { setRange("custom"); setFrom(e.target.value); }} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">To</label>
            <Input type="date" value={to} onChange={(e) => { setRange("custom"); setTo(e.target.value); }} />
          </div>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={() => downloadBlob(`attendance-${from}_to_${to}.csv`, "text/csv", buildCsv())}>
              <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => downloadBlob(`attendance-${from}_to_${to}.xls`, "application/vnd.ms-excel", buildCsv())}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Excel
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <FileText className="mr-1.5 h-3.5 w-3.5" /> Print / PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader className="pb-3"><CardTitle className="text-base">Student summary</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admission</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Present</TableHead>
                  <TableHead className="text-center">Absent</TableHead>
                  <TableHead className="text-center">Late</TableHead>
                  <TableHead className="text-center">Excused</TableHead>
                  <TableHead className="text-center">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roster.slice(0, 200).map((s) => {
                  const r = summary.get(s.id) as any;
                  const total = r?.total ?? 0;
                  const good = (r?.present ?? 0) + (r?.late ?? 0) + (r?.half_day ?? 0);
                  const rate = total ? Math.round((good / total) * 100) : 0;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.admission_number}</TableCell>
                      <TableCell className="text-sm">{s.first_name} {s.surname}</TableCell>
                      <TableCell className="text-center text-xs">{total}</TableCell>
                      <TableCell className="text-center text-xs">{r?.present ?? 0}</TableCell>
                      <TableCell className="text-center text-xs">{r?.absent ?? 0}</TableCell>
                      <TableCell className="text-center text-xs">{r?.late ?? 0}</TableCell>
                      <TableCell className="text-center text-xs">{(r?.excused ?? 0) + (r?.medical ?? 0)}</TableCell>
                      <TableCell className="text-center text-xs font-semibold">{rate}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Status legend to consume STATUS_META import */}
      <div className="hidden">{Object.values(STATUS_META).map((m) => m.label).join(" ")}</div>
    </div>
  );
}