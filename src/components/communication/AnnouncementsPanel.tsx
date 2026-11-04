import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle, ChevronDown, ChevronRight, Plus, Trash2, Send, Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  useAllAnnouncements, useDeleteAnnouncement, usePublishAnnouncement,
  MESSAGE_TYPES, type AnnouncementWithSender,
} from "@/lib/communication/hooks";
import { MessageTypeBadge } from "./MessageTypeBadge";
import { ComposeAnnouncementDialog } from "./ComposeAnnouncementDialog";

interface Props {
  schoolId: string;
  userId: string;
}

export function AnnouncementsPanel({ schoolId, userId }: Props) {
  const { data: all = [], isLoading } = useAllAnnouncements(schoolId);
  const deleteAnn = useDeleteAnnouncement(schoolId);
  const publishAnn = usePublishAnnouncement(schoolId);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [typeFilter, setTypeFilter] = React.useState("all");

  const filter = (list: AnnouncementWithSender[]) =>
    typeFilter === "all" ? list : list.filter((a) => a.type === typeFilter);

  const drafts = filter(all.filter((a) => !a.is_published && !a.scheduled_at));
  const scheduled = filter(all.filter((a) => !a.is_published && !!a.scheduled_at));
  const published = filter(all.filter((a) => a.is_published));

  async function handlePublish(id: string) {
    try {
      await publishAnn.mutateAsync(id);
      toast.success("Announcement published");
    } catch {
      toast.error("Failed to publish");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAnn.mutateAsync(id);
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  function AnnouncementRow({ ann }: { ann: AnnouncementWithSender }) {
    const isOpen = expanded === ann.id;
    return (
      <div
        className={cn(
          "rounded-xl border bg-card transition-all",
          ann.is_emergency && "border-l-4 border-l-destructive",
        )}
      >
        <button
          className="flex w-full items-start gap-3 p-4 text-left"
          onClick={() => setExpanded(isOpen ? null : ann.id)}
        >
          <div className="mt-0.5">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {ann.is_emergency && (
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              )}
              <span className="text-sm font-semibold truncate">{ann.title}</span>
              <MessageTypeBadge type={ann.type} />
              {ann.target_roles.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {ann.target_roles.slice(0, 3).map((r) => (
                    <Badge key={r} variant="outline" className="text-[10px] py-0">
                      {r.replace("_", " ")}
                    </Badge>
                  ))}
                  {ann.target_roles.length > 3 && (
                    <Badge variant="outline" className="text-[10px] py-0">
                      +{ann.target_roles.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {ann.profiles?.full_name ?? "Unknown"} ·{" "}
              {formatDistanceToNow(new Date(ann.created_at), { addSuffix: true })}
            </p>
          </div>
        </button>

        {isOpen && (
          <div className="px-4 pb-4 pt-0 border-t">
            <p className="text-sm leading-relaxed whitespace-pre-wrap mt-3 text-foreground">
              {ann.body}
            </p>
            <div className="mt-3 flex items-center gap-2">
              {!ann.is_published && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() => handlePublish(ann.id)}
                  disabled={publishAnn.isPending}
                >
                  {publishAnn.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  Publish
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-xs text-destructive hover:text-destructive"
                onClick={() => handleDelete(ann.id)}
                disabled={deleteAnn.isPending}
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  function TabBody({ list }: { list: AnnouncementWithSender[] }) {
    if (isLoading) {
      return (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      );
    }
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">No announcements here</p>
          <p className="text-xs text-muted-foreground">
            Use the "New Announcement" button to create one.
          </p>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {list.map((ann) => <AnnouncementRow key={ann.id} ann={ann} />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44 h-8 text-xs">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {MESSAGE_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ComposeAnnouncementDialog schoolId={schoolId} senderId={userId}>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Announcement
          </Button>
        </ComposeAnnouncementDialog>
      </div>

      <Tabs defaultValue="published">
        <TabsList>
          <TabsTrigger value="published">
            Published
            {published.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                {published.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="drafts">
            Drafts
            {drafts.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                {drafts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
        </TabsList>

        <TabsContent value="published" className="mt-4">
          <TabBody list={published} />
        </TabsContent>
        <TabsContent value="drafts" className="mt-4">
          <TabBody list={drafts} />
        </TabsContent>
        <TabsContent value="scheduled" className="mt-4">
          <TabBody list={scheduled} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
