import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Bell, Megaphone } from "lucide-react";
import { PermissionGate } from "@/components/auth/PermissionGate";

import { AppShell } from "@/components/layout/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/AuthProvider";
import { primaryRole } from "@/lib/auth/roles";

import { AnnouncementsPanel } from "@/components/communication/AnnouncementsPanel";
import { InboxPanel } from "@/components/communication/InboxPanel";
import { NotificationsPanel } from "@/components/communication/NotificationsPanel";
import { EmergencyAlertBanner } from "@/components/communication/EmergencyAlertBanner";
import { usePublishedAnnouncements, useNotifications } from "@/lib/communication/hooks";

export const Route = createFileRoute("/_authenticated/communication")({
  head: () => ({ meta: [{ title: "Communication · Edvimia" }] }),
  component: CommunicationPage,
});

const ADMIN_ROLES = ["super_admin", "school_admin", "principal", "vice_principal"];
const STAFF_ROLES = ["form_teacher", "subject_teacher"];

function CommunicationPage() {
  const { school, userId, roles } = useAuth();
  const schoolId = school?.id ?? null;
  const role = primaryRole(roles);
  const isAdmin = role ? ADMIN_ROLES.includes(role) : false;
  const isStaff = role ? STAFF_ROLES.includes(role) : false;
  const canManage = isAdmin || isStaff;

  const userRoleNames = roles.map((r) => (typeof r === "string" ? r : (r as { role: string }).role));

  const publishedQ = usePublishedAnnouncements(schoolId, userRoleNames);
  const notificationsQ = useNotifications(userId, schoolId);

  const emergencyAnnouncements = (publishedQ.data ?? []).filter((a) => a.is_emergency);
  const unreadNotifications = (notificationsQ.data ?? []).filter((n) => !n.is_read).length;

  if (!schoolId || !userId) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center p-6">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </AppShell>
    );
  }

  return (
    <PermissionGate permission="view_communication">
    <AppShell>
      <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Communication Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {canManage
              ? "Manage announcements, messages, and notifications across your school."
              : "Stay informed with school announcements and messages."}
          </p>
        </div>

        {/* Emergency banner */}
        {emergencyAnnouncements.length > 0 && (
          <EmergencyAlertBanner
            announcements={emergencyAnnouncements}
            userId={userId}
          />
        )}

        {/* Main tabs */}
        <Tabs defaultValue="announcements">
          <TabsList>
            <TabsTrigger value="announcements" className="gap-1.5">
              <Megaphone className="h-3.5 w-3.5" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5">
              <Bell className="h-3.5 w-3.5" />
              Notifications
              {unreadNotifications > 0 && (
                <Badge className="ml-1 px-1.5 py-0 text-[10px]" variant="default">
                  {unreadNotifications}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="announcements" className="mt-6">
            {canManage ? (
              <AnnouncementsPanel schoolId={schoolId} userId={userId} />
            ) : (
              <ReadOnlyAnnouncementsView schoolId={schoolId} userId={userId} userRoles={userRoleNames} />
            )}
          </TabsContent>

          <TabsContent value="messages" className="mt-6">
            <InboxPanel schoolId={schoolId} userId={userId} isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <NotificationsPanel schoolId={schoolId} userId={userId} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
    </PermissionGate>
  );
}

// ── Read-only view for parents & students ──────────────────

function ReadOnlyAnnouncementsView({
  schoolId,
  userId,
  userRoles,
}: {
  schoolId: string;
  userId: string;
  userRoles: string[];
}) {
  const { data: announcements = [], isLoading } = usePublishedAnnouncements(schoolId, userRoles);
  const [expanded, setExpanded] = React.useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center">
        <Megaphone className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">No announcements yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((ann) => (
        <div
          key={ann.id}
          className={`rounded-xl border bg-card cursor-pointer transition-colors hover:bg-muted/30 ${ann.is_emergency ? "border-l-4 border-l-destructive" : ""}`}
          onClick={() => setExpanded(expanded === ann.id ? null : ann.id)}
        >
          <div className="p-4">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-sm font-semibold">{ann.title}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {(ann as { profiles?: { full_name?: string } }).profiles?.full_name ?? "School"} ·{" "}
              {new Date(ann.created_at).toLocaleDateString()}
            </p>
            {expanded === ann.id && (
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap border-t pt-3">
                {ann.body}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

