import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LogOut, Mail, Phone, ShieldCheck, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ROLE_LABEL } from "@/lib/auth/roles";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile · Edvimia" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, school, roles, email, signOut, refresh } = useAuth();
  const [name, setName] = React.useState(profile?.full_name ?? "");
  const [phone, setPhone] = React.useState(profile?.phone ?? "");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
  }, [profile?.full_name, profile?.phone]);

  const initials =
    (profile?.full_name ?? email ?? "U")
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "U";

  async function save() {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name, phone })
      .eq("id", profile.id);
    setSaving(false);
    if (error) return toast.error("Could not save profile", { description: error.message });
    await refresh();
    toast.success("Profile updated");
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your personal information and session.</p>
        </div>

        <Card className="overflow-hidden border-border/70 shadow-soft">
          <div className="h-28 bg-gradient-to-br from-primary via-primary to-accent-brand" />
          <CardContent className="-mt-12 space-y-4 p-6">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <Avatar className="h-24 w-24 ring-4 ring-background">
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? ""} />}
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">{profile?.full_name ?? "Unnamed user"}</h2>
                  <p className="text-sm text-muted-foreground">{email}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {roles.map((r) => (
                      <Badge key={r} variant="secondary" className="gap-1 font-medium">
                        <ShieldCheck className="h-3 w-3" /> {ROLE_LABEL[r]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={signOut} className="rounded-lg">
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-border/70 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Personal details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-lg" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={email ?? ""} disabled className="h-11 rounded-lg pl-9" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 rounded-lg pl-9" />
                  </div>
                </div>
              </div>
              <Button onClick={save} disabled={saving} className="rounded-lg shadow-soft">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">School</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/40 p-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{school?.name ?? "—"}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {school ? `${school.school_type} · ${school.country}` : "Not assigned"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}