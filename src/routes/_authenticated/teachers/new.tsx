import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { StaffWizard } from "@/components/staff/StaffWizard";
import { PermissionGate } from "@/components/auth/PermissionGate";

export const Route = createFileRoute("/_authenticated/teachers/new")({
  head: () => ({ meta: [{ title: "Add Staff · Edvimia" }] }),
  component: NewStaffPage,
});

function NewStaffPage() {
  return (
    <PermissionGate permission="manage_teachers">
      <AppShell>
        <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Add Staff</h1>
            <p className="text-sm text-muted-foreground">
              Onboard a new teacher or administrator with their personal, employment and account details.
            </p>
          </div>
          <StaffWizard />
        </div>
      </AppShell>
    </PermissionGate>
  );
}