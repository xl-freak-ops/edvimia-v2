import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useStudents } from "@/lib/students/hooks";
import { EmptyState } from "@/components/school/EmptyState";

const statusTone: Record<string, string> = {
  active: "bg-success/15 text-success border-success/20",
  graduated: "bg-info/15 text-info border-info/20",
  transferred: "bg-warning/20 text-warning-foreground border-warning/30",
  suspended: "bg-destructive/10 text-destructive border-destructive/20",
  withdrawn: "bg-muted text-muted-foreground border-border",
  archived: "bg-muted text-muted-foreground border-border",
};

export function RecentStudentsTable({ schoolId }: { schoolId: string | null | undefined }) {
  const { data: students = [], isLoading } = useStudents(schoolId);
  const recent = students.slice(0, 5);

  return (
    <Card className="rounded-2xl border-border/70 shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">Recently enrolled</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">Latest {recent.length || ""} admissions</p>
        </div>
        <Button asChild variant="ghost" size="sm" className="h-8 rounded-lg text-xs">
          <Link to="/students">View all</Link>
        </Button>
      </CardHeader>
      <CardContent className="px-0 pb-3">
        {isLoading ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : recent.length === 0 ? (
          <div className="px-6">
            <EmptyState
              icon={Users}
              title="No students yet"
              description="Once students are enrolled, the most recent admissions will appear here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-2 font-semibold">Student</th>
                  <th className="px-3 py-2 font-semibold">Class</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-6 py-2 text-right font-semibold">Admission No.</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => {
                  const cls = (r as unknown as { classes?: { name: string } | null }).classes;
                  const arm = (r as unknown as { class_arms?: { name: string } | null }).class_arms;
                  const className = [cls?.name, arm?.name].filter(Boolean).join(" ") || "—";
                  const initials = `${(r.first_name ?? "?").charAt(0)}${(r.surname ?? "").charAt(0)}`.toUpperCase();
                  return (
                    <tr key={r.id} className="group border-b border-border/50 transition-colors last:border-0 hover:bg-muted/40">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-to-br from-primary/80 to-accent-brand/80 text-[10px] font-semibold text-primary-foreground">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{r.first_name} {r.surname}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{className}</td>
                      <td className="px-3 py-3">
                        <Badge variant="outline" className={cn("rounded-full text-[10px] capitalize", statusTone[r.status] ?? statusTone.archived)}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-[11px] text-muted-foreground">{r.admission_number ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
