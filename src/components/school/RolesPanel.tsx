import { useState } from "react";
import { Loader2, ShieldCheck, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/school/EmptyState";
import { toast } from "sonner";
import { useSchoolUsers, useAssignRole, useRevokeRole } from "@/lib/school/rolesHooks";
import { ROLE_LABEL } from "@/lib/auth/roles";
import type { AppRole } from "@/lib/auth/roles";

// Roles that can be assigned/revoked within the school management UI
// (super_admin is platform-level; parent/student are assigned via their own flows)
const ASSIGNABLE_ROLES: AppRole[] = [
  "school_admin",
  "principal",
  "vice_principal",
  "form_teacher",
  "subject_teacher",
];

const ROLE_COLOR: Record<AppRole, string> = {
  super_admin:     "bg-purple-100 text-purple-700",
  school_admin:    "bg-blue-100 text-blue-700",
  principal:       "bg-indigo-100 text-indigo-700",
  vice_principal:  "bg-cyan-100 text-cyan-700",
  form_teacher:    "bg-teal-100 text-teal-700",
  subject_teacher: "bg-green-100 text-green-700",
  bursar:          "bg-amber-100 text-amber-700",
  account_officer: "bg-yellow-100 text-yellow-700",
  librarian:       "bg-lime-100 text-lime-700",
  receptionist:    "bg-sky-100 text-sky-700",
  other_staff:     "bg-slate-100 text-slate-600",
  parent:          "bg-orange-100 text-orange-700",
  student:         "bg-gray-100 text-gray-600",
};

export function RolesPanel({ schoolId }: { schoolId: string }) {
  const { data: users, isLoading, error } = useSchoolUsers(schoolId);
  const assign = useAssignRole(schoolId);
  const revoke = useRevokeRole(schoolId);

  // Per-user selected role for the assign dropdown
  const [pending, setPending] = useState<Record<string, AppRole>>({});

  if (isLoading) {
    return (
      <div className="grid place-items-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="shadow-soft">
        <CardContent className="py-8 text-center text-sm text-destructive">
          Could not load users: {(error as Error).message}
        </CardContent>
      </Card>
    );
  }

  if (!users?.length) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="No users yet"
        description="Users who sign up and join this school will appear here so you can assign their roles."
      />
    );
  }

  const handleAssign = async (userId: string) => {
    const role = pending[userId];
    if (!role) return;
    try {
      await assign.mutateAsync({ userId, role });
      setPending((p) => { const n = { ...p }; delete n[userId]; return n; });
      toast.success(`Role assigned: ${ROLE_LABEL[role]}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleRevoke = async (userId: string, role: AppRole) => {
    try {
      await revoke.mutateAsync({ userId, role });
      toast.success(`Role removed: ${ROLE_LABEL[role]}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" /> Roles &amp; Permissions
          </CardTitle>
          <CardDescription>
            Assign or remove roles for staff members at this school. The last school administrator
            cannot be removed.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {users.map((user) => {
              const manageable = (user.roles ?? []).filter((r) =>
                ASSIGNABLE_ROLES.includes(r),
              ) as AppRole[];
              const unassigned = ASSIGNABLE_ROLES.filter(
                (r) => !(user.roles ?? []).includes(r),
              );

              return (
                <div key={user.user_id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Identity */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium leading-tight">
                      {user.full_name ?? "—"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{user.email ?? "—"}</p>

                    {/* Current roles */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(user.roles ?? []).length === 0 && (
                        <span className="text-xs text-muted-foreground italic">No roles</span>
                      )}
                      {(user.roles ?? []).map((role) => (
                        <span
                          key={role}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_COLOR[role] ?? "bg-muted text-muted-foreground"}`}
                        >
                          {ROLE_LABEL[role]}
                          {ASSIGNABLE_ROLES.includes(role) && (
                            <button
                              onClick={() => handleRevoke(user.user_id, role)}
                              disabled={revoke.isPending}
                              aria-label={`Remove ${ROLE_LABEL[role]}`}
                              className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 disabled:opacity-50"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Assign new role */}
                  {unassigned.length > 0 && (
                    <div className="flex shrink-0 items-center gap-2">
                      <Select
                        value={pending[user.user_id] ?? ""}
                        onValueChange={(v) =>
                          setPending((p) => ({ ...p, [user.user_id]: v as AppRole }))
                        }
                      >
                        <SelectTrigger className="h-8 w-44 text-xs">
                          <SelectValue placeholder="Add role…" />
                        </SelectTrigger>
                        <SelectContent>
                          {unassigned.map((r) => (
                            <SelectItem key={r} value={r} className="text-xs">
                              {ROLE_LABEL[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        className="h-8 text-xs"
                        disabled={!pending[user.user_id] || assign.isPending}
                        onClick={() => handleAssign(user.user_id)}
                      >
                        Assign
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
