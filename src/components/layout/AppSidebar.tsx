import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Building2,
  CalendarCheck2,
  ClipboardList,
  CalendarDays,
  Wallet,
  MessageSquare,
  BarChart3,
  LineChart,
  HeartPulse,
  Sparkles,
  Settings,
  LogOut,
  HeartHandshake,
  BookOpen,
  Bell,
  User,
  Home,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthProvider";
import { primaryRole, ROLE_SLUG, type AppRole } from "@/lib/auth/roles";
import { hasPermission } from "@/lib/auth/permissions";

// ── Nav definitions ────────────────────────────────────────

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  exact?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

/**
 * Build the staff nav dynamically from the user's actual permissions.
 * Every menu item is gated — roles that lack the permission simply don't see it.
 */
const staffNav = (dashboardUrl: string, roles: AppRole[]): NavGroup[] => {
  const can = (p: Parameters<typeof hasPermission>[1]) => hasPermission(roles, p);

  const workspace: NavItem[] = [
    { title: "Dashboard",      url: dashboardUrl,    icon: LayoutDashboard, exact: true },
    ...(can("manage_school")      ? [{ title: "School",         url: "/school",        icon: Building2      }] as NavItem[] : []),
    ...(can("view_students")      ? [{ title: "Students",       url: "/students",      icon: GraduationCap  }] as NavItem[] : []),
    ...(can("view_teachers")      ? [{ title: "Teachers",       url: "/teachers",      icon: Users          }] as NavItem[] : []),
    ...(can("view_attendance")    ? [{ title: "Attendance",     url: "/attendance",    icon: CalendarCheck2 }] as NavItem[] : []),
    ...(can("view_results")       ? [{ title: "Results",        url: "/results",       icon: ClipboardList  }] as NavItem[] : []),
    ...(can("view_timetable")     ? [{ title: "Timetable",      url: "/timetable",     icon: CalendarDays   }] as NavItem[] : []),
    ...(can("view_finance")       ? [{ title: "Finance",        url: "/finance",       icon: Wallet         }] as NavItem[] : []),
    ...(can("view_communication") ? [{ title: "Communication",  url: "/communication", icon: MessageSquare  }] as NavItem[] : []),
    ...(can("view_reports")       ? [{ title: "Reports",        url: "/reports",       icon: BarChart3      }] as NavItem[] : []),
  ];

  const intelligence: NavItem[] = [
    ...(can("view_analytics")     ? [{ title: "Analytics",           url: "/analytics",     icon: LineChart  }] as NavItem[] : []),
    ...(can("view_school_health") ? [{ title: "School Health",       url: "/school-health", icon: HeartPulse }] as NavItem[] : []),
    ...(can("view_ai")            ? [{ title: "Edvi · AI Assistant", url: "/ai",            icon: Sparkles, badge: "New" }] as NavItem[] : []),
  ];

  const groups: NavGroup[] = [{ label: "Workspace", items: workspace }];
  if (intelligence.length > 0) {
    groups.push({ label: "Intelligence", items: intelligence });
  }
  return groups;
};

const parentNav = (dashboardUrl: string): NavGroup[] => [
  {
    label: "My Portal",
    items: [
      { title: "Home",          url: dashboardUrl,     icon: Home,          exact: true },
      { title: "Results",       url: "/results",       icon: ClipboardList              },
      { title: "Attendance",    url: "/attendance",    icon: CalendarCheck2             },
      { title: "Fees",          url: "/finance",       icon: Wallet                     },
      { title: "Homework",      url: "/communication", icon: BookOpen                   },
      { title: "Announcements", url: "/communication", icon: Bell                       },
      { title: "Messages",      url: "/communication", icon: MessageSquare              },
    ],
  },
];

const studentNav = (dashboardUrl: string): NavGroup[] => [
  {
    label: "My Portal",
    items: [
      { title: "Home",          url: dashboardUrl,     icon: Home,          exact: true },
      { title: "Timetable",     url: "/timetable",     icon: CalendarDays               },
      { title: "My Homework",   url: "/communication", icon: BookOpen                   },
      { title: "Attendance",    url: "/attendance",    icon: CalendarCheck2             },
      { title: "Results",       url: "/results",       icon: ClipboardList              },
      { title: "Announcements", url: "/communication", icon: Bell                       },
    ],
  },
];

function getNavGroups(role: AppRole | null, roles: AppRole[], dashboardUrl: string): NavGroup[] {
  if (role === "parent") return parentNav(dashboardUrl);
  if (role === "student") return studentNav(dashboardUrl);
  return staffNav(dashboardUrl, roles);
}

// ── Component ──────────────────────────────────────────────

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { roles, signOut } = useAuth();
  const role = primaryRole(roles);
  const dashboardUrl = role ? `/dashboard/${ROLE_SLUG[role]}` : "/";
  const navGroups = getNavGroups(role, roles, dashboardUrl);

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  const isParentOrStudent = role === "parent" || role === "student";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* ── Header / Logo ─────────────────────────────────── */}
      <SidebarHeader className="px-3 pt-4 pb-3">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-sidebar-accent"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-glow">
            <span className="text-sm font-bold tracking-tight">E</span>
          </span>
          {!collapsed && (
            <div className="flex min-w-0 flex-col leading-none">
              <span className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">
                Edvimia
              </span>
              <span className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {role === "parent" ? "Parent Portal" : role === "student" ? "Student Portal" : "School OS"}
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      {/* ── Navigation ────────────────────────────────────── */}
      <SidebarContent className="px-2">
        {navGroups.map((group, gi) => (
          <SidebarGroup key={group.label} className={cn(gi > 0 && "mt-2")}>
            {!collapsed && (
              <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url, item.exact)}
                      tooltip={item.title}
                      className={cn(
                        "h-9 rounded-lg font-medium transition-all",
                        "hover:bg-sidebar-accent",
                        "data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold",
                      )}
                    >
                      <Link to={item.url}>
                        <item.icon
                          className={cn(
                            "h-4 w-4",
                            item.badge && "text-accent-brand",
                          )}
                        />
                        <span className="flex-1">{item.title}</span>
                        {!collapsed && item.badge && (
                          <span className="rounded-full bg-accent-brand/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent-brand">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* ── System ──────────────────────────────────────── */}
        <SidebarGroup className="mt-2">
          {!collapsed && (
            <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              System
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/profile", true)}
                  tooltip="Profile"
                  className="h-9 rounded-lg font-medium transition-all hover:bg-sidebar-accent data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold"
                >
                  <Link to="/profile">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/settings", true)}
                  tooltip="Settings"
                  className="h-9 rounded-lg font-medium transition-all hover:bg-sidebar-accent data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold"
                >
                  <Link to="/settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Logout"
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/login" });
                  }}
                  className="h-9 rounded-lg font-medium transition-all hover:bg-sidebar-accent text-destructive hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer ────────────────────────────────────────── */}
      {!collapsed && !isParentOrStudent && (
        <SidebarFooter className="p-3">
          <div className="relative overflow-hidden rounded-xl border border-sidebar-border bg-gradient-to-br from-primary/8 via-sidebar to-accent-brand/8 p-3.5">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-accent-brand" />
              <span className="text-xs font-semibold tracking-tight">
                Upgrade to Pro
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Unlock predictive analytics and unlimited AI reports.
            </p>
          </div>
        </SidebarFooter>
      )}

      {!collapsed && isParentOrStudent && (
        <SidebarFooter className="p-3">
          <div className="rounded-xl border border-sidebar-border bg-gradient-to-br from-primary/8 via-sidebar to-accent-brand/8 p-3.5">
            <div className="mb-1.5 flex items-center gap-2">
              {role === "parent" ? (
                <HeartHandshake className="h-3.5 w-3.5 text-accent-brand" />
              ) : (
                <GraduationCap className="h-3.5 w-3.5 text-accent-brand" />
              )}
              <span className="text-xs font-semibold tracking-tight">
                {role === "parent" ? "Parent Portal" : "Student Portal"}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {role === "parent"
                ? "Track your children's academic progress in real time."
                : "Stay on top of your classes, results, and homework."}
            </p>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
