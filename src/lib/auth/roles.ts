// ── Role definitions ──────────────────────────────────────────────────────────
// AppRole is the canonical list of roles in the system. It must stay in sync
// with the `app_role` PostgreSQL enum (supabase/migrations/).

export type AppRole =
  // Platform
  | "super_admin"
  // School administration
  | "school_admin"
  | "principal"
  | "vice_principal"
  // Academic staff
  | "form_teacher"
  | "subject_teacher"
  // Specialist staff
  | "bursar"
  | "account_officer"
  | "librarian"
  | "receptionist"
  | "other_staff"
  // Portals
  | "parent"
  | "student";

export const ROLE_LABEL: Record<AppRole, string> = {
  super_admin:     "Edvimia Super Admin",
  school_admin:    "School Administrator",
  principal:       "Principal",
  vice_principal:  "Vice Principal",
  form_teacher:    "Form Teacher",
  subject_teacher: "Subject Teacher",
  bursar:          "Bursar",
  account_officer: "Account Officer",
  librarian:       "Librarian",
  receptionist:    "Receptionist",
  other_staff:     "Staff Member",
  parent:          "Parent",
  student:         "Student",
};

export const ROLE_SLUG: Record<AppRole, string> = {
  super_admin:     "super-admin",
  school_admin:    "school-admin",
  principal:       "principal",
  vice_principal:  "vice-principal",
  form_teacher:    "form-teacher",
  subject_teacher: "subject-teacher",
  bursar:          "bursar",
  account_officer: "account-officer",
  librarian:       "librarian",
  receptionist:    "receptionist",
  other_staff:     "staff",
  parent:          "parent",
  student:         "student",
};

export const SLUG_TO_ROLE: Record<string, AppRole> = Object.fromEntries(
  Object.entries(ROLE_SLUG).map(([k, v]) => [v, k as AppRole]),
) as Record<string, AppRole>;

// Priority — used to pick the "primary" dashboard when a user holds multiple roles.
// Higher priority roles appear earlier.
const ORDER: AppRole[] = [
  "super_admin",
  "school_admin",
  "principal",
  "vice_principal",
  "form_teacher",
  "subject_teacher",
  "bursar",
  "account_officer",
  "librarian",
  "receptionist",
  "other_staff",
  "parent",
  "student",
];

export function primaryRole(roles: AppRole[]): AppRole | null {
  for (const r of ORDER) if (roles.includes(r)) return r;
  return null;
}

export function dashboardPathFor(role: AppRole): string {
  return `/dashboard/${ROLE_SLUG[role]}`;
}

// Typed helper for TanStack Navigate / navigate({ to, params })
export function dashboardRouteFor(role: AppRole): { to: "/dashboard/$role"; params: { role: string } } {
  return { to: "/dashboard/$role", params: { role: ROLE_SLUG[role] } };
}

// Role group helpers — use these instead of hard-coding role lists in components.
export const SCHOOL_ADMIN_ROLES = new Set<AppRole>(["super_admin", "school_admin", "principal", "vice_principal"]);
export const ACADEMIC_ROLES = new Set<AppRole>(["form_teacher", "subject_teacher"]);
export const FINANCE_ROLES = new Set<AppRole>(["bursar", "account_officer"]);
export const PORTAL_ROLES = new Set<AppRole>(["parent", "student"]);
export const STAFF_ROLES = new Set<AppRole>([
  "school_admin", "principal", "vice_principal",
  "form_teacher", "subject_teacher",
  "bursar", "account_officer", "librarian", "receptionist", "other_staff",
]);
