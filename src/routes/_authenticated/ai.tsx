import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth/AuthProvider";
import { AIIntelligenceCenter } from "@/components/ai/AIIntelligenceCenter";
import { PermissionGate } from "@/components/auth/PermissionGate";

export const Route = createFileRoute("/_authenticated/ai")({
  head: () => ({ meta: [{ title: "Edvi AI · Edvimia" }] }),
  component: AIPage,
});

function AIPage() {
  const { school } = useAuth();
  return (
    <PermissionGate permission="view_ai">
      <AppShell>
        <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edvi · AI Intelligence Center</h1>
            <p className="text-sm text-muted-foreground">
              Cross-module AI insights drawn from real data across {school?.name ?? "your school"}.
            </p>
          </div>
          <AIIntelligenceCenter />
        </div>
      </AppShell>
    </PermissionGate>
  );
}
