import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set a new password · Edvimia" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error("Could not update password", { description: error.message });
        return;
      }
      setDone(true);
      setTimeout(() => navigate({ to: "/login" }), 1500);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthLayout title="Password updated" subtitle="Redirecting to sign in…">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-7 w-7" />
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose something strong — at least 8 characters."
      footer={<Link to="/login" className="text-muted-foreground hover:text-foreground">Back to sign in</Link>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="pw">New password</Label>
          <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-lg" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cpw">Confirm password</Label>
          <Input id="cpw" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11 rounded-lg" />
        </div>
        <Button className="h-11 w-full rounded-lg shadow-soft" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
        </Button>
      </form>
    </AuthLayout>
  );
}