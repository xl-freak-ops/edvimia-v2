import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth/AuthProvider";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { PermissionGate } from "@/components/auth/PermissionGate";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics · Edvimia" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { school } = useAuth();
  return (
    <PermissionGate permission="view_analytics">
      <AppShell>
        <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Cross-module trends and performance data for {school?.name ?? "your school"}.
            </p>
          </div>
          <AnalyticsDashboard />
        </div>
      </AppShell>
    </PermissionGate>
  );
}
