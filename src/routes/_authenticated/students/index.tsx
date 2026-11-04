import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useStudents } from "@/lib/students/hooks";
import { StudentsStats } from "@/components/students/StudentsStats";
import { StudentsBreakdown } from "@/components/students/StudentsBreakdown";
import { StudentSmartAlerts } from "@/components/students/StudentSmartAlerts";
import { StudentDirectory } from "@/components/students/StudentDirectory";
import { PermissionGate } from "@/components/auth/PermissionGate";

export const Route = createFileRoute("/_authenticated/students/")({
  component: StudentsPage,
});

function StudentsPage() {
  const { school } = useAuth();
  const schoolId = school?.id;
  const { data: students = [], isLoading } = useStudents(schoolId);

  return (
    <PermissionGate permission="view_students">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground">
            Manage admissions, records, and the entire student lifecycle for {school?.name ?? "your school"}.
          </p>
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-24 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <>
            <StudentsStats students={students} />
            <StudentSmartAlerts students={students} />
            <StudentsBreakdown students={students} />
            <StudentDirectory students={students} />
          </>
        )}
      </div>
    </PermissionGate>
  );
}