import { useEffect, useState } from "react";
import { Bell, ClipboardCheck, Mail, MessageSquare, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSchoolSettings, useUpsertSettings } from "@/lib/school/hooks";

type AttendanceCfg = { mark_by: "subject" | "day"; late_threshold_minutes: number; auto_notify_parents: boolean };
type ResultsCfg = { ca_total: number; exam_total: number; show_position: boolean };
type PromotionCfg = { pass_mark: number; max_failed_subjects: number; auto_promote: boolean };
type SmsCfg = { provider: string; sender_id: string; enabled: boolean };
type EmailCfg = { from_address: string; reply_to: string; enabled: boolean };

const DEFAULTS: { attendance: AttendanceCfg; results: ResultsCfg; promotion: PromotionCfg; sms: SmsCfg; email: EmailCfg } = {
  attendance: { mark_by: "day", late_threshold_minutes: 15, auto_notify_parents: false },
  results: { ca_total: 40, exam_total: 60, show_position: true },
  promotion: { pass_mark: 50, max_failed_subjects: 2, auto_promote: false },
  sms: { provider: "Termii", sender_id: "Edvimia", enabled: false },
  email: { from_address: "no-reply@school.edvimia.app", reply_to: "", enabled: false },
};

export function SettingsPanel({ schoolId }: { schoolId: string }) {
  const q = useSchoolSettings(schoolId);
  const save = useUpsertSettings(schoolId);
  const [state, setState] = useState(DEFAULTS);

  useEffect(() => {
    if (q.data) {
      setState({
        attendance: { ...DEFAULTS.attendance, ...(q.data.attendance as Partial<AttendanceCfg>) },
        results: { ...DEFAULTS.results, ...(q.data.results as Partial<ResultsCfg>) },
        promotion: { ...DEFAULTS.promotion, ...(q.data.promotion as Partial<PromotionCfg>) },
        sms: { ...DEFAULTS.sms, ...(q.data.sms as Partial<SmsCfg>) },
        email: { ...DEFAULTS.email, ...(q.data.email as Partial<EmailCfg>) },
      });
    }
  }, [q.data]);

  const submit = async () => {
    await save.mutateAsync(state);
    toast.success("Settings saved");
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-4 w-4 text-primary" /> Attendance</CardTitle>
            <CardDescription>How attendance is captured each day.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div><Label>Mark by</Label><p className="text-xs text-muted-foreground">Per subject or per day.</p></div>
              <div className="flex rounded-md border p-0.5">
                {(["day","subject"] as const).map((v) => (
                  <button key={v} onClick={() => setState((s) => ({ ...s, attendance: { ...s.attendance, mark_by: v } }))}
                    className={`rounded px-3 py-1 text-xs font-semibold capitalize ${state.attendance.mark_by === v ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{v}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Late threshold (minutes)</Label>
              <Input type="number" value={state.attendance.late_threshold_minutes} onChange={(e) => setState((s) => ({ ...s, attendance: { ...s.attendance, late_threshold_minutes: Number(e.target.value) } }))} />
            </div>
            <div className="flex items-center justify-between">
              <div><Label>Notify parents automatically</Label><p className="text-xs text-muted-foreground">Send absence alerts.</p></div>
              <Switch checked={state.attendance.auto_notify_parents} onCheckedChange={(v) => setState((s) => ({ ...s, attendance: { ...s.attendance, auto_notify_parents: v } }))} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4 text-primary" /> Results</CardTitle>
            <CardDescription>How scores are split between CA and exam.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>CA total</Label><Input type="number" value={state.results.ca_total} onChange={(e) => setState((s) => ({ ...s, results: { ...s.results, ca_total: Number(e.target.value) } }))} /></div>
              <div className="space-y-1.5"><Label>Exam total</Label><Input type="number" value={state.results.exam_total} onChange={(e) => setState((s) => ({ ...s, results: { ...s.results, exam_total: Number(e.target.value) } }))} /></div>
            </div>
            <div className="flex items-center justify-between">
              <div><Label>Show position on report cards</Label><p className="text-xs text-muted-foreground">Rank within class.</p></div>
              <Switch checked={state.results.show_position} onCheckedChange={(v) => setState((s) => ({ ...s, results: { ...s.results, show_position: v } }))} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-primary" /> Promotion rules</CardTitle>
            <CardDescription>Drives end-of-session promotion logic.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Pass mark (%)</Label><Input type="number" value={state.promotion.pass_mark} onChange={(e) => setState((s) => ({ ...s, promotion: { ...s.promotion, pass_mark: Number(e.target.value) } }))} /></div>
              <div className="space-y-1.5"><Label>Max failed subjects</Label><Input type="number" value={state.promotion.max_failed_subjects} onChange={(e) => setState((s) => ({ ...s, promotion: { ...s.promotion, max_failed_subjects: Number(e.target.value) } }))} /></div>
            </div>
            <div className="flex items-center justify-between">
              <div><Label>Auto-promote eligible students</Label><p className="text-xs text-muted-foreground">Skip manual review when criteria met.</p></div>
              <Switch checked={state.promotion.auto_promote} onCheckedChange={(v) => setState((s) => ({ ...s, promotion: { ...s.promotion, auto_promote: v } }))} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="h-4 w-4 text-primary" /> SMS (placeholder)</CardTitle>
            <CardDescription>Connect an SMS gateway later.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Provider</Label><Input value={state.sms.provider} onChange={(e) => setState((s) => ({ ...s, sms: { ...s.sms, provider: e.target.value } }))} /></div>
              <div className="space-y-1.5"><Label>Sender ID</Label><Input value={state.sms.sender_id} onChange={(e) => setState((s) => ({ ...s, sms: { ...s.sms, sender_id: e.target.value } }))} /></div>
            </div>
            <div className="flex items-center justify-between"><Label>Enabled</Label><Switch checked={state.sms.enabled} onCheckedChange={(v) => setState((s) => ({ ...s, sms: { ...s.sms, enabled: v } }))} /></div>
          </CardContent>
        </Card>

        <Card className="shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Mail className="h-4 w-4 text-primary" /> Email (placeholder)</CardTitle>
            <CardDescription>Outbound transactional email settings.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>From address</Label><Input value={state.email.from_address} onChange={(e) => setState((s) => ({ ...s, email: { ...s.email, from_address: e.target.value } }))} /></div>
            <div className="space-y-1.5"><Label>Reply-to</Label><Input value={state.email.reply_to} onChange={(e) => setState((s) => ({ ...s, email: { ...s.email, reply_to: e.target.value } }))} /></div>
            <div className="flex items-center justify-between sm:col-span-2"><Label>Enabled</Label><Switch checked={state.email.enabled} onCheckedChange={(v) => setState((s) => ({ ...s, email: { ...s.email, enabled: v } }))} /></div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={submit} disabled={save.isPending}>Save settings</Button>
      </div>
    </div>
  );
}