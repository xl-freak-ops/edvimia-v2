import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useStaffList, useStaffLeave, useStaffAttendance } from "@/lib/staff/hooks";
import { StaffStats } from "@/components/staff/StaffStats";
import { StaffDirectory } from "@/components/staff/StaffDirectory";
import { StaffAIInsights } from "@/components/staff/StaffAIInsights";
import { PermissionGate } from "@/components/auth/PermissionGate";

export const Route = createFileRoute("/_authenticated/teachers/")({
  head: () => ({ meta: [{ title: "Staff · Edvimia" }] }),
  component: TeachersPage,
});

function TeachersPage() {
  const { school } = useAuth();
  const schoolId = school?.id;
  const { data: staff = [], isLoading } = useStaffList(schoolId);
  const { data: leave = [] } = useStaffLeave(schoolId);
  const { data: attendance = [] } = useStaffAttendance(schoolId);

  return (
    <PermissionGate permission="view_teachers">
      <AppShell>
        <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Staff & Teachers</h1>
            <p className="text-sm text-muted-foreground">
              Manage the entire teaching and administrative workforce for {school?.name ?? "your school"}.
            </p>
          </div>

          {isLoading ? (
            <div className="grid place-items-center py-24 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <>
              <StaffStats staff={staff} leave={leave} />
              <StaffAIInsights staff={staff} attendance={attendance} />
              <StaffDirectory staff={staff} />
            </>
          )}
        </div>
      </AppShell>
    </PermissionGate>
  );
}