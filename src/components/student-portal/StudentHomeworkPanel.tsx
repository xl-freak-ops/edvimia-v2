import * as React from "react";
import { BookOpen, Loader2, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { formatDistanceToNow, isPast, isWithinInterval, addDays } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import {
  useMyHomework, useMySubmissions, useSubmitHomework,
} from "@/lib/student-portal/hooks";
import type { Homework, HomeworkSubmission } from "@/lib/student-portal/hooks";

interface Props {
  studentId: string;
  classId: string;
  armId: string | null;
  schoolId: string;
}

const submitSchema = z.object({ content: z.string().min(1, "Required") });
type SubmitForm = z.infer<typeof submitSchema>;

export function StudentHomeworkPanel({ studentId, classId, armId, schoolId }: Props) {
  const { data: hwList = [], isLoading: hwLoading } = useMyHomework(classId, armId, schoolId);
  const { data: submissions = [], isLoading: subLoading } = useMySubmissions(studentId);
  const submit = useSubmitHomework(schoolId);
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const isLoading = hwLoading || subLoading;

  const submittedIds = new Set(submissions.map((s) => s.homework_id));
  const gradedIds = new Set(
    submissions.filter((s) => s.grade != null).map((s) => s.homework_id),
  );

  function getSubmission(hwId: string): HomeworkSubmission | undefined {
    return submissions.find((s) => s.homework_id === hwId);
  }

  const now = new Date();
  const pending = (hwList as Record<string, unknown>[]).filter(
    (hw) => !submittedIds.has(hw.id as string)
  );
  const submitted = (hwList as Record<string, unknown>[]).filter(
    (hw) => submittedIds.has(hw.id as string) && !gradedIds.has(hw.id as string)
  );
  const graded = (hwList as Record<string, unknown>[]).filter(
    (hw) => gradedIds.has(hw.id as string)
  );

  function dueLabel(hw: Record<string, unknown>) {
    const due = new Date(hw.due_date as string);
    if (isPast(due)) return { label: "Overdue", cls: "text-destructive", urgent: true };
    if (isWithinInterval(due, { start: now, end: addDays(now, 2) }))
      return { label: formatDistanceToNow(due, { addSuffix: true }), cls: "text-amber-500", urgent: true };
    return { label: formatDistanceToNow(due, { addSuffix: true }), cls: "text-muted-foreground", urgent: false };
  }

  if (isLoading) {
    return (
      <Card className="shadow-soft">
        <CardContent className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (hwList.length === 0) {
    return (
      <Card className="shadow-soft">
        <CardContent className="flex h-32 flex-col items-center justify-center gap-2">
          <BookOpen className="h-6 w-6 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No homework assigned yet</p>
        </CardContent>
      </Card>
    );
  }

  function HwRow({ hw, showGrade = false }: { hw: Record<string, unknown>; showGrade?: boolean }) {
    const due = dueLabel(hw);
    const subj = hw.subjects as Record<string, unknown> | null;
    const isOpen = expanded === (hw.id as string);
    const sub = getSubmission(hw.id as string);

    return (
      <div
        className={cn(
          "rounded-xl border bg-card transition-all",
          due.urgent && !submittedIds.has(hw.id as string) && "border-l-4",
          isPast(new Date(hw.due_date as string)) && !submittedIds.has(hw.id as string) && "border-l-destructive bg-destructive/5",
          due.urgent && !isPast(new Date(hw.due_date as string)) && !submittedIds.has(hw.id as string) && "border-l-amber-500 bg-amber-500/5",
        )}
      >
        <button
          className="w-full flex items-start gap-3 p-3.5 text-left"
          onClick={() => setExpanded(isOpen ? null : (hw.id as string))}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{hw.title as string}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground">
                {(subj?.name as string) ?? "Subject"}
              </span>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className={cn("text-xs font-medium", due.cls)}>
                <Clock className="inline h-3 w-3 mr-0.5" />
                Due {due.label}
              </span>
            </div>
          </div>
          {showGrade && sub?.grade && (
            <Badge variant="outline" className="text-success border-success/40 bg-success/10 shrink-0">
              {sub.grade}
            </Badge>
          )}
        </button>

        {isOpen && (
          <div className="border-t px-3.5 pb-3.5 pt-3 space-y-3">
            {(hw.description as string | null) && (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {hw.description as string}
              </p>
            )}
            {sub && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <p className="font-medium text-success flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Submitted{" "}
                  {formatDistanceToNow(new Date(sub.submitted_at), { addSuffix: true })}
                </p>
                {sub.content && <p className="text-muted-foreground text-xs">{sub.content}</p>}
                {sub.feedback && (
                  <p className="text-xs mt-1">
                    <span className="font-medium">Feedback:</span> {sub.feedback}
                  </p>
                )}
              </div>
            )}
            {!sub && (
              <SubmitDialog
                homeworkId={hw.id as string}
                studentId={studentId}
                schoolId={schoolId}
                onDone={() => setExpanded(null)}
                submitMutation={submit}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4 text-primary" />
          Homework & Assignments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Pending
              {pending.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                  {pending.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="submitted">Submitted</TabsTrigger>
            <TabsTrigger value="graded">Graded</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4 space-y-2">
            {pending.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                All caught up! No pending assignments.
              </p>
            ) : (
              pending.map((hw) => <HwRow key={hw.id as string} hw={hw} />)
            )}
          </TabsContent>
          <TabsContent value="submitted" className="mt-4 space-y-2">
            {submitted.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">None yet</p>
            ) : (
              submitted.map((hw) => <HwRow key={hw.id as string} hw={hw} />)
            )}
          </TabsContent>
          <TabsContent value="graded" className="mt-4 space-y-2">
            {graded.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No graded work yet</p>
            ) : (
              graded.map((hw) => <HwRow key={hw.id as string} hw={hw} showGrade />)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function SubmitDialog({
  homeworkId, studentId, schoolId, onDone, submitMutation,
}: {
  homeworkId: string;
  studentId: string;
  schoolId: string;
  onDone: () => void;
  submitMutation: ReturnType<typeof useSubmitHomework>;
}) {
  const [open, setOpen] = React.useState(false);
  const form = useForm<SubmitForm>({ resolver: zodResolver(submitSchema) });

  async function onSubmit(values: SubmitForm) {
    try {
      await submitMutation.mutateAsync({
        school_id: schoolId,
        homework_id: homeworkId,
        student_id: studentId,
        content: values.content,
      });
      toast.success("Assignment submitted!");
      setOpen(false);
      onDone();
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? "Submission failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full">Submit Assignment</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Assignment</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sub-content">Your Answer / Notes *</Label>
            <Textarea id="sub-content" rows={6} placeholder="Write your answer…" {...form.register("content")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitMutation.isPending}>
              {submitMutation.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
