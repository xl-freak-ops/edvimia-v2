import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { dashboardRouteFor, primaryRole } from "@/lib/auth/roles";

export const Route = createFileRoute("/")({
  // Auth state lives in localStorage — render client-side to choose the redirect.
  ssr: false,
  head: () => ({
    meta: [
      { title: "Edvimia · The AI School Operating System" },
      { name: "description", content: "Edvimia is the AI-powered operating system for primary and secondary schools." },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  const { loading, userId, roles } = useAuth();
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!userId) return <Navigate to="/welcome" />;
  const r = primaryRole(roles);
  if (!r) return <Navigate to="/recover" />;
  const { to, params } = dashboardRouteFor(r);
  return <Navigate to={to} params={params} />;
}