import * as React from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Mail, Phone, Lock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { dashboardRouteFor, primaryRole, type AppRole } from "@/lib/auth/roles";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · Edvimia" }] }),
  component: LoginPage,
});

const emailSchema = z.string().trim().email("Enter a valid email address").max(255);
const phoneSchema = z.string().trim().regex(/^\+?[0-9\s\-()]{7,20}$/, "Enter a valid phone number");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(128);

function LoginPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { refresh } = useAuth();
  const [mode, setMode] = React.useState<"email" | "phone">("email");
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{ identifier?: string; password?: string }>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const idResult = (mode === "email" ? emailSchema : phoneSchema).safeParse(identifier);
    const pwResult = passwordSchema.safeParse(password);
    if (!idResult.success || !pwResult.success) {
      setErrors({
        identifier: idResult.success ? undefined : idResult.error.issues[0]?.message,
        password: pwResult.success ? undefined : pwResult.error.issues[0]?.message,
      });
      return;
    }

    setLoading(true);
    try {
      const { error } =
        mode === "email"
          ? await supabase.auth.signInWithPassword({ email: idResult.data, password: pwResult.data })
          : await supabase.auth.signInWithPassword({ phone: idResult.data, password: pwResult.data });

      if (error) {
        toast.error("Sign in failed", { description: error.message });
        return;
      }
      await refresh();
      // Pull fresh user/roles then route
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        const { data: rows } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", u.user.id);
        const roles = ((rows ?? []) as { role: AppRole }[]).map((r) => r.role);
        const target: AppRole = primaryRole(roles) ?? "student";
        toast.success("Welcome back");
        await router.invalidate();
        const { to, params } = dashboardRouteFor(target);
        navigate({ to, params });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Edvimia workspace to continue."
      footer={
        <span className="text-muted-foreground">
          New to Edvimia?{" "}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Create a school account
          </Link>
        </span>
      }
    >
      <Tabs value={mode} onValueChange={(v) => setMode(v as "email" | "phone")} className="w-full">
        <TabsList className="mb-5 grid w-full grid-cols-2 rounded-lg">
          <TabsTrigger value="email" className="rounded-md">
            <Mail className="mr-1.5 h-3.5 w-3.5" /> Email
          </TabsTrigger>
          <TabsTrigger value="phone" className="rounded-md">
            <Phone className="mr-1.5 h-3.5 w-3.5" /> Phone
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <TabsContent value="email" className="mt-0">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@school.edu"
                value={mode === "email" ? identifier : ""}
                onChange={(e) => setIdentifier(e.target.value)}
                className="h-11 rounded-lg"
                aria-invalid={!!errors.identifier}
              />
              {errors.identifier && (
                <p className="text-xs font-medium text-destructive">{errors.identifier}</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="phone" className="mt-0">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+234 800 000 0000"
                value={mode === "phone" ? identifier : ""}
                onChange={(e) => setIdentifier(e.target.value)}
                className="h-11 rounded-lg"
                aria-invalid={!!errors.identifier}
              />
              {errors.identifier && (
                <p className="text-xs font-medium text-destructive">{errors.identifier}</p>
              )}
            </div>
          </TabsContent>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-lg pl-9 pr-10"
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs font-medium text-destructive">{errors.password}</p>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
            Remember me on this device
          </label>

          <Button type="submit" className="h-11 w-full rounded-lg shadow-soft" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </Tabs>
    </AuthLayout>
  );
}