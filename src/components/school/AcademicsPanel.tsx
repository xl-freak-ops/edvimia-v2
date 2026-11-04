import { useState } from "react";
import { Calendar, ChevronRight, GraduationCap, Layers, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "./EmptyState";
import { toast } from "sonner";
import {
  schoolKeys,
  useArms,
  useClasses,
  useCreateRow,
  useDeleteRow,
  useSections,
  useSessions,
  useTerms,
  useUpdateRow,
} from "@/lib/school/hooks";

function setCurrent(
  rows: { id: string; is_current: boolean }[],
  id: string,
  update: ReturnType<typeof useUpdateRow>,
) {
  rows.forEach((r) => {
    if (r.is_current && r.id !== id) update.mutate({ id: r.id, patch: { is_current: false } });
  });
  update.mutate({ id, patch: { is_current: true } });
}

export function AcademicsPanel({ schoolId }: { schoolId: string }) {
  const sessions = useSessions(schoolId);
  const terms = useTerms(schoolId);
  const sections = useSections(schoolId);
  const classes = useClasses(schoolId);
  const arms = useArms(schoolId);

  const createSession = useCreateRow("academic_sessions", schoolKeys.sessions(schoolId));
  const updateSession = useUpdateRow("academic_sessions", schoolKeys.sessions(schoolId));
  const delSession = useDeleteRow("academic_sessions", schoolKeys.sessions(schoolId));

  const createTerm = useCreateRow("terms", schoolKeys.terms(schoolId));
  const updateTerm = useUpdateRow("terms", schoolKeys.terms(schoolId));
  const delTerm = useDeleteRow("terms", schoolKeys.terms(schoolId));

  const createSection = useCreateRow("sections", schoolKeys.sections(schoolId));
  const delSection = useDeleteRow("sections", schoolKeys.sections(schoolId));

  const createClass = useCreateRow("classes", schoolKeys.classes(schoolId));
  const delClass = useDeleteRow("classes", schoolKeys.classes(schoolId));

  const createArm = useCreateRow("class_arms", schoolKeys.arms(schoolId));
  const delArm = useDeleteRow("class_arms", schoolKeys.arms(schoolId));

  const [openSession, setOpenSession] = useState(false);
  const [sName, setSName] = useState("");
  const [sStart, setSStart] = useState("");
  const [sEnd, setSEnd] = useState("");

  const [openTerm, setOpenTerm] = useState(false);
  const [tName, setTName] = useState("First Term");
  const [tSession, setTSession] = useState<string>("");
  const [tStart, setTStart] = useState("");
  const [tEnd, setTEnd] = useState("");

  const [openSection, setOpenSection] = useState(false);
  const [secName, setSecName] = useState("");

  const [openClass, setOpenClass] = useState(false);
  const [clsName, setClsName] = useState("");
  const [clsSection, setClsSection] = useState<string>("");

  const [openArm, setOpenArm] = useState(false);
  const [armName, setArmName] = useState("");
  const [armClass, setArmClass] = useState<string>("");

  return (
    <div className="space-y-5">
      {/* Sessions + Terms */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-4 w-4 text-primary" /> Academic sessions</CardTitle>
              <CardDescription>Define your school year and mark the current one.</CardDescription>
            </div>
            <Dialog open={openSession} onOpenChange={setOpenSession}>
              <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New session</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New academic session</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div className="space-y-1.5"><Label>Name</Label><Input value={sName} onChange={(e) => setSName(e.target.value)} placeholder="2025/2026" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Start date</Label><Input type="date" value={sStart} onChange={(e) => setSStart(e.target.value)} /></div>
                    <div className="space-y-1.5"><Label>End date</Label><Input type="date" value={sEnd} onChange={(e) => setSEnd(e.target.value)} /></div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={async () => {
                    if (!sName.trim()) return toast.error("Session name is required");
                    await createSession.mutateAsync({ school_id: schoolId, name: sName.trim(), start_date: sStart || null, end_date: sEnd || null });
                    setOpenSession(false); setSName(""); setSStart(""); setSEnd("");
                    toast.success("Session created");
                  }} disabled={createSession.isPending}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {sessions.data?.length ? (
              <ul className="divide-y rounded-lg border">
                {sessions.data.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{s.name}</span>
                        {s.is_current && <Badge variant="secondary" className="bg-primary/10 text-primary">Current</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{s.start_date ?? "—"} → {s.end_date ?? "—"}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!s.is_current && (
                        <Button size="sm" variant="ghost" onClick={() => setCurrent(sessions.data!, s.id, updateSession)}>Set current</Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => delSession.mutate(s.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Calendar} title="No sessions yet" description="Add your first academic session to organize terms and results." />
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><Layers className="h-4 w-4 text-primary" /> Terms</CardTitle>
              <CardDescription>Three terms per session is typical.</CardDescription>
            </div>
            <Dialog open={openTerm} onOpenChange={setOpenTerm}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5" disabled={!sessions.data?.length}><Plus className="h-3.5 w-3.5" /> New term</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New term</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div className="space-y-1.5">
                    <Label>Session</Label>
                    <Select value={tSession} onValueChange={setTSession}>
                      <SelectTrigger><SelectValue placeholder="Choose session" /></SelectTrigger>
                      <SelectContent>{sessions.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Term name</Label>
                    <Select value={tName} onValueChange={setTName}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["First Term","Second Term","Third Term"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Start date</Label><Input type="date" value={tStart} onChange={(e) => setTStart(e.target.value)} /></div>
                    <div className="space-y-1.5"><Label>End date</Label><Input type="date" value={tEnd} onChange={(e) => setTEnd(e.target.value)} /></div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={async () => {
                    if (!tSession) return toast.error("Pick a session");
                    await createTerm.mutateAsync({ school_id: schoolId, session_id: tSession, name: tName, start_date: tStart || null, end_date: tEnd || null });
                    setOpenTerm(false); setTStart(""); setTEnd("");
                    toast.success("Term created");
                  }} disabled={createTerm.isPending}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {terms.data?.length ? (
              <ul className="divide-y rounded-lg border">
                {terms.data.map((t) => {
                  const sess = sessions.data?.find((s) => s.id === t.session_id);
                  return (
                    <li key={t.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{t.name}</span>
                          {t.is_current && <Badge variant="secondary" className="bg-primary/10 text-primary">Current</Badge>}
                          {sess && <span className="text-xs text-muted-foreground">· {sess.name}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{t.start_date ?? "—"} → {t.end_date ?? "—"}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!t.is_current && (
                          <Button size="sm" variant="ghost" onClick={() => setCurrent(terms.data!, t.id, updateTerm)}>Set current</Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => delTerm.mutate(t.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState icon={Layers} title="No terms yet" description="Add the terms for your current session." />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sections → Classes → Arms */}
      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="h-4 w-4 text-primary" /> Academic structure</CardTitle>
            <CardDescription>Sections contain classes, classes contain arms.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog open={openSection} onOpenChange={setOpenSection}>
              <DialogTrigger asChild><Button size="sm" variant="outline" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Section</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New section</DialogTitle></DialogHeader>
                <div className="space-y-1.5"><Label>Name</Label><Input value={secName} onChange={(e) => setSecName(e.target.value)} placeholder="Primary / JSS / SSS" /></div>
                <DialogFooter>
                  <Button onClick={async () => {
                    if (!secName.trim()) return;
                    await createSection.mutateAsync({ school_id: schoolId, name: secName.trim(), display_order: sections.data?.length ?? 0 });
                    setSecName(""); setOpenSection(false);
                    toast.success("Section added");
                  }}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={openClass} onOpenChange={setOpenClass}>
              <DialogTrigger asChild><Button size="sm" variant="outline" className="gap-1.5" disabled={!sections.data?.length}><Plus className="h-3.5 w-3.5" /> Class</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New class</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div className="space-y-1.5">
                    <Label>Section</Label>
                    <Select value={clsSection} onValueChange={setClsSection}>
                      <SelectTrigger><SelectValue placeholder="Pick section" /></SelectTrigger>
                      <SelectContent>{sections.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Name</Label><Input value={clsName} onChange={(e) => setClsName(e.target.value)} placeholder="JSS 1" /></div>
                </div>
                <DialogFooter>
                  <Button onClick={async () => {
                    if (!clsSection || !clsName.trim()) return;
                    await createClass.mutateAsync({ school_id: schoolId, section_id: clsSection, name: clsName.trim(), display_order: classes.data?.length ?? 0 });
                    setClsName(""); setOpenClass(false);
                    toast.success("Class added");
                  }}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={openArm} onOpenChange={setOpenArm}>
              <DialogTrigger asChild><Button size="sm" className="gap-1.5" disabled={!classes.data?.length}><Plus className="h-3.5 w-3.5" /> Arm</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New arm</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div className="space-y-1.5">
                    <Label>Class</Label>
                    <Select value={armClass} onValueChange={setArmClass}>
                      <SelectTrigger><SelectValue placeholder="Pick class" /></SelectTrigger>
                      <SelectContent>{classes.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Arm letter</Label><Input value={armName} onChange={(e) => setArmName(e.target.value)} placeholder="A" /></div>
                </div>
                <DialogFooter>
                  <Button onClick={async () => {
                    if (!armClass || !armName.trim()) return;
                    await createArm.mutateAsync({ school_id: schoolId, class_id: armClass, name: armName.trim().toUpperCase() });
                    setArmName(""); setOpenArm(false);
                    toast.success("Arm added");
                  }}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {sections.data?.length ? (
            <div className="space-y-4">
              {sections.data.map((sec) => {
                const sectionClasses = (classes.data ?? []).filter((c) => c.section_id === sec.id);
                return (
                  <div key={sec.id} className="rounded-xl border bg-card/40 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        <h4 className="text-sm font-semibold">{sec.name}</h4>
                        <span className="text-xs text-muted-foreground">· {sectionClasses.length} classes</span>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => delSection.mutate(sec.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                    {sectionClasses.length ? (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {sectionClasses.map((c) => {
                          const cArms = (arms.data ?? []).filter((a) => a.class_id === c.id);
                          return (
                            <div key={c.id} className="rounded-lg border bg-background p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">{c.name}</span>
                                <Button size="icon" variant="ghost" onClick={() => delClass.mutate(c.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {cArms.length ? cArms.map((a) => (
                                  <button key={a.id} type="button" onClick={() => delArm.mutate(a.id)} className="group flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary transition-colors hover:bg-destructive/15 hover:text-destructive">
                                    {c.name} {a.name}
                                    <Trash2 className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100" />
                                  </button>
                                )) : <span className="text-xs text-muted-foreground">No arms yet</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No classes in this section.</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={GraduationCap} title="Build your academic structure" description="Start by adding a section (e.g. Primary, JSS, SSS)." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}