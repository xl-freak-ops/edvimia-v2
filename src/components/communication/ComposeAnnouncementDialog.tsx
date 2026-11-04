import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

import {
  MESSAGE_TYPES, ROLE_TARGETS,
  useCreateAnnouncement, usePublishAnnouncement,
} from "@/lib/communication/hooks";

const schema = z.object({
  title: z.string().min(3, "Title is required"),
  body: z.string().min(10, "Body must be at least 10 characters"),
  type: z.string(),
  target_roles: z.array(z.string()),
  is_emergency: z.boolean(),
  scheduled_at: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  schoolId: string;
  senderId: string;
  onSuccess?: () => void;
  defaultType?: string;
  children: React.ReactNode;
}

export function ComposeAnnouncementDialog({
  schoolId, senderId, onSuccess, defaultType = "announcement", children,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const create = useCreateAnnouncement(schoolId);
  const publish = usePublishAnnouncement(schoolId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", body: "", type: defaultType, target_roles: [], is_emergency: false },
  });

  async function handleSubmit(values: FormValues, publishNow: boolean) {
    try {
      const row = {
        ...values,
        school_id: schoolId,
        sender_id: senderId,
        is_published: !publishNow ? false : true,
        published_at: publishNow ? new Date().toISOString() : null,
        scheduled_at: values.scheduled_at || null,
      };
      const created = await create.mutateAsync(row as never);
      if (publishNow && created?.id) {
        await publish.mutateAsync(created.id as string);
        toast.success("Announcement published successfully");
      } else {
        toast.success("Draft saved");
      }
      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? "Failed to save announcement");
    }
  }

  const isLoading = create.isPending || publish.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Announcement</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1.5">
            <Label htmlFor="ann-title">Title *</Label>
            <Input id="ann-title" placeholder="Announcement title…" {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ann-body">Message *</Label>
            <Textarea
              id="ann-body"
              placeholder="Write your announcement…"
              rows={5}
              {...form.register("body")}
            />
            {form.formState.errors.body && (
              <p className="text-xs text-destructive">{form.formState.errors.body.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                defaultValue={defaultType}
                onValueChange={(v) => form.setValue("type", v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MESSAGE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ann-sched">Schedule (optional)</Label>
              <Input
                id="ann-sched"
                type="datetime-local"
                {...form.register("scheduled_at")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Target Audience</Label>
            <p className="text-xs text-muted-foreground">Leave all unchecked to reach everyone.</p>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_TARGETS.map((r) => {
                const current = form.watch("target_roles");
                const checked = current.includes(r.value);
                return (
                  <div key={r.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`role-${r.value}`}
                      checked={checked}
                      onCheckedChange={(c) => {
                        const next = c
                          ? [...current, r.value]
                          : current.filter((v) => v !== r.value);
                        form.setValue("target_roles", next);
                      }}
                    />
                    <Label htmlFor={`role-${r.value}`} className="cursor-pointer text-sm font-normal">
                      {r.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <Switch
              id="ann-emergency"
              checked={form.watch("is_emergency")}
              onCheckedChange={(v) => form.setValue("is_emergency", v)}
            />
            <div>
              <Label htmlFor="ann-emergency" className="cursor-pointer text-sm font-medium">
                Mark as Emergency
              </Label>
              <p className="text-xs text-muted-foreground">
                Pinned at top and highlighted for all recipients.
              </p>
            </div>
          </div>
        </form>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={form.handleSubmit((v) => handleSubmit(v, false))}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Save Draft
          </Button>
          <Button
            onClick={form.handleSubmit((v) => handleSubmit(v, true))}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Publish Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
