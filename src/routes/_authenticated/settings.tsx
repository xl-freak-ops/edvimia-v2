import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/components/theme-provider";
import { supabase } from "@/integrations/supabase/client";
import { DeleteAccountCard } from "@/components/settings/DeleteAccountCard";
import { useAuth } from "@/lib/auth/AuthProvider";
import { LifeBuoy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings · Edvimia" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { profile, email, refresh } = useAuth();
  const [language, setLanguage] = React.useState("en");
  const [notifEmail, setNotifEmail] = React.useState(true);
  const [notifPush, setNotifPush] = React.useState(true);
  const [notifSms, setNotifSms] = React.useState(false);

  const [pw, setPw] = React.useState("");
  const [confirmPw, setConfirmPw] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [recovering, setRecovering] = React.useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters");
    if (pw !== confirmPw) return toast.error("Passwords do not match");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSaving(false);
    if (error) return toast.error("Could not update password", { description: error.message });
    setPw("");
    setConfirmPw("");
    toast.success("Password updated");
  }

  async function restoreAccess() {
    setRecovering(true);
    const { error } = await supabase.rpc("ensure_my_workspace", { _school_name: "" });
    setRecovering(false);
    if (error) return toast.error("Could not restore access", { description: error.message });
    await refresh();
    toast.success("Access restored — School Administrator role assigned");
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage account, notifications, and appearance.</p>
        </div>

        <Tabs defaultValue="security" className="space-y-4">
          <TabsList className="rounded-lg flex-wrap h-auto">
            <TabsTrigger value="profile" className="rounded-md">Profile</TabsTrigger>
            <TabsTrigger value="security" className="rounded-md">Security</TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-md">Notifications</TabsTrigger>
            <TabsTrigger value="appearance" className="rounded-md">Appearance</TabsTrigger>
            <TabsTrigger value="language" className="rounded-md">Language</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-border/70 shadow-soft">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your Edvimia account details.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Full name</Label>
                  <Input value={profile?.full_name ?? ""} readOnly className="h-11 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={email ?? ""} readOnly className="h-11 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-border/70 shadow-soft">
              <CardHeader>
                <CardTitle>Change password</CardTitle>
                <CardDescription>Use a strong, unique password.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={changePassword} className="grid max-w-md gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="np">New password</Label>
                    <Input id="np" type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="h-11 rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cp">Confirm new password</Label>
                    <Input id="cp" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="h-11 rounded-lg" />
                  </div>
                  <Button className="rounded-lg shadow-soft w-fit" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-border/70 shadow-soft">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Choose how Edvimia keeps you informed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Toggle label="Email notifications" desc="Daily digest and important alerts." value={notifEmail} onChange={setNotifEmail} />
                <Toggle label="Push notifications" desc="In-app and browser alerts." value={notifPush} onChange={setNotifPush} />
                <Toggle label="SMS notifications" desc="Critical alerts only." value={notifSms} onChange={setNotifSms} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card className="border-border/70 shadow-soft">
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>Choose your preferred appearance.</CardDescription>
              </CardHeader>
              <CardContent className="grid max-w-sm gap-3 sm:grid-cols-2">
                {(["light", "dark"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      theme === t ? "border-primary ring-2 ring-primary/30 shadow-soft" : "border-border hover:bg-accent"
                    }`}
                  >
                    <div className={`mb-2 h-16 rounded-lg ${t === "light" ? "bg-gradient-to-br from-white to-slate-100" : "bg-gradient-to-br from-slate-900 to-slate-800"}`} />
                    <div className="text-sm font-semibold capitalize">{t}</div>
                    <div className="text-xs text-muted-foreground">{t === "light" ? "Bright & clean" : "Premium navy"}</div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="language">
            <Card className="border-border/70 shadow-soft">
              <CardHeader>
                <CardTitle>Language</CardTitle>
                <CardDescription>Set your interface language.</CardDescription>
              </CardHeader>
              <CardContent className="max-w-sm">
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="h-11 rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LifeBuoy className="h-4 w-4 text-primary" /> Account recovery</CardTitle>
            <CardDescription>
              Restore your School Administrator role and school workspace if permissions become corrupted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={restoreAccess} disabled={recovering} variant="outline" className="rounded-lg">
              {recovering ? <Loader2 className="h-4 w-4 animate-spin" /> : "Restore my access"}
            </Button>
          </CardContent>
        </Card>

        <DeleteAccountCard />
      </div>
    </AppShell>
  );
}

function Toggle({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-card/60 p-4">
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}