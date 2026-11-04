import * as React from "react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { Send, MailOpen, Reply, ArrowLeft, Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import {
  useMessages,
  useMarkMessageRead,
  useSchoolMembers,
  type Message,
  type SchoolMember,
} from "@/lib/communication/hooks";
import { ComposeMessageDialog } from "./ComposeMessageDialog";

// ── Avatar helpers ─────────────────────────────────────────

const AVATAR_PALETTES = [
  { bg: "bg-blue-100",   text: "text-blue-700"   },
  { bg: "bg-purple-100", text: "text-purple-700"  },
  { bg: "bg-emerald-100",text: "text-emerald-700" },
  { bg: "bg-amber-100",  text: "text-amber-700"   },
  { bg: "bg-rose-100",   text: "text-rose-700"    },
  { bg: "bg-teal-100",   text: "text-teal-700"    },
  { bg: "bg-indigo-100", text: "text-indigo-700"  },
  { bg: "bg-orange-100", text: "text-orange-700"  },
];

function avatarPalette(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (id.charCodeAt(i) + ((h << 5) - h)) | 0;
  return AVATAR_PALETTES[Math.abs(h) % AVATAR_PALETTES.length];
}

function nameInitials(name: string | null | undefined, fallbackId: string) {
  if (!name) return fallbackId.slice(0, 2).toUpperCase();
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

// ── Time formatting ────────────────────────────────────────

function friendlyTime(iso: string) {
  const d = new Date(iso);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

function friendlyDateTime(iso: string) {
  const d = new Date(iso);
  if (isToday(d)) return `Today at ${format(d, "h:mm a")}`;
  if (isYesterday(d)) return `Yesterday at ${format(d, "h:mm a")}`;
  return format(d, "MMM d, yyyy · h:mm a");
}

// ── Props ──────────────────────────────────────────────────

interface Props {
  schoolId: string;
  userId: string;
  isAdmin?: boolean;
}

// ── Main component ─────────────────────────────────────────

export function InboxPanel({ schoolId, userId, isAdmin = false }: Props) {
  const { data: messages = [], isLoading } = useMessages(userId, schoolId);
  const { data: members = [] } = useSchoolMembers(schoolId);
  const markRead = useMarkMessageRead();
  const [selected, setSelected] = React.useState<Message | null>(null);
  const [activeTab, setActiveTab] = React.useState("inbox");

  // Member lookup map
  const memberMap = React.useMemo(() => {
    const m = new Map<string, SchoolMember>();
    members.forEach((mem) => m.set(mem.id, mem));
    return m;
  }, [members]);

  const inbox = messages.filter((m) => m.recipient_id === userId);
  const sent = messages.filter((m) => m.sender_id === userId);
  const unreadCount = inbox.filter((m) => !m.is_read).length;

  // Derive recent contact IDs from message history (most recent first, deduped)
  const recentContactIds = React.useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const m of messages) {
      const otherId = m.sender_id === userId ? m.recipient_id : m.sender_id;
      if (otherId && otherId !== userId && !seen.has(otherId)) {
        seen.add(otherId);
        result.push(otherId);
      }
    }
    return result.slice(0, 8);
  }, [messages, userId]);

  const currentList =
    activeTab === "inbox" ? inbox : activeTab === "sent" ? sent : messages;

  async function handleOpen(msg: Message) {
    setSelected(msg);
    if (!msg.is_read && msg.recipient_id === userId) {
      try { await markRead.mutateAsync(msg.id); } catch { /* silent */ }
    }
  }

  function getMember(id: string) {
    return memberMap.get(id) ?? null;
  }

  function getDisplayName(id: string) {
    const m = getMember(id);
    return m?.full_name?.trim() || m?.email || "Unknown";
  }

  // ── Message row ────────────────────────────────────────

  function MessageRow({ msg }: { msg: Message }) {
    const isSelected = selected?.id === msg.id;
    const isUnread = !msg.is_read && msg.recipient_id === userId;
    const otherId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
    const other = getMember(otherId);
    const name = getDisplayName(otherId);
    const palette = avatarPalette(otherId);

    return (
      <button
        type="button"
        onClick={() => handleOpen(msg)}
        className={cn(
          "group w-full flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-all",
          "hover:bg-muted/70",
          isSelected
            ? "bg-primary/8 ring-1 ring-inset ring-primary/25"
            : "",
        )}
      >
        {/* Avatar */}
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className={cn("text-xs font-semibold", palette.bg, palette.text)}>
            {nameInitials(other?.full_name, otherId)}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className={cn("text-sm truncate", isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>
              {name}
            </span>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {friendlyTime(msg.created_at)}
            </span>
          </div>
          <p className={cn("text-xs truncate mt-0.5", isUnread ? "text-foreground/90" : "text-muted-foreground")}>
            {msg.subject ?? "(No subject)"}
          </p>
          <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">{msg.body}</p>
        </div>

        {/* Unread dot */}
        {isUnread && (
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
        )}
      </button>
    );
  }

  // ── Message detail pane ────────────────────────────────

  function MessageDetail({ msg }: { msg: Message }) {
    const otherId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
    const isSentByMe = msg.sender_id === userId;
    const other = getMember(otherId);
    const name = getDisplayName(otherId);
    const palette = avatarPalette(otherId);

    return (
      <div className="flex flex-col h-full animate-in fade-in-0 slide-in-from-right-2 duration-200">
        {/* Detail header */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-4 border-b">
          {/* Back button on mobile */}
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden h-8 w-8 shrink-0 -ml-1"
            onClick={() => setSelected(null)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className={cn("text-sm font-semibold", palette.bg, palette.text)}>
              {nameInitials(other?.full_name, otherId)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold leading-tight">
              {msg.subject ?? "(No subject)"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isSentByMe ? `To: ${name}` : `From: ${name}`}
              {" · "}
              {friendlyDateTime(msg.created_at)}
            </p>
            {msg.message_type && msg.message_type !== "general" && (
              <span className="mt-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium capitalize text-primary">
                {msg.message_type}
              </span>
            )}
          </div>

          {/* Reply */}
          <ComposeMessageDialog
            schoolId={schoolId}
            senderId={userId}
            recentContactIds={recentContactIds}
            defaultRecipientId={isSentByMe ? msg.recipient_id : msg.sender_id}
            defaultSubject={msg.subject ? `Re: ${msg.subject}` : undefined}
          >
            <Button size="sm" variant="outline" className="gap-1.5 shrink-0">
              <Reply className="h-3.5 w-3.5" />
              Reply
            </Button>
          </ComposeMessageDialog>
        </div>

        {/* Body */}
        <ScrollArea className="flex-1 px-5 py-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
            {msg.body}
          </p>
        </ScrollArea>
      </div>
    );
  }

  // ── List panel ─────────────────────────────────────────

  function MessageList({ list }: { list: Message[] }) {
    if (isLoading) {
      return (
        <div className="flex flex-col gap-2 p-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl p-3 animate-pulse">
              <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 w-32 rounded bg-muted" />
                <div className="h-2.5 w-48 rounded bg-muted/60" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
          <div className="rounded-full bg-muted p-4">
            <MailOpen className="h-6 w-6 text-muted-foreground/60" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Start a conversation by hitting New Message
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-2 space-y-0.5">
        {list.map((m) => (
          <MessageRow key={m.id} msg={m} />
        ))}
      </div>
    );
  }

  // ── Empty detail placeholder ───────────────────────────

  function EmptyDetail() {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8 py-12">
        <div className="rounded-full bg-muted/60 p-5">
          <Inbox className="h-7 w-7 text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Select a message</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            Choose a conversation on the left to read it here
          </p>
        </div>
      </div>
    );
  }

  // ── Layout ─────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-0 rounded-2xl border bg-card shadow-sm overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-semibold">Messages</h2>
          {unreadCount > 0 && (
            <Badge className="px-1.5 py-0 text-[10px] h-4 leading-none">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <ComposeMessageDialog
          schoolId={schoolId}
          senderId={userId}
          recentContactIds={recentContactIds}
        >
          <Button size="sm" className="gap-1.5 rounded-lg">
            <Send className="h-3.5 w-3.5" />
            New Message
          </Button>
        </ComposeMessageDialog>
      </div>

      {/* Tabs + Two-pane body */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => { setActiveTab(v); setSelected(null); }}
        className="flex flex-col flex-1"
      >
        <TabsList className="rounded-none border-b h-auto p-0 bg-transparent justify-start px-4 gap-0">
          <TabsTrigger
            value="inbox"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-4 py-2.5 text-sm"
          >
            Inbox
            {unreadCount > 0 && (
              <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground leading-none">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="sent"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-4 py-2.5 text-sm"
          >
            Sent
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger
              value="all"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-4 py-2.5 text-sm"
            >
              All
            </TabsTrigger>
          )}
        </TabsList>

        {/* Two-pane grid */}
        <div className="grid md:grid-cols-[300px_1fr] min-h-[480px]">
          {/* Left: list */}
          <div className={cn("border-r", selected ? "hidden md:block" : "block")}>
            <ScrollArea className="h-[480px]">
              <TabsContent value="inbox" className="mt-0 p-0">
                <MessageList list={inbox} />
              </TabsContent>
              <TabsContent value="sent" className="mt-0 p-0">
                <MessageList list={sent} />
              </TabsContent>
              {isAdmin && (
                <TabsContent value="all" className="mt-0 p-0">
                  <MessageList list={messages} />
                </TabsContent>
              )}
            </ScrollArea>
          </div>

          {/* Right: detail */}
          <div className={cn(selected ? "block" : "hidden md:block")}>
            {selected ? (
              <MessageDetail msg={selected} />
            ) : (
              <EmptyDetail />
            )}
          </div>
        </div>
      </Tabs>
    </div>
  );
}
