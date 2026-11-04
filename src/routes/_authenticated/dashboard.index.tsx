import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/AuthProvider";
import { dashboardRouteFor, primaryRole } from "@/lib/auth/roles";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const { roles, loading } = useAuth();
  if (loading) return null;
  const r = primaryRole(roles);
  if (!r) return <Navigate to="/recover" />;
  const { to, params } = dashboardRouteFor(r);
  return <Navigate to={to} params={params} />;
}