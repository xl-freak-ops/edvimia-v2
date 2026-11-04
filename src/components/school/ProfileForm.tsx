import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { useUpdateSchool } from "@/lib/school/hooks";

const SCHOOL_TYPES = ["nursery", "primary", "secondary", "college", "mixed"] as const;
const CURRENCIES = ["NGN", "USD", "GHS", "KES", "ZAR", "EUR", "GBP"];
const TIMEZONES = ["Africa/Lagos", "Africa/Accra", "Africa/Nairobi", "Africa/Johannesburg", "UTC", "Europe/London"];

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function ProfileForm({ school }: { school: Tables<"schools"> }) {
  const update = useUpdateSchool(school.id);
  const [form, setForm] = useState(school);
  const [dirty, setDirty] = useState(false);

  // Only reset the form when the school identity changes (initial load or different school),
  // NOT on every background refetch after an autosave — that would overwrite mid-typing.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setForm(school);
    setDirty(false);
  }, [school.id]);

  const set = <K extends keyof Tables<"schools">>(k: K, v: Tables<"schools">[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
  };

  return (
    <div className="space-y-5">
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">School identity</CardTitle>
              <CardDescription>Name, motto, and classification.</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {update.isPending ? "Saving…" : dirty ? "Unsaved" : "All changes saved"}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="name" label="School name">
            <Input id="name" value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field id="type" label="School type">
            <Select value={form.school_type} onValueChange={(v) => set("school_type", v)}>
              <SelectTrigger id="type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SCHOOL_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field id="motto" label="Motto">
              <Textarea id="motto" rows={2} value={form.motto ?? ""} onChange={(e) => set("motto", e.target.value)} placeholder="Knowledge, Discipline, Excellence" />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Contact & location</CardTitle>
          <CardDescription>How parents and the public reach the school.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="email" label="Email"><Input id="email" type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field id="phone" label="Phone"><Input id="phone" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field id="website" label="Website"><Input id="website" value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} placeholder="https://" /></Field>
          <Field id="address" label="Address"><Input id="address" value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} /></Field>
          <Field id="country" label="Country"><Input id="country" value={form.country ?? ""} onChange={(e) => set("country", e.target.value)} /></Field>
          <Field id="state" label="State"><Input id="state" value={form.state ?? ""} onChange={(e) => set("state", e.target.value)} /></Field>
          <Field id="lga" label="LGA"><Input id="lga" value={form.lga ?? ""} onChange={(e) => set("lga", e.target.value)} /></Field>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Leadership</CardTitle>
          <CardDescription>Public-facing roles for the school.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field id="principal" label="Principal"><Input id="principal" value={form.principal_name ?? ""} onChange={(e) => set("principal_name", e.target.value)} /></Field>
          <Field id="vp" label="Vice Principal"><Input id="vp" value={form.vice_principal_name ?? ""} onChange={(e) => set("vice_principal_name", e.target.value)} /></Field>
          <Field id="admin" label="Administrator"><Input id="admin" value={form.administrator_name ?? ""} onChange={(e) => set("administrator_name", e.target.value)} /></Field>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Operations</CardTitle>
          <CardDescription>Daily schedule, locale, and branding colors.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="start" label="School start time"><Input id="start" type="time" value={form.school_time_start ?? ""} onChange={(e) => set("school_time_start", e.target.value)} /></Field>
          <Field id="end" label="School end time"><Input id="end" type="time" value={form.school_time_end ?? ""} onChange={(e) => set("school_time_end", e.target.value)} /></Field>
          <Field id="resumption" label="Resumption date"><Input id="resumption" type="date" value={form.resumption_date ?? ""} onChange={(e) => set("resumption_date", e.target.value)} /></Field>
          <Field id="closing" label="Closing date"><Input id="closing" type="date" value={form.closing_date ?? ""} onChange={(e) => set("closing_date", e.target.value)} /></Field>
          <Field id="tz" label="Timezone">
            <Select value={form.timezone ?? "Africa/Lagos"} onValueChange={(v) => set("timezone", v)}>
              <SelectTrigger id="tz"><SelectValue /></SelectTrigger>
              <SelectContent>{TIMEZONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field id="cur" label="Currency">
            <Select value={form.currency ?? "NGN"} onValueChange={(v) => set("currency", v)}>
              <SelectTrigger id="cur"><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field id="primary" label="Primary color">
            <div className="flex items-center gap-2">
              <Input id="primary" type="color" className="h-10 w-14 p-1" value={form.primary_color ?? "#2563EB"} onChange={(e) => set("primary_color", e.target.value)} />
              <Input value={form.primary_color ?? ""} onChange={(e) => set("primary_color", e.target.value)} className="font-mono uppercase" />
            </div>
          </Field>
          <Field id="secondary" label="Secondary color">
            <div className="flex items-center gap-2">
              <Input id="secondary" type="color" className="h-10 w-14 p-1" value={form.secondary_color ?? "#F97316"} onChange={(e) => set("secondary_color", e.target.value)} />
              <Input value={form.secondary_color ?? ""} onChange={(e) => set("secondary_color", e.target.value)} className="font-mono uppercase" />
            </div>
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() => {
            update.mutate(form, { onSuccess: () => { setDirty(false); toast.success("School profile saved"); } });
          }}
          disabled={update.isPending}
          className="gap-2"
        >
          <Save className="h-4 w-4" /> Save now
        </Button>
      </div>
    </div>
  );
}