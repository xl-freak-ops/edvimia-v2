import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { AlertCircle, Building2, Calendar, Settings as SettingsIcon, BookOpen, Award, Sparkles, Loader2, ShieldCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useSchool, useSubjects, useGradeScales, useSections } from "@/lib/school/hooks";
import { SchoolHeader } from "@/components/school/SchoolHeader";
import { ProfileForm } from "@/components/school/ProfileForm";
import { AcademicsPanel } from "@/components/school/AcademicsPanel";
import { SubjectsPanel } from "@/components/school/SubjectsPanel";
import { GradingPanel } from "@/components/school/GradingPanel";
import { SettingsPanel } from "@/components/school/SettingsPanel";
import { RolesPanel } from "@/components/school/RolesPanel";
import { seedDemoSchoolData } from "@/lib/school/seed";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/school")({
  component: SchoolPage,
});

function SchoolPage() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id ?? null;
  const school = useSchool(schoolId);
  const sections = useSections(schoolId);
  const subjects = useSubjects(schoolId);
  const grades = useGradeScales(schoolId);
  const qc = useQueryClient();
  const [seeding, setSeeding] = useState(false);

  if (!schoolId) {
    return (
      <div className="mx-auto max-w-2xl py-16">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-destructive" /> No school workspace</CardTitle>
            <CardDescription>Your account is not linked to a school yet. Complete onboarding first.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (school.isLoading || !school.data) {
    return <div className="grid place-items-center py-24 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  const isEmpty = !sections.data?.length && !subjects.data?.length && !grades.data?.length;

  const seed = async () => {
    setSeeding(true);
    try {
      await seedDemoSchoolData(schoolId);
      await qc.invalidateQueries({ queryKey: ["school", schoolId] });
      toast.success("Demo data loaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to seed");
    } finally { setSeeding(false); }
  };

  return (
    <PermissionGate permission="manage_school">
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">School management</h1>
          <p className="text-sm text-muted-foreground">Configure your school identity, academics, subjects and grading.</p>
        </div>
        {isEmpty && (
          <Button onClick={seed} disabled={seeding} variant="outline" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> {seeding ? "Loading…" : "Load demo data"}
          </Button>
        )}
      </div>

      <SchoolHeader school={school.data} />

      <Tabs defaultValue="profile" className="space-y-5">
        <TabsList className="flex w-full flex-wrap gap-1 sm:w-auto">
          <TabsTrigger value="profile" className="gap-1.5"><Building2 className="h-3.5 w-3.5" /> Profile</TabsTrigger>
          <TabsTrigger value="academics" className="gap-1.5"><Calendar className="h-3.5 w-3.5" /> Academics</TabsTrigger>
          <TabsTrigger value="subjects" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Subjects</TabsTrigger>
          <TabsTrigger value="grading" className="gap-1.5"><Award className="h-3.5 w-3.5" /> Grading</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5"><SettingsIcon className="h-3.5 w-3.5" /> Settings</TabsTrigger>
          <TabsTrigger value="roles" className="gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-5"><ProfileForm school={school.data} /></TabsContent>
        <TabsContent value="academics" className="space-y-5"><AcademicsPanel schoolId={schoolId} /></TabsContent>
        <TabsContent value="subjects" className="space-y-5"><SubjectsPanel schoolId={schoolId} /></TabsContent>
        <TabsContent value="grading" className="space-y-5"><GradingPanel schoolId={schoolId} /></TabsContent>
        <TabsContent value="settings" className="space-y-5"><SettingsPanel schoolId={schoolId} /></TabsContent>
        <TabsContent value="roles" className="space-y-5"><RolesPanel schoolId={schoolId} /></TabsContent>
      </Tabs>
    </div>
    </PermissionGate>
  );
}