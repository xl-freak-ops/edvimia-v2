import * as React from "react";
import { Check, ChevronsUpDown, Loader2, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSchoolMembers, type SchoolMember } from "@/lib/communication/hooks";

// ── Role helpers ───────────────────────────────────────────

const STAFF_ROLES = new Set([
  "school_admin", "principal", "vice_principal", "form_teacher",
  "subject_teacher", "bursar", "account_officer", "receptionist",
  "librarian", "other_staff",
]);

const ROLE_LABELS: Record<string, string> = {
  school_admin:    "Admin",
  principal:       "Principal",
  vice_principal:  "Vice Principal",
  form_teacher:    "Form Teacher",
  subject_teacher: "Subject Teacher",
  bursar:          "Bursar",
  account_officer: "Account Officer",
  receptionist:    "Receptionist",
  librarian:       "Librarian",
  other_staff:     "Other Staff",
  parent:          "Parent",
  student:         "Student",
};

type Category = "all" | "staff" | "parents" | "students";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "all",      label: "All"      },
  { value: "staff",    label: "Staff"    },
  { value: "parents",  label: "Parents"  },
  { value: "students", label: "Students" },
];

function getCategory(role: string | null): "staff" | "parents" | "students" | "other" {
  if (!role) return "other";
  if (STAFF_ROLES.has(role)) return "staff";
  if (role === "parent")  return "parents";
  if (role === "student") return "students";
  return "other";
}

function roleLabel(role: string | null) {
  return role ? (ROLE_LABELS[role] ?? role) : "Unknown";
}

function memberDisplayName(m: SchoolMember) {
  return m.full_name?.trim() || m.email || "Unknown";
}

function matchesSearch(m: SchoolMember, q: string) {
  if (!q) return true;
  const lower = q.toLowerCase();
  return (
    (m.full_name ?? "").toLowerCase().includes(lower) ||
    (m.email ?? "").toLowerCase().includes(lower) ||
    roleLabel(m.role).toLowerCase().includes(lower)
  );
}

// ── Avatar color ───────────────────────────────────────────

const PALETTES = [
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
  return PALETTES[Math.abs(h) % PALETTES.length];
}

function nameInitials(m: SchoolMember) {
  const name = m.full_name?.trim();
  if (!name) return (m.email ?? m.id).slice(0, 2).toUpperCase();
  const parts = name.split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

// ── MemberRow (shared chip used in dropdown items) ─────────

function MemberRow({ m, isSelected }: { m: SchoolMember; isSelected: boolean }) {
  const palette = avatarPalette(m.id);
  const noPortal = m.has_portal === false;
  return (
    <div className={cn("flex items-center gap-2.5 w-full", noPortal && "opacity-50")}>
      <div className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
        palette.bg, palette.text,
      )}>
        {nameInitials(m)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium leading-tight truncate">{memberDisplayName(m)}</p>
          {noPortal && (
            <span className="shrink-0 rounded px-1 py-0 text-[10px] font-medium bg-muted text-muted-foreground border">
              No portal
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground leading-tight truncate">
          {roleLabel(m.role)}
          {m.email && m.full_name ? ` · ${m.email}` : ""}
          {noPortal ? " · Can't be messaged" : ""}
        </p>
      </div>
      <Check className={cn("h-4 w-4 shrink-0 text-primary", isSelected ? "opacity-100" : "opacity-0")} />
    </div>
  );
}

// ── Component ──────────────────────────────────────────────

interface Props {
  schoolId: string;
  excludeId?: string;
  /** IDs of recently messaged contacts, ordered most-recent-first */
  recentContactIds?: string[];
  value: string;
  onChange: (userId: string, displayName: string) => void;
}

export function UserSearchCombobox({
  schoolId, excludeId, recentContactIds = [], value, onChange,
}: Props) {
  const [open, setOpen]       = React.useState(false);
  const [search, setSearch]   = React.useState("");
  const [category, setCategory] = React.useState<Category>("all");

  const { data: members = [], isLoading } = useSchoolMembers(schoolId);

  const eligible = React.useMemo(
    () => members.filter((m) => m.id !== excludeId),
    [members, excludeId],
  );

  const selected = eligible.find((m) => m.id === value) ?? null;

  // Recent contacts: members who are in recentContactIds, in that order
  const recentMembers = React.useMemo(() => {
    if (!recentContactIds.length || search) return [];
    return recentContactIds
      .map((id) => eligible.find((m) => m.id === id))
      .filter((m): m is SchoolMember => !!m)
      .slice(0, 5);
  }, [recentContactIds, eligible, search]);

  // Filtered list (respects category + search text)
  const filtered = React.useMemo(() => {
    return eligible.filter((m) => {
      if (category !== "all" && getCategory(m.role) !== category) return false;
      return matchesSearch(m, search);
    });
  }, [eligible, category, search]);

  // Grouped for "All members" section
  const groups = React.useMemo(() => {
    if (category !== "all") {
      return [{ label: CATEGORIES.find((c) => c.value === category)!.label, members: filtered }];
    }
    const staff    = filtered.filter((m) => getCategory(m.role) === "staff");
    const parents  = filtered.filter((m) => getCategory(m.role) === "parents");
    const students = filtered.filter((m) => getCategory(m.role) === "students");
    const other    = filtered.filter((m) => getCategory(m.role) === "other");
    return [
      { label: "Staff",    members: staff    },
      { label: "Parents",  members: parents  },
      { label: "Students", members: students },
      { label: "Other",    members: other    },
    ].filter((g) => g.members.length > 0);
  }, [filtered, category]);

  function handleSelect(m: SchoolMember) {
    if (m.has_portal === false) return; // no portal account — cannot receive messages
    onChange(m.id, memberDisplayName(m));
    setSearch("");
    setOpen(false);
  }

  const palette = selected ? avatarPalette(selected.id) : null;

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch(""); }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal h-auto py-2"
        >
          {isLoading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading members…
            </span>
          ) : selected ? (
            <span className="flex items-center gap-2">
              <div className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                palette!.bg, palette!.text,
              )}>
                {nameInitials(selected)}
              </div>
              <span className="font-medium text-foreground">{memberDisplayName(selected)}</span>
              <span className="text-[11px] text-muted-foreground">— {roleLabel(selected.role)}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              Search or select recipient…
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        {/* Category filter */}
        <div className="flex gap-1 border-b bg-muted/30 px-2 pt-2 pb-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                category === cat.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <Command shouldFilter={false}>
          <CommandInput
            placeholder={search ? "Searching…" : "Type a name, role, or email…"}
            value={search}
            onValueChange={setSearch}
            autoFocus
          />
          <CommandList className="max-h-[280px]">
            {/* Recent contacts (shown when no search text) */}
            {recentMembers.length > 0 && !search && (
              <>
                <CommandGroup
                  heading={
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      <Clock className="h-3 w-3" />
                      Recent
                    </span>
                  }
                >
                  {recentMembers.map((m) => (
                    <CommandItem
                      key={`recent-${m.id}`}
                      value={`recent-${m.id}`}
                      onSelect={() => handleSelect(m)}
                      className="py-2"
                    >
                      <MemberRow m={m} isSelected={value === m.id} />
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Main results */}
            {filtered.length === 0 ? (
              <CommandEmpty className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No members match "{search}"</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Try a different name or category</p>
              </CommandEmpty>
            ) : (
              groups.map((group) => (
                <CommandGroup key={group.label} heading={group.label}>
                  {group.members.map((m) => (
                    <CommandItem
                      key={m.id}
                      value={m.id}
                      onSelect={() => handleSelect(m)}
                      disabled={m.has_portal === false}
                      className="py-2"
                    >
                      <MemberRow m={m} isSelected={value === m.id} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
