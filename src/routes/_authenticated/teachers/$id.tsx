import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Mail, Phone, MapPin, Briefcase, GraduationCap, Send, Trash2 } from "lucide-react";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStaff, useInviteStaff, useDeleteStaff } from "@/lib/staff/hooks";
import { useAuth } from "@/lib/auth/AuthProvider";
import { StaffStatusBadge, POSITION_LABELS } from "@/components/staff/StaffStatusBadge";
import { StaffAssignmentsPanel } from "@/components/staff/StaffAssignmentsPanel";
import { StaffAIInsights } from "@/components/staff/StaffAIInsights";

export const Route = createFileRoute("/_authenticated/teachers/$id")({
  head: () => ({ meta: [{ title: "Staff · Edvimia" }] }),
  component: StaffProfilePage,
});

function StaffProfilePage() {
  const { id } = Route.useParams();
  const { school } = useAuth();
  const navigate = useNavigate();
  const { data: s, isLoading } = useStaff(id);
  const invite = useInviteStaff();
  const deleteStaff = useDeleteStaff(school?.id ?? "");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (isLoading || !s) {
    return (
      <AppShell>
        <div className="grid min-h-[50vh] place-items-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  const initials = s.full_name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");

  async function handleResendInvite() {
    if (!s?.email || !school?.id) return;
    try {
      const result = await invite.mutateAsync({
        email: s.email,
        full_name: s.full_name,
        school_id: school.id,
      });
      if (result.invited) {
        toast.success("Invitation sent", { description: `A new invite email has been sent to ${s.email}.` });
      } else {
        toast.success("Access confirmed", { description: `${s.email} already has an account — teacher access is active.` });
      }
    } catch (err) {
      toast.error("Failed to resend invitation", { description: err instanceof Error ? err.message : "Unexpected error." });
    }
  }

  async function handleDelete() {
    try {
      await deleteStaff.mutateAsync(s!.id);
      toast.success("Staff member deleted");
      navigate({ to: "/teachers" });
    } catch (err) {
      toast.error("Failed to delete staff member", { description: err instanceof Error ? err.message : "Unexpected error." });
    }
  }

  return (
    <PermissionGate permission="view_teachers">
    <AppShell>
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link to="/teachers"><ArrowLeft className="h-4 w-4" /> Back to Staff</Link>
          </Button>
          <div className="flex items-center gap-2">
            {s.email && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={invite.isPending}
                onClick={handleResendInvite}
              >
                {invite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Resend Invitation
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4" /> Delete Teacher
            </Button>
          </div>
        </div>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {s.full_name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove this staff member from the directory. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDelete}
                disabled={deleteStaff.isPending}
              >
                {deleteStaff.isPending ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Card className="shadow-soft">
          <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={s.photo_url ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight">{s.full_name}</h1>
                  <StaffStatusBadge status={s.status} />
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {POSITION_LABELS[s.position]} · {s.staff_code}
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {s.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {s.email}</span>}
                  {s.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {s.phone}</span>}
                  {s.address && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.address}</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="rounded-lg flex-wrap h-auto">
            <TabsTrigger value="overview" className="rounded-md">Overview</TabsTrigger>
            <TabsTrigger value="assignments" className="rounded-md">Assignments</TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-md">Attendance</TabsTrigger>
            <TabsTrigger value="performance" className="rounded-md">Performance</TabsTrigger>
            <TabsTrigger value="leave" className="rounded-md">Leave</TabsTrigger>
            <TabsTrigger value="documents" className="rounded-md">Documents</TabsTrigger>
            <TabsTrigger value="ai" className="rounded-md">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard icon={Briefcase} title="Employment">
                <Row k="Department" v={s.department ?? "—"} />
                <Row k="Position" v={POSITION_LABELS[s.position]} />
                <Row k="Employment date" v={s.employment_date ?? "—"} />
                <Row k="Salary" v={s.salary ? `₦${Number(s.salary).toLocaleString()}` : "—"} />
              </InfoCard>
              <InfoCard icon={GraduationCap} title="Academic">
                <Row k="Qualification" v={s.qualification ?? "—"} />
                <Row k="Specialization" v={s.specialization ?? "—"} />
                <Row k="Username" v={s.username ?? "—"} />
                <Row k="Emergency contact" v={s.emergency_contact_name ? `${s.emergency_contact_name} · ${s.emergency_contact_phone ?? ""}` : "—"} />
              </InfoCard>
            </div>
          </TabsContent>

          <TabsContent value="assignments">
            {school && <StaffAssignmentsPanel staffId={s.id} schoolId={school.id} />}
          </TabsContent>

          <TabsContent value="attendance">
            <EmptyPanel title="Attendance" description="Daily check-in records for this staff member will appear here." />
          </TabsContent>
          <TabsContent value="performance">
            <EmptyPanel title="Performance" description="Performance appraisals and evaluations will appear here." />
          </TabsContent>
          <TabsContent value="leave">
            <EmptyPanel title="Leave" description="Leave requests and balances will appear here." />
          </TabsContent>
          <TabsContent value="documents">
            <EmptyPanel title="Documents" description="Contracts, certificates and other private staff documents." />
          </TabsContent>
          <TabsContent value="ai">
            <StaffAIInsights staff={[s]} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
    </PermissionGate>
  );
}

function InfoCard({ icon: Icon, title, children }: { icon: typeof Briefcase; title: string; children: React.ReactNode }) {
  return (
    <Card className="shadow-soft">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <div className="space-y-2">{children}</div>
      </CardContent>
    </Card>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-1.5 last:border-0">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{k}</span>
      <span className="text-sm font-medium text-right">{v}</span>
    </div>
  );
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <Card className="shadow-soft">
      <CardContent className="p-8 text-center">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}