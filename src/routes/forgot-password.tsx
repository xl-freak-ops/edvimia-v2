import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Loader2, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password · Edvimia" }] }),
  component: ForgotPasswordPage,
});

type Step = "request" | "verify" | "done";

function ForgotPasswordPage() {
  const [mode, setMode] = React.useState<"email" | "phone">("email");
  const [step, setStep] = React.useState<Step>("request");
  const [identifier, setIdentifier] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "email") {
        const parsed = z.string().email().safeParse(identifier);
        if (!parsed.success) {
          toast.error("Enter a valid email address");
          return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) {
          toast.error("Could not send reset link", { description: error.message });
          return;
        }
        setStep("done");
      } else {
        const parsed = z.string().regex(/^\+?[0-9\s\-()]{7,20}$/).safeParse(identifier);
        if (!parsed.success) {
          toast.error("Enter a valid phone number");
          return;
        }
        const { error } = await supabase.auth.signInWithOtp({ phone: parsed.data });
        if (error) {
          toast.error("Could not send verification code", { description: error.message });
          return;
        }
        setStep("verify");
        toast.success("Verification code sent");
      }
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndReset(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("Enter the 6-digit code");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        phone: identifier,
        token: otp,
        type: "sms",
      });
      if (verifyErr) {
        toast.error("Invalid code", { description: verifyErr.message });
        return;
      }
      const { error: updErr } = await supabase.auth.updateUser({ password });
      if (updErr) {
        toast.error("Could not update password", { description: updErr.message });
        return;
      }
      setStep("done");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <AuthLayout title="You're all set" subtitle="Your password reset request has been processed.">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-semibold">
            {mode === "email" ? "Check your inbox" : "Password updated"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "email"
              ? `We've sent a secure reset link to ${identifier}. Follow the link to set a new password.`
              : "You can now sign in with your new password."}
          </p>
          <Button asChild className="mt-6 h-11 w-full rounded-lg">
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (step === "verify") {
    return (
      <AuthLayout title="Verify your phone" subtitle={`Enter the 6-digit code sent to ${identifier}.`}>
        <form onSubmit={verifyAndReset} className="space-y-5">
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newpw">New password</Label>
            <Input
              id="newpw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-lg"
            />
          </div>
          <Button className="h-11 w-full rounded-lg" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set new password"}
          </Button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Reset it via email or phone — we'll guide you through it."
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </Link>
      }
    >
      <Tabs value={mode} onValueChange={(v) => setMode(v as "email" | "phone")}>
        <TabsList className="mb-5 grid w-full grid-cols-2 rounded-lg">
          <TabsTrigger value="email" className="rounded-md">
            <Mail className="mr-1.5 h-3.5 w-3.5" /> Email
          </TabsTrigger>
          <TabsTrigger value="phone" className="rounded-md">
            <Phone className="mr-1.5 h-3.5 w-3.5" /> Phone
          </TabsTrigger>
        </TabsList>

        <form onSubmit={sendReset} className="space-y-4">
          <TabsContent value="email" className="mt-0 space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@school.edu"
              value={mode === "email" ? identifier : ""}
              onChange={(e) => setIdentifier(e.target.value)}
              className="h-11 rounded-lg"
            />
          </TabsContent>
          <TabsContent value="phone" className="mt-0 space-y-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+234 800 000 0000"
              value={mode === "phone" ? identifier : ""}
              onChange={(e) => setIdentifier(e.target.value)}
              className="h-11 rounded-lg"
            />
          </TabsContent>

          <Button className="h-11 w-full rounded-lg shadow-soft" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset instructions"}
          </Button>
        </form>
      </Tabs>
    </AuthLayout>
  );
}