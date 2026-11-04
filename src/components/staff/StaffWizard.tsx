import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2, Upload, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  useCreateStaff,
  useInviteStaff,
  uploadStaffAsset,
  generateStaffCode,
  suggestUsername,
} from "@/lib/staff/hooks";
import { POSITION_LABELS } from "./StaffStatusBadge";
import type { Database, TablesInsert } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type Gender = Database["public"]["Enums"]["staff_gender"];
type Position = Database["public"]["Enums"]["staff_position"];
type Status = Database["public"]["Enums"]["staff_status"];

type State = {
  photo?: File;
  photoPreview?: string;
  full_name: string;
  gender: Gender;
  date_of_birth: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  qualification: string;
  specialization: string;
  department: string;
  position: Position;
  employment_date: string;
  salary: string;
  staff_code: string;
  username: string;
  status: Status;
};

const STEPS = [
  { key: "personal", title: "Personal Information" },
  { key: "contact", title: "Contact & Emergency" },
  { key: "employment", title: "Employment" },
  { key: "account", title: "Account & Role" },
  { key: "review", title: "Review & Submit" },
];

const TEACHING: Position[] = ["principal", "vice_principal", "form_teacher", "subject_teacher"];

function empty(): State {
  return {
    full_name: "",
    gender: "male",
    date_of_birth: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    qualification: "",
    specialization: "",
    department: "",
    position: "subject_teacher",
    employment_date: new Date().toISOString().slice(0, 10),
    salary: "",
    staff_code: generateStaffCode(),
    username: "",
    status: "active",
  };
}

export function StaffWizard() {
  const navigate = useNavigate();
  const { school } = useAuth();
  const schoolId = school?.id ?? "";
  const create = useCreateStaff(schoolId);
  const invite = useInviteStaff();

  const [step, setStep] = useState(0);
  const [state, setState] = useState<State>(empty);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof State>(k: K, v: State[K]) => setState((s) => ({ ...s, [k]: v }));

  const canNext = useMemo(() => {
    if (step === 0) return state.full_name.trim().length > 1;
    if (step === 1) return true;
    if (step === 2) return !!state.position && !!state.employment_date;
    if (step === 3) return !!state.staff_code;
    return true;
  }, [step, state]);

  const onPhoto = (file: File) => {
    const url = URL.createObjectURL(file);
    setState((s) => ({ ...s, photo: file, photoPreview: url }));
  };

  async function submit() {
    if (!schoolId) return toast.error("No school context");
    setSaving(true);
    try {
      let photoUrl: string | undefined;
      if (state.photo) {
        const { signedUrl } = await uploadStaffAsset(schoolId, state.staff_code, "photo", state.photo);
        photoUrl = signedUrl;
      }
      const payload: TablesInsert<"staff"> = {
        school_id: schoolId,
        staff_code: state.staff_code,
        full_name: state.full_name.trim(),
        gender: state.gender,
        date_of_birth: state.date_of_birth || null,
        phone: state.phone || null,
        whatsapp: state.whatsapp || null,
        email: state.email || null,
        address: state.address || null,
        emergency_contact_name: state.emergency_contact_name || null,
        emergency_contact_phone: state.emergency_contact_phone || null,
        qualification: state.qualification || null,
        specialization: state.specialization || null,
        department: state.department || null,
        position: state.position,
        employment_date: state.employment_date || null,
        salary: state.salary ? Number(state.salary) : null,
        username: state.username || suggestUsername(state.full_name),
        status: state.status,
        is_teaching: TEACHING.includes(state.position),
        photo_url: photoUrl,
      };
      const created = await create.mutateAsync(payload);

      // Send email invite so the staff member can set a password and log in.
      // Skip silently if no email was provided.
      const emailAddr = state.email.trim();
      if (emailAddr) {
        try {
          const result = await invite.mutateAsync({
            email: emailAddr,
            full_name: state.full_name.trim(),
            school_id: schoolId,
            position: state.position,
          });
          if (result.invited) {
            toast.success("Staff member added", {
              description: `An invite email has been sent to ${emailAddr}.`,
            });
          } else {
            toast.success("Staff member added", {
              description: `${emailAddr} already has an account — teacher access has been granted.`,
            });
          }
        } catch (inviteErr) {
          // Don't block the user — record was saved; show a non-fatal warning
          toast.warning("Staff member saved, but invite failed", {
            description: inviteErr instanceof Error ? inviteErr.message : "Could not send invite email.",
          });
        }
      } else {
        toast.success("Staff member added", {
          description: "No email provided — invite skipped. You can grant access later from the profile page.",
        });
      }

      navigate({ to: "/teachers/$id", params: { id: created.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create staff");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Stepper */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold transition",
                i < step && "bg-primary text-primary-foreground",
                i === step && "bg-primary text-primary-foreground shadow-glow",
                i > step && "bg-muted text-muted-foreground",
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <div className="hidden min-w-0 flex-1 sm:block">
              <div className={cn("truncate text-xs font-medium", i === step ? "text-foreground" : "text-muted-foreground")}>
                {s.title}
              </div>
            </div>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-6 md:p-8">
          {step === 0 && (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2 flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={state.photoPreview} />
                  <AvatarFallback className="bg-primary/10 text-primary"><User className="h-8 w-8" /></AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="photo" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Passport Photograph
                  </Label>
                  <label htmlFor="photo" className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent">
                    <Upload className="h-4 w-4" /> Upload photo
                  </label>
                  <input
                    id="photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && onPhoto(e.target.files[0])}
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <Field label="Full name" v={state.full_name} onChange={(v) => set("full_name", v)} required />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={state.gender} onValueChange={(v) => set("gender", v as Gender)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Field type="date" label="Date of birth" v={state.date_of_birth} onChange={(v) => set("date_of_birth", v)} />
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Phone" v={state.phone} onChange={(v) => set("phone", v)} />
              <Field label="WhatsApp" v={state.whatsapp} onChange={(v) => set("whatsapp", v)} />
              <Field type="email" label="Email" v={state.email} onChange={(v) => set("email", v)} />
              <div className="md:col-span-2">
                <Label className="mb-2 block">Home address</Label>
                <Textarea value={state.address} onChange={(e) => set("address", e.target.value)} rows={2} />
              </div>
              <Field label="Emergency contact name" v={state.emergency_contact_name} onChange={(v) => set("emergency_contact_name", v)} />
              <Field label="Emergency contact phone" v={state.emergency_contact_phone} onChange={(v) => set("emergency_contact_phone", v)} />
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Highest qualification" v={state.qualification} onChange={(v) => set("qualification", v)} placeholder="B.Ed / M.Sc / …" />
              <Field label="Specialization" v={state.specialization} onChange={(v) => set("specialization", v)} placeholder="Mathematics" />
              <Field label="Department" v={state.department} onChange={(v) => set("department", v)} placeholder="Sciences" />
              <div className="space-y-2">
                <Label>Position <span className="text-destructive">*</span></Label>
                <Select value={state.position} onValueChange={(v) => set("position", v as Position)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(POSITION_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field type="date" label="Employment date" v={state.employment_date} onChange={(v) => set("employment_date", v)} required />
              <Field type="number" label="Salary (optional)" v={state.salary} onChange={(v) => set("salary", v)} placeholder="Monthly gross" />
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Staff ID" v={state.staff_code} onChange={(v) => set("staff_code", v)} required />
              <Field
                label="Username"
                v={state.username}
                onChange={(v) => set("username", v)}
                placeholder={suggestUsername(state.full_name || "user")}
              />
              <div className="space-y-2">
                <Label>Initial status</Label>
                <Select value={state.status} onValueChange={(v) => set("status", v as Status)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_leave">On leave</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground md:col-span-2">
                If an email address was entered in Step 2, an invite will be sent automatically when you save. The staff member clicks the link to set their password and access their dashboard. If no email was provided, you can grant access later from the Roles tab in School Settings.
              </div>
            </div>
          )}

          {step === 4 && <ReviewGrid state={state} />}

          {/* Nav */}
          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={() => (step === 0 ? navigate({ to: "/teachers" }) : setStep((s) => s - 1))} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> {step === 0 ? "Cancel" : "Back"}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button className="gap-2" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button className="gap-2" disabled={saving} onClick={submit}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save staff
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label, v, onChange, type = "text", required, placeholder,
}: {
  label: string; v: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      <Input type={type} value={v} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function ReviewGrid({ state }: { state: State }) {
  const rows: [string, string][] = [
    ["Full name", state.full_name],
    ["Gender", state.gender],
    ["Date of birth", state.date_of_birth || "—"],
    ["Phone", state.phone || "—"],
    ["Email", state.email || "—"],
    ["Position", POSITION_LABELS[state.position]],
    ["Department", state.department || "—"],
    ["Qualification", state.qualification || "—"],
    ["Employment date", state.employment_date],
    ["Staff ID", state.staff_code],
    ["Username", state.username || suggestUsername(state.full_name || "user")],
    ["Emergency", state.emergency_contact_name || "—"],
  ];
  return (
    <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-start justify-between border-b border-border/60 pb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{k}</span>
          <span className="text-sm font-medium text-foreground">{v}</span>
        </div>
      ))}
    </div>
  );
}