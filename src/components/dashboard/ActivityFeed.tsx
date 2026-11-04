import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRecentPayments } from "@/lib/finance/hooks";
import { fmtMoney } from "@/lib/finance/format";
import { EmptyState } from "@/components/school/EmptyState";

function initialsOf(first?: string | null, last?: string | null) {
  return `${(first ?? "?").charAt(0)}${(last ?? "").charAt(0)}`.toUpperCase();
}

export function ActivityFeed({ schoolId }: { schoolId: string | null | undefined }) {
  const { data: payments = [], isLoading } = useRecentPayments(schoolId, 5);

  return (
    <Card className="rounded-2xl border-border/70 shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold">Recent activity</CardTitle>
        {payments.length > 0 && (
          <Badge variant="secondary" className="rounded-full text-[10px] font-semibold">
            Live
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No recent activity"
            description="Payments and other school activity will show up here as they happen."
          />
        ) : (
          payments.map((p) => {
            const student = (p as unknown as { students?: { first_name: string; surname: string } }).students;
            const name = student ? `${student.first_name} ${student.surname}` : "A student";
            return (
              <div
                key={p.id}
                className="group flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/50"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-success/15 text-[10px] font-semibold text-success">
                    {initialsOf(student?.first_name, student?.surname)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">
                    <span className="font-semibold">{name}</span>{" "}
                    <span className="text-muted-foreground">paid</span>{" "}
                    <span className="font-medium">{fmtMoney(Number(p.amount || 0))}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {p.paid_at ? formatDistanceToNow(new Date(p.paid_at), { addSuffix: true }) : ""}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
