import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send } from "lucide-react";
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

import { MESSAGE_TYPES, useSendMessage } from "@/lib/communication/hooks";
import { UserSearchCombobox } from "./UserSearchCombobox";

const schema = z.object({
  recipient_id: z.string().min(1, "Please select a recipient"),
  subject:      z.string().optional(),
  body:         z.string().min(2, "Message body is required"),
  message_type: z.string(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  schoolId: string;
  senderId: string;
  /** Pre-fill recipient (e.g. when replying). Locks the picker. */
  defaultRecipientId?: string;
  defaultSubject?: string;
  /** IDs of recently contacted users — passed to the recipient picker */
  recentContactIds?: string[];
  onSuccess?: () => void;
  children?: React.ReactNode;
  /** Controlled open state — omit to let the dialog manage itself */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ComposeMessageDialog({
  schoolId, senderId, defaultRecipientId, defaultSubject,
  recentContactIds = [], onSuccess, children, open: openProp, onOpenChange,
}: Props) {
  const [openInternal, setOpenInternal] = React.useState(false);
  const open    = openProp !== undefined ? openProp : openInternal;
  const setOpen = (v: boolean) => { setOpenInternal(v); onOpenChange?.(v); };
  const send = useSendMessage(schoolId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      recipient_id: defaultRecipientId ?? "",
      subject:      defaultSubject ?? "",
      body:         "",
      message_type: "general",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        recipient_id: defaultRecipientId ?? "",
        subject:      defaultSubject ?? "",
        body:         "",
        message_type: "general",
      });
    }
  }, [open, defaultRecipientId, defaultSubject]);

  async function onSubmit(values: FormValues) {
    try {
      await send.mutateAsync({
        school_id:         schoolId,
        sender_id:         senderId,
        recipient_id:      values.recipient_id,
        subject:           values.subject || null,
        body:              values.body,
        message_type:      values.message_type,
        parent_message_id: null,
      });
      toast.success("Message sent successfully");
      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? "Failed to send message");
    }
  }

  const isReply = !!defaultRecipientId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button size="sm" className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            New Message
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isReply ? (
              <>
                <Send className="h-4 w-4 text-primary" />
                Reply
              </>
            ) : (
              <>
                <Send className="h-4 w-4 text-primary" />
                New Message
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {/* Recipient */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              To
            </Label>
            {isReply ? (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                Replying to sender
              </div>
            ) : (
              <UserSearchCombobox
                schoolId={schoolId}
                excludeId={senderId}
                recentContactIds={recentContactIds}
                value={form.watch("recipient_id")}
                onChange={(id) => form.setValue("recipient_id", id, { shouldValidate: true })}
              />
            )}
            {form.formState.errors.recipient_id && (
              <p className="text-xs text-destructive">
                {form.formState.errors.recipient_id.message}
              </p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Subject <span className="normal-case font-normal text-muted-foreground/60">(optional)</span>
            </Label>
            <Input placeholder="What's it about?" {...form.register("subject")} />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Type
            </Label>
            <Select
              defaultValue="general"
              onValueChange={(v) => form.setValue("message_type", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESSAGE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Message
            </Label>
            <Textarea
              placeholder="Write your message here…"
              rows={5}
              className="resize-none"
              {...form.register("body")}
            />
            {form.formState.errors.body && (
              <p className="text-xs text-destructive">{form.formState.errors.body.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={send.isPending} className="gap-1.5 min-w-[90px]">
              {send.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Send
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
