/**
 * PermissionGate
 * ──────────────────────────────────────────────────────────────────────────
 * Wraps a page (or section) and redirects to /access-denied if the current
 * user's roles do not include the required permission.
 *
 * Usage:
 *   <PermissionGate permission="view_students">
 *     <StudentsPage />
 *   </PermissionGate>
 *
 * The gate is intentionally lightweight so it can be nested freely.
 * Route-level gates provide the primary enforcement; component-level gates
 * can be used to hide individual sections (e.g. admin-only action buttons).
 */

import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { hasPermission, type Permission } from "@/lib/auth/permissions";

interface Props {
  /** The permission required to render `children`. */
  permission: Permission;
  children: React.ReactNode;
  /**
   * If true, renders nothing (no spinner, no redirect) instead of redirecting
   * when access is denied. Useful for inline UI sections that should simply
   * disappear for unauthorized roles rather than triggering a page redirect.
   */
  silent?: boolean;
}

export function PermissionGate({ permission, children, silent = false }: Props) {
  const { roles, loading } = useAuth();
  const navigate = useNavigate();

  const permitted = hasPermission(roles, permission);

  React.useEffect(() => {
    if (!loading && !permitted && !silent) {
      navigate({ to: "/access-denied" });
    }
  }, [loading, permitted, silent, navigate]);

  if (loading) {
    if (silent) return null;
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!permitted) return null;

  return <>{children}</>;
}
