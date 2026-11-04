import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LifeBuoy, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { dashboardRouteFor, primaryRole } from "@/lib/auth/roles";

export const Route = createFileRoute("/recover")({
  head: () => ({ meta: [{ title: "Account recovery · Edvimia" }] }),
  component: RecoverPage,
});

function RecoverPage() {
  const { userId, refresh } = useAuth();
  const navigate = useNavigate();
  const [schoolName, setSchoolName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState("");

  async function restoreAdmin() {
    if (!userId) return toast.error("Please sign in first.");
    setLoading(true);
    const { error } = await supabase.rpc("ensure_my_workspace", { _school_name: schoolName });
    setLoading(false);
    if (error) return toast.error("Recovery failed", { description: error.message });
    toast.success("Administrator access restored");
    await refresh();
    // Route to primary dashboard
    const { data: rows } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roles = (rows ?? []).map((r: { role: string }) => r.role) as never[];
    const target = primaryRole(roles as never) ?? "school_admin";
    const { to, params } = dashboardRouteFor(target);
    navigate({ to, params });
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail) return;
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error("Could not send reset email", { description: error.message });
    toast.success("Recovery email sent");
  }

  return (
    <AuthLayout
      title="Account recovery"
      subtitle="Restore administrator access or send a password recovery email."
      footer={
        <span className="text-muted-foreground">
          Remembered your details?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        </span>
      }
    >
      <div className="space-y-6">
        <div className="rounded-xl border border-border/70 bg-card/60 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <LifeBuoy className="h-4 w-4 text-primary" /> Restore administrator access
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            {userId
              ? "You're signed in. This will ensure your account has a School Administrator role and a school workspace."
              : "Sign in first, then return here to restore access."}
          </p>
          <div className="space-y-2">
            <Label htmlFor="sn">School name (optional)</Label>
            <Input
              id="sn"
              placeholder="My School"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="h-11 rounded-lg"
            />
            <Button onClick={restoreAdmin} disabled={loading || !userId} className="h-11 w-full rounded-lg shadow-soft">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Restore my access"}
            </Button>
          </div>
        </div>

        <form onSubmit={sendReset} className="rounded-xl border border-border/70 bg-card/60 p-4 space-y-2">
          <div className="mb-1 text-sm font-semibold">Send password recovery email</div>
          <Label htmlFor="re">Email address</Label>
          <Input
            id="re"
            type="email"
            placeholder="you@school.edu"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            className="h-11 rounded-lg"
          />
          <Button type="submit" variant="outline" className="h-11 w-full rounded-lg">
            Send recovery email
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}