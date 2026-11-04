import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";

export const Route = createFileRoute("/_authenticated")({
  // Auth state lives in the browser — gate client-side to avoid SSR redirects.
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { loading, userId } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && !userId) {
      navigate({ to: "/login" });
    }
  }, [loading, userId, navigate]);

  if (loading || !userId) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  return <Outlet />;
}