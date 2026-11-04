import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Cake, Hash, Home, IdCard, Loader2, Mail, MapPin, Phone, Stethoscope } from "lucide-react";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useStudent, useStatusHistory } from "@/lib/students/hooks";
import { StudentStatusBadge } from "@/components/students/StudentStatusBadge";
import { StudentActionsMenu } from "@/components/students/StudentActionsMenu";
import { GuardiansPanel } from "@/components/students/GuardiansPanel";
import { PortalAccessCard } from "@/components/students/PortalAccessCard";
import { DocumentsPanel } from "@/components/students/DocumentsPanel";
import { StudentAIInsights } from "@/components/students/StudentAIInsights";
import { EmptyState } from "@/components/school/EmptyState";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/students/$id")({
  component: StudentProfilePage,
});

function initials(f?: string | null, s?: string | null) {
  return `${(f ?? "").charAt(0)}${(s ?? "").charAt(0)}`.toUpperCase() || "S";
}

function StudentProfilePage() {
  const { id } = Route.useParams();
  const { school } = useAuth();
  const { data: student, isLoading } = useStudent(id);
  const { data: history = [] } = useStatusHistory(id);

  if (isLoading || !student) {
    return (
      <div className="grid place-items-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const fullName = [student.surname, student.first_name, student.middle_name].filter(Boolean).join(" ");

  return (
    <PermissionGate permission="view_students">
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="gap-2" asChild>
        <Link to="/students"><ArrowLeft className="h-4 w-4" /> Back to directory</Link>
      </Button>

      {/* Profile header */}
      <Card className="shadow-soft overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/15 via-primary/5 to-accent-brand/15" />
        <CardContent className="p-6">
          <div className="-mt-16 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar className="h-24 w-24 border-4 border-background shadow-elevated">
                <AvatarImage src={student.photo_url ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {initials(student.first_name, student.surname)}
                </AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <h1 className="text-2xl font-bold tracking-tight">{fullName}</h1>
                <p className="text-sm text-muted-foreground">
                  {student.admission_number} · {student.student_code}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StudentStatusBadge status={student.status} />
                  <span className="text-xs text-muted-foreground">
                    Admitted {new Date(student.admission_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <StudentActionsMenu student={student} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="behaviour">Behaviour</TabsTrigger>
          <TabsTrigger value="medical">Medical</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="ai">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="shadow-soft lg:col-span-2">
              <CardHeader><CardTitle className="text-sm">Personal information</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <Info icon={IdCard} label="Gender" value={student.gender} />
                <Info icon={Cake} label="Date of birth" value={student.date_of_birth ?? "—"} />
                <Info icon={Hash} label="Nationality" value={student.nationality ?? "—"} />
                <Info icon={MapPin} label="State / LGA" value={[student.state_of_origin, student.lga].filter(Boolean).join(" / ") || "—"} />
                <Info icon={Home} label="Address" value={student.home_address ?? "—"} />
                <Info icon={Mail} label="Religion" value={student.religion ?? "—"} />
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardHeader><CardTitle className="text-sm">Guardians</CardTitle></CardHeader>
              <CardContent>
                {school?.id && (
                  <GuardiansPanel studentId={student.id} schoolId={school.id} />
                )}
              </CardContent>
            </Card>
            {school?.id && (
              <PortalAccessCard student={student} schoolId={school.id} />
            )}
          </div>
          <Card className="shadow-soft">
            <CardHeader><CardTitle className="text-sm">Status history</CardTitle></CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground">No status changes recorded.</p>
              ) : (
                <ul className="space-y-3">
                  {history.map((h) => (
                    <li key={h.id} className="flex items-start gap-3 text-sm">
                      <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium capitalize">{h.action}</div>
                        <div className="text-xs text-muted-foreground">
                          {h.from_status ?? "—"} → {h.to_status ?? "—"} · {new Date(h.created_at).toLocaleString()}
                        </div>
                        {h.note && <p className="mt-1 text-xs text-muted-foreground">{h.note}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academic">
          <Card className="shadow-soft">
            <CardHeader><CardTitle className="text-sm">Class placement</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <Info icon={Hash} label="Class" value={student.classes?.name ?? "Unassigned"} />
              <Info icon={Hash} label="Arm" value={student.class_arms?.name ?? "—"} />
              <Info icon={Hash} label="House" value={student.house ?? "—"} />
              <Info icon={Hash} label="Transport" value={student.transport_route ?? "—"} />
              <Info icon={Hash} label="Hostel" value={student.hostel ?? "—"} />
              <Info icon={Hash} label="Previous school" value={student.previous_school ?? "—"} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <EmptyState icon={FileText} title="Attendance module coming soon" description="Once daily attendance is captured, live records will appear here." />
        </TabsContent>
        <TabsContent value="results">
          <EmptyState icon={FileText} title="Results module coming soon" description="CA and exam scores will be summarised here." />
        </TabsContent>
        <TabsContent value="finance">
          <EmptyState icon={FileText} title="Finance module coming soon" description="Invoices, receipts and outstanding balances will appear here." />
        </TabsContent>
        <TabsContent value="behaviour">
          <EmptyState icon={FileText} title="Behaviour reports coming soon" description="Behavioural incidents and merits will be tracked here." />
        </TabsContent>

        <TabsContent value="medical">
          <Card className="shadow-soft">
            <CardHeader><CardTitle className="text-sm">Medical information</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Info icon={Stethoscope} label="Blood group" value={student.blood_group ?? "—"} />
              <Info icon={Stethoscope} label="Genotype" value={student.genotype ?? "—"} />
              <Info icon={Stethoscope} label="Medical conditions" value={student.medical_conditions ?? "None recorded"} />
              <Info icon={Stethoscope} label="Disabilities" value={student.disabilities ?? "None recorded"} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          {school?.id && <DocumentsPanel studentId={student.id} schoolId={school.id} />}
        </TabsContent>

        <TabsContent value="communication">
          <EmptyState icon={Phone} title="No messages yet" description="Emails, SMS and WhatsApp threads with guardians will appear here." />
        </TabsContent>

        <TabsContent value="ai">
          <StudentAIInsights student={student} />
        </TabsContent>
      </Tabs>
    </div>
    </PermissionGate>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Cake; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card/50 p-3">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-medium capitalize">{value}</div>
      </div>
    </div>
  );
}