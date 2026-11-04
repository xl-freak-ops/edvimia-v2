/**
 * Edvimia Centralized Permission Map
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for every role ↔ permission relationship.
 *
 * HOW TO ADD A NEW MODULE
 * ───────────────────────
 * 1. Add a `Permission` value to the union below (e.g. `"view_library"`).
 * 2. Add it to the relevant roles in `ROLE_PERMISSIONS`.
 * 3. Use `<PermissionGate permission="view_library">` in the route component.
 * 4. Optionally add the route to `ROUTE_PERMISSIONS` for sidebar filtering.
 *
 * No other files need touching.
 */

import type { AppRole } from "./roles";

// ── Permission catalog (existing modules only) ────────────────────────────────

export type Permission =
  | "view_dashboard"      // /dashboard — all authenticated users
  | "view_students"       // /students, /students/$id — view directory & profiles
  | "manage_students"     // /students/new — admit / edit / delete
  | "view_teachers"       // /teachers, /teachers/$id — view staff list & profiles
  | "manage_teachers"     // /teachers/new — invite / edit / delete
  | "view_attendance"     // /attendance — view attendance records
  | "manage_attendance"   // take / edit attendance entries
  | "view_results"        // /results — view exam / CA results
  | "manage_results"      // enter / publish results
  | "view_timetable"      // /timetable — view schedule
  | "view_finance"        // /finance — view fees, invoices, payments
  | "manage_finance"      // record fees, mark payments, apply discounts
  | "view_communication"  // /communication — announcements & messages
  | "send_communication"  // post announcements / send messages
  | "homework"            // homework module — assign / view homework
  | "view_reports"        // /reports — school-wide report centre
  | "view_analytics"      // /analytics — cross-module analytics
  | "view_school_health"  // /school-health — school health dashboard
  | "view_library"        // /library — library catalogue & loans
  | "manage_library"      // issue / return / manage books
  | "view_ai"             // /ai — Edvi AI assistant
  | "manage_school"       // /school — school settings & configuration
  | "manage_roles";       // assign / revoke roles (role management)

// ── All permissions — used for super_admin ───────────────────────────────────

const ALL: Permission[] = [
  "view_dashboard",
  "view_students",    "manage_students",
  "view_teachers",    "manage_teachers",
  "view_attendance",  "manage_attendance",
  "view_results",     "manage_results",
  "view_timetable",
  "view_finance",     "manage_finance",
  "view_communication", "send_communication",
  "homework",
  "view_library",     "manage_library",
  "view_reports",
  "view_analytics",
  "view_school_health",
  "view_ai",
  "manage_school",
  "manage_roles",
];

// ── Role → Permission map ─────────────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<AppRole, readonly Permission[]> = {

  // ── Platform owner ──────────────────────────────────────────────────────────
  super_admin: ALL,

  // ── School administration ───────────────────────────────────────────────────
  // Principal, Vice Principal, and School Administrator share the same scope.
  // They can do everything within their school; only super_admin can go further.
  school_admin: [
    "view_dashboard",
    "view_students",    "manage_students",
    "view_teachers",    "manage_teachers",
    "view_attendance",  "manage_attendance",
    "view_results",     "manage_results",
    "view_timetable",
    "view_finance",     "manage_finance",
    "view_communication", "send_communication",
    "view_reports",
    "view_analytics",
    "view_school_health",
    "view_ai",
    "manage_school",
    "manage_roles",
  ],

  principal: [
    "view_dashboard",
    "view_students",    "manage_students",
    "view_teachers",    "manage_teachers",
    "view_attendance",  "manage_attendance",
    "view_results",     "manage_results",
    "view_timetable",
    "view_finance",     "manage_finance",
    "view_communication", "send_communication",
    "view_reports",
    "view_analytics",
    "view_school_health",
    "view_ai",
    "manage_school",
    "manage_roles",
  ],

  vice_principal: [
    "view_dashboard",
    "view_students",    "manage_students",
    "view_teachers",    "manage_teachers",
    "view_attendance",  "manage_attendance",
    "view_results",     "manage_results",
    "view_timetable",
    "view_finance",     "manage_finance",
    "view_communication", "send_communication",
    "view_reports",
    "view_analytics",
    "view_school_health",
    "view_ai",
    "manage_school",
    "manage_roles",
  ],

  // ── Academic staff ──────────────────────────────────────────────────────────
  // Form teacher manages a whole class — can see the student directory.
  // Subject teacher only sees attendance/results for their subjects.
  form_teacher: [
    "view_dashboard",
    "view_students",                            // class students directory
    "view_attendance",  "manage_attendance",
    "view_results",     "manage_results",
    "view_communication", "send_communication", // announcements
    "homework",
  ],

  subject_teacher: [
    "view_dashboard",
    "view_attendance",  "manage_attendance",    // their classes only
    "view_results",     "manage_results",       // their subjects only
    "view_communication", "send_communication", // announcements
    "homework",
  ],

  // ── Finance ─────────────────────────────────────────────────────────────────
  // Bursar has full finance access; account officer is read-only.
  bursar: [
    "view_dashboard",
    "view_finance",     "manage_finance",
  ],

  account_officer: [
    "view_dashboard",
    "view_finance",                     // read-only finance
  ],

  // ── Library ─────────────────────────────────────────────────────────────────
  // Library module is not yet built — permission is declared, no route yet.
  librarian: [
    "view_dashboard",
    "view_library",     "manage_library",
  ],

  // ── Front desk ──────────────────────────────────────────────────────────────
  // Receptionist handles admissions and new student registration.
  receptionist: [
    "view_dashboard",
    "view_students",    "manage_students",
  ],

  // ── Other staff ─────────────────────────────────────────────────────────────
  // No module access by default; profile & settings always available via System nav.
  other_staff: [
    "view_dashboard",
  ],

  // ── Parent portal ───────────────────────────────────────────────────────────
  // Read-only access to their children's data — enforced by RLS + component logic.
  // No manage_* permissions: parents cannot edit academic records.
  parent: [
    "view_dashboard",
    "view_results",                     // children's results (read-only)
    "view_attendance",                  // children's attendance (read-only)
    "view_finance",                     // fees & invoices
    "homework",                         // view homework
    "view_communication",               // announcements + messages
  ],

  // ── Student portal ──────────────────────────────────────────────────────────
  // Read-only access to own records — enforced by RLS + component logic.
  // No manage_* permissions: students cannot edit any school data.
  student: [
    "view_dashboard",
    "view_timetable",
    "homework",                         // view homework
    "view_attendance",                  // own attendance (read-only)
    "view_results",                     // own results (read-only)
    "view_communication",               // announcements
  ],
};

// ── Route → permission map ───────────────────────────────────────────────────
// Associates URL prefixes with the permission required to access them.
// Used by the sidebar to determine which nav items to render.
// Individual routes ALSO enforce this via <PermissionGate> for defence-in-depth.

export const ROUTE_PERMISSIONS: Array<{ prefix: string; permission: Permission }> = [
  { prefix: "/students",      permission: "view_students"      },
  { prefix: "/teachers",      permission: "view_teachers"      },
  { prefix: "/attendance",    permission: "view_attendance"    },
  { prefix: "/results",       permission: "view_results"       },
  { prefix: "/timetable",     permission: "view_timetable"     },
  { prefix: "/finance",       permission: "view_finance"       },
  { prefix: "/communication", permission: "view_communication" },
  { prefix: "/reports",       permission: "view_reports"       },
  { prefix: "/analytics",     permission: "view_analytics"     },
  { prefix: "/school-health", permission: "view_school_health" },
  { prefix: "/ai",            permission: "view_ai"            },
  { prefix: "/school",        permission: "manage_school"      },
];

// ── Utilities ────────────────────────────────────────────────────────────────

/** Build a merged permission set from an array of roles (user may hold multiple). */
export function getPermissions(roles: AppRole[]): Set<Permission> {
  const set = new Set<Permission>();
  for (const role of roles) {
    for (const perm of ROLE_PERMISSIONS[role] ?? []) {
      set.add(perm);
    }
  }
  return set;
}

/** Check whether a set of roles grants a specific permission. */
export function hasPermission(roles: AppRole[], permission: Permission): boolean {
  for (const role of roles) {
    if ((ROLE_PERMISSIONS[role] as readonly string[]).includes(permission)) return true;
  }
  return false;
}

/** Check whether a user holds a specific role. */
export function hasRole(roles: AppRole[], role: AppRole): boolean {
  return roles.includes(role);
}

/** Check whether a user holds at least one of the given roles. */
export function hasAnyRole(roles: AppRole[], ...allowed: AppRole[]): boolean {
  return allowed.some((r) => roles.includes(r));
}

/** Return the permission required to access a given pathname, or null. */
export function permissionForPath(pathname: string): Permission | null {
  for (const { prefix, permission } of ROUTE_PERMISSIONS) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return permission;
    }
  }
  return null;
}
