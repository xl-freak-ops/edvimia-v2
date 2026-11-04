import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { dashboardRouteFor } from "@/lib/auth/roles";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create your school account · Edvimia" }] }),
  component: SignupPage,
});

const schoolTypes = ["Primary School", "Secondary School", "K-12 / Combined", "International School", "Other"];

const schoolSchema = z.object({
  schoolName: z.string().trim().min(2, "School name is required").max(120),
  schoolType: z.string().min(1, "Select a school type"),
  country: z.string().trim().min(2, "Country is required").max(80),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  schoolEmail: z.string().trim().email("Enter a valid school email").max(255),
  schoolPhone: z.string().trim().regex(/^\+?[0-9\s\-()]{7,20}$/, "Enter a valid phone number"),
});
const adminSchema = z
  .object({
    adminName: z.string().trim().min(2, "Full name is required").max(120),
    adminEmail: z.string().trim().email("Enter a valid email").max(255),
    adminPhone: z.string().trim().regex(/^\+?[0-9\s\-()]{7,20}$/, "Enter a valid phone number"),
    password: z.string().min(8, "Password must be at least 8 characters").max(128),
    confirm: z.string(),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

type Step = 1 | 2;

function SignupPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [step, setStep] = React.useState<Step>(1);
  const [loading, setLoading] = React.useState(false);

  const [form, setForm] = React.useState({
    schoolName: "",
    schoolType: "",
    country: "",
    state: "",
    address: "",
    schoolEmail: "",
    schoolPhone: "",
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    password: "",
    confirm: "",
    acceptTerms: false,
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function update<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function next() {
    const r = schoolSchema.safeParse(form);
    if (!r.success) {
      const e: Record<string, string> = {};
      r.error.issues.forEach((i) => (e[i.path[0] as string] = i.message));
      setErrors(e);
      return;
    }
    setErrors({});
    setStep(2);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = adminSchema.safeParse(form);
    if (!r.success) {
      const e2: Record<string, string> = {};
      r.error.issues.forEach((i) => (e2[i.path[0] as string] = i.message));
      setErrors(e2);
      return;
    }
    setLoading(true);
    try {
      // 1) Create the auth user — trigger creates profile + assigns 'school_admin'
      const { data: signUp, error: signUpErr } = await supabase.auth.signUp({
        email: form.adminEmail,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: form.adminName,
            phone: form.adminPhone,
            initial_role: "school_admin",
          },
        },
      });
      if (signUpErr) {
        toast.error("Could not create account", { description: signUpErr.message });
        return;
      }
      if (!signUp.user) {
        toast.error("Unexpected error creating account");
        return;
      }

      // Ensure an active session so the SECURITY DEFINER RPC sees auth.uid().
      if (!signUp.session) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: form.adminEmail,
          password: form.password,
        });
        if (signInErr) {
          toast.error("Signed up, but could not sign in", { description: signInErr.message });
          return;
        }
      }

      // Atomically create school + link profile + assign school_admin role.
      const { error: rpcErr } = await supabase.rpc("create_school_workspace", {
        _name: form.schoolName,
        _school_type: form.schoolType,
        _country: form.country,
        _state: form.state || undefined,
        _address: form.address || undefined,
        _email: form.schoolEmail,
        _phone: form.schoolPhone,
      });
      if (rpcErr) {
        toast.error("Could not create school", { description: rpcErr.message });
        return;
      }

      await refresh();
      toast.success("School account created", { description: "Welcome to Edvimia." });
      {
        const { to, params } = dashboardRouteFor("school_admin");
        navigate({ to, params });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your school account"
      subtitle={step === 1 ? "Tell us about your school." : "Set up the administrator account."}
      footer={
        <span className="text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </span>
      }
    >
      <ProgressBar step={step} />

      {step === 1 ? (
        <div className="space-y-4">
          <Field label="School name" error={errors.schoolName}>
            <Input value={form.schoolName} onChange={(e) => update("schoolName", e.target.value)} className="h-11 rounded-lg" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="School type" error={errors.schoolType}>
              <Select value={form.schoolType} onValueChange={(v) => update("schoolType", v)}>
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {schoolTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Country" error={errors.country}>
              <Input value={form.country} onChange={(e) => update("country", e.target.value)} className="h-11 rounded-lg" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="State / Region" error={errors.state}>
              <Input value={form.state} onChange={(e) => update("state", e.target.value)} className="h-11 rounded-lg" />
            </Field>
            <Field label="Address" error={errors.address}>
              <Input value={form.address} onChange={(e) => update("address", e.target.value)} className="h-11 rounded-lg" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="School email" error={errors.schoolEmail}>
              <Input type="email" value={form.schoolEmail} onChange={(e) => update("schoolEmail", e.target.value)} className="h-11 rounded-lg" />
            </Field>
            <Field label="School phone" error={errors.schoolPhone}>
              <Input type="tel" value={form.schoolPhone} onChange={(e) => update("schoolPhone", e.target.value)} className="h-11 rounded-lg" />
            </Field>
          </div>
          <Button onClick={next} className="h-11 w-full rounded-lg shadow-soft">
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Administrator full name" error={errors.adminName}>
            <Input value={form.adminName} onChange={(e) => update("adminName", e.target.value)} className="h-11 rounded-lg" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Administrator email" error={errors.adminEmail}>
              <Input type="email" value={form.adminEmail} onChange={(e) => update("adminEmail", e.target.value)} className="h-11 rounded-lg" />
            </Field>
            <Field label="Administrator phone" error={errors.adminPhone}>
              <Input type="tel" value={form.adminPhone} onChange={(e) => update("adminPhone", e.target.value)} className="h-11 rounded-lg" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Password" error={errors.password}>
              <Input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} className="h-11 rounded-lg" />
            </Field>
            <Field label="Confirm password" error={errors.confirm}>
              <Input type="password" value={form.confirm} onChange={(e) => update("confirm", e.target.value)} className="h-11 rounded-lg" />
            </Field>
          </div>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border bg-card/60 p-3 text-sm">
            <Checkbox checked={form.acceptTerms} onCheckedChange={(v) => update("acceptTerms", !!v)} className="mt-0.5" />
            <span className="text-muted-foreground">
              I accept the Edvimia <span className="font-medium text-foreground">Terms of Service</span> and{" "}
              <span className="font-medium text-foreground">Privacy Policy</span>.
            </span>
          </label>
          {errors.acceptTerms && <p className="text-xs font-medium text-destructive">{errors.acceptTerms}</p>}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-11 rounded-lg">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button type="submit" className="h-11 flex-1 rounded-lg shadow-soft" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>Create school account <CheckCircle2 className="h-4 w-4" /></>
              )}
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}

function ProgressBar({ step }: { step: Step }) {
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span className={step >= 1 ? "text-foreground" : ""}>1 · School details</span>
        <span className={step >= 2 ? "text-foreground" : ""}>2 · Administrator</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent-brand transition-all"
          style={{ width: step === 1 ? "50%" : "100%" }}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}