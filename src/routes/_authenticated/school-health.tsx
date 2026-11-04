import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth/AuthProvider";
import { SchoolHealthDashboard } from "@/components/school-health/SchoolHealthDashboard";
import { PermissionGate } from "@/components/auth/PermissionGate";

export const Route = createFileRoute("/_authenticated/school-health")({
  head: () => ({ meta: [{ title: "School Health · Edvimia" }] }),
  component: SchoolHealthPage,
});

function SchoolHealthPage() {
  const { school } = useAuth();
  return (
    <PermissionGate permission="view_school_health">
      <AppShell>
        <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">School Health Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              A composite, real-time health score for {school?.name ?? "your school"}.
            </p>
          </div>
          <SchoolHealthDashboard />
        </div>
      </AppShell>
    </PermissionGate>
  );
}
