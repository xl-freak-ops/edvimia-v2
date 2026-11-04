import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { Send, MailOpen, Reply, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  useParentMessages, useSendParentMessage,
} from "@/lib/parent/hooks";
import type { Message } from "@/lib/parent/hooks";

interface Props {
  schoolId: string;
  userId: string;
}

const schema = z.object({
  recipient_id: z.string().min(1, "Required"),
  subject: z.string().optional(),
  body: z.string().min(2, "Required"),
});
type FormValues = z.infer<typeof schema>;

export function ParentMessagesPanel({ schoolId, userId }: Props) {
  const { data: messages = [], isLoading } = useParentMessages(userId, schoolId);
  const send = useSendParentMessage(schoolId);
  const [selected, setSelected] = React.useState<Message | null>(null);
  const [open, setOpen] = React.useState(false);

  const inbox = messages.filter((m) => m.recipient_id === userId);
  const sent = messages.filter((m) => m.sender_id === userId);
  const unreadCount = inbox.filter((m) => !m.is_read).length;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { recipient_id: "", subject: "", body: "" },
  });

  async function onSend(values: FormValues) {
    try {
      await send.mutateAsync({
        school_id: schoolId,
        sender_id: userId,
        recipient_id: values.recipient_id,
        subject: values.subject || null,
        body: values.body,
        message_type: "general",
        parent_message_id: null,
      });
      toast.success("Message sent");
      form.reset();
      setOpen(false);
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? "Failed to send");
    }
  }

  function MsgRow({ msg }: { msg: Message }) {
    const isUnread = !msg.is_read && msg.recipient_id === userId;
    const isSelected = selected?.id === msg.id;
    return (
      <button
        className={cn(
          "w-full flex items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted/60",
          isSelected && "bg-primary/8 ring-1 ring-primary/20",
        )}
        onClick={() => setSelected(isSelected ? null : msg)}
      >
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="text-[11px] bg-gradient-to-br from-primary/20 to-accent-brand/20">
            {msg.sender_id.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={cn("text-sm truncate", isUnread && "font-semibold")}>
              {msg.subject ?? "(No subject)"}
            </span>
            {isUnread && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">{msg.body}</p>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
          </p>
        </div>
      </button>
    );
  }

  function MsgDetail({ msg }: { msg: Message }) {
    return (
      <div className="rounded-xl border bg-card p-4 space-y-3 animate-fade-in">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">{msg.subject ?? "(No subject)"}</h3>
            <p className="text-xs text-muted-foreground">
              {new Date(msg.created_at).toLocaleString()}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 shrink-0"
            onClick={() => {
              form.reset({
                recipient_id: msg.sender_id !== userId ? msg.sender_id : msg.recipient_id,
                subject: `Re: ${msg.subject ?? ""}`,
                body: "",
              });
              setOpen(true);
            }}
          >
            <Reply className="h-3.5 w-3.5" />
            Reply
          </Button>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
      </div>
    );
  }

  function List({ list }: { list: Message[] }) {
    if (isLoading) {
      return (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      );
    }
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/30 px-6 py-10 text-center">
          <MailOpen className="h-7 w-7 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No messages yet</p>
        </div>
      );
    }
    return (
      <div className="space-y-1">
        {list.map((m) => <MsgRow key={m.id} msg={m} />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Send className="h-4 w-4" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Message a Teacher or Admin</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSend)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pm-recipient">Recipient User ID *</Label>
                <Input id="pm-recipient" placeholder="Paste staff user ID…" {...form.register("recipient_id")} />
                <p className="text-[11px] text-muted-foreground">
                  Ask your school admin for the staff member's user ID.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pm-subject">Subject (optional)</Label>
                <Input id="pm-subject" placeholder="Subject…" {...form.register("subject")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pm-body">Message *</Label>
                <Textarea id="pm-body" rows={4} placeholder="Write your message…" {...form.register("body")} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={send.isPending}>
                  {send.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                  Send
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox">
            Inbox
            {unreadCount > 0 && (
              <Badge className="ml-1.5 px-1.5 py-0 text-[10px]">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
        </TabsList>
        <TabsContent value="inbox" className="mt-4 space-y-3">
          <List list={inbox} />
          {selected && selected.recipient_id === userId && <MsgDetail msg={selected} />}
        </TabsContent>
        <TabsContent value="sent" className="mt-4 space-y-3">
          <List list={sent} />
          {selected && selected.sender_id === userId && <MsgDetail msg={selected} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
