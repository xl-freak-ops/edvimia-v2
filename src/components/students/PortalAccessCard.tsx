import * as React from "react";
import { GraduationCap, Users, Mail, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useGuardians } from "@/lib/students/hooks";
import { useInvitePortalUser } from "@/lib/students/hooks";
import type { Tables } from "@/integrations/supabase/types";

type Student = Tables<"students">;

export function PortalAccessCard({
  student,
  schoolId,
}: {
  student: Student;
  schoolId: string;
}) {
  const { data: guardians = [] } = useGuardians(student.id);
  const invite = useInvitePortalUser();

  const [sent, setSent] = React.useState<Set<string>>(new Set());

  const send = async (opts: {
    email: string;
    full_name: string;
    portal_role: "parent" | "student";
    relationship?: string;
    key: string;
  }) => {
    try {
      await invite.mutateAsync({
        email: opts.email,
        full_name: opts.full_name,
        school_id: schoolId,
        student_id: student.id,
        portal_role: opts.portal_role,
        relationship: opts.relationship,
      });
      setSent((s) => new Set(s).add(opts.key));
      toast.success(`Invite sent to ${opts.email}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send invite");
    }
  };

  const studentEmail = student.email;
  const studentName = `${student.first_name} ${student.surname}`;
  const guardianWithEmail = guardians.filter((g) => !!g.email);

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Portal access</CardTitle>
        <p className="text-xs text-muted-foreground">
          Send an email invite so parents and students can log in and see results, attendance, and messages.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">

        {/* Student portal */}
        <div className="rounded-lg border p-3">
          <div className="mb-2 flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary">
              <GraduationCap className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-sm font-medium">Student portal</p>
              <p className="text-xs text-muted-foreground">Student sees their own results, timetable &amp; homework</p>
            </div>
          </div>
          {studentEmail ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                {studentEmail}
              </div>
              {sent.has("student") ? (
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-[11px]">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Invited
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={invite.isPending}
                  onClick={() => send({
                    email: studentEmail,
                    full_name: studentName,
                    portal_role: "student",
                    key: "student",
                  })}
                >
                  {invite.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                  Send invite
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-amber-600">
              <AlertCircle className="h-3.5 w-3.5" />
              No email on file — add one in the student&apos;s profile to enable this
            </div>
          )}
        </div>

        {/* Parent portal — one row per guardian with an email */}
        <div className="rounded-lg border p-3">
          <div className="mb-2 flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-violet-500/10 text-violet-600">
              <Users className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-sm font-medium">Parent portal</p>
              <p className="text-xs text-muted-foreground">Guardian sees child&apos;s results, attendance &amp; finance</p>
            </div>
          </div>
          {guardianWithEmail.length === 0 ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-600">
              <AlertCircle className="h-3.5 w-3.5" />
              No guardians have an email address on file
            </div>
          ) : (
            <ul className="space-y-2">
              {guardianWithEmail.map((g) => {
                const key = `parent-${g.id}`;
                return (
                  <li key={g.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{g.full_name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{g.email}</span>
                      </div>
                    </div>
                    {sent.has(key) ? (
                      <Badge variant="outline" className="shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-[11px]">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Invited
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 h-7 text-xs"
                        disabled={invite.isPending}
                        onClick={() => send({
                          email: g.email!,
                          full_name: g.full_name,
                          portal_role: "parent",
                          relationship: g.relationship ?? undefined,
                          key,
                        })}
                      >
                        {invite.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                        Send invite
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
