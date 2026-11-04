// Auth callback — handles email confirmation and staff invite links.
// Supabase redirects here with ?code= (PKCE flow) after the user clicks
// a confirmation or invite link in their email.
import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { dashboardRouteFor, primaryRole } from "@/lib/auth/roles";

const searchSchema = z.object({
  code: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
  // Supabase also sends token_hash + type for some flows
  token_hash: z.string().optional(),
  type: z.string().optional(),
});

export const Route = createFileRoute("/auth/callback")({
  validateSearch: searchSchema,
  ssr: false,
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const { code, error, error_description } = Route.useSearch();
  const [status, setStatus] = React.useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;

    async function handle() {
      // Supabase sent back an explicit error (e.g. expired link)
      if (error) {
        if (!cancelled) {
          setErrorMsg(error_description ?? error);
          setStatus("error");
        }
        return;
      }

      // PKCE flow: exchange the one-time code for a session
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exErr) {
          if (!cancelled) {
            setErrorMsg(exErr.message);
            setStatus("error");
          }
          return;
        }
      }

      // Refresh auth context so roles/profile are loaded
      await refresh();

      if (cancelled) return;

      // Determine which dashboard to send them to
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate({ to: "/login" });
        return;
      }

      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      const userRoles = (roleRows ?? []).map((r) => r.role) as Parameters<typeof primaryRole>[0];
      const role = primaryRole(userRoles) ?? "school_admin";
      const { to, params } = dashboardRouteFor(role);

      // For invited users (first login), show a welcome toast
      toast.success("Welcome to Edvimia!", { description: "Your account is ready." });
      navigate({ to, params });
    }

    handle();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <div className="max-w-sm space-y-3">
          <h1 className="text-xl font-semibold text-foreground">This link has expired</h1>
          <p className="text-sm text-muted-foreground">
            {errorMsg || "The confirmation or invite link is no longer valid."}
          </p>
          <p className="text-sm text-muted-foreground">
            Please request a new one or contact your school administrator.
          </p>
          <a
            href="/login"
            className="inline-block mt-2 text-sm font-medium text-primary hover:underline"
          >
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Verifying your link…</p>
    </div>
  );
}
