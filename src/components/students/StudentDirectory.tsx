import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Search,
  Download,
  Printer,
  MoreHorizontal,
  UserPlus,
  FileSpreadsheet,
  FileText,
  Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { StudentStatusBadge } from "./StudentStatusBadge";
import { EmptyState } from "@/components/school/EmptyState";
import { GraduationCap } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { exportStudentsCsv, exportStudentsExcel } from "@/lib/students/export";

type Row = Tables<"students"> & {
  classes?: { name: string } | null;
  class_arms?: { name: string } | null;
};

function initials(f?: string | null, s?: string | null) {
  return `${(f ?? "").charAt(0)}${(s ?? "").charAt(0)}`.toUpperCase() || "S";
}

const PAGE_SIZE = 15;

export function StudentDirectory({ students }: { students: Row[] }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

  const classes = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => s.classes?.name && set.add(s.classes.name));
    return Array.from(set).sort();
  }, [students]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return students.filter((s) => {
      if (classFilter !== "all" && s.classes?.name !== classFilter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (genderFilter !== "all" && s.gender !== genderFilter) return false;
      if (!term) return true;
      return (
        s.admission_number.toLowerCase().includes(term) ||
        s.first_name.toLowerCase().includes(term) ||
        s.surname.toLowerCase().includes(term) ||
        (s.middle_name ?? "").toLowerCase().includes(term)
      );
    });
  }, [students, q, classFilter, statusFilter, genderFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <Card className="shadow-soft">
      <CardContent className="p-4 md:p-6">
        {/* Toolbar */}
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(0); }}
                placeholder="Search name or admission no…"
                className="pl-9"
              />
            </div>
            <Select value={classFilter} onValueChange={(v) => { setClassFilter(v); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={genderFilter} onValueChange={(v) => { setGenderFilter(v); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="Gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportStudentsCsv(filtered)}>
                  <FileText className="mr-2 h-4 w-4" /> Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportStudentsExcel(filtered)}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" /> Print
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" className="gap-2" asChild>
              <Link to="/students/new"><UserPlus className="h-4 w-4" /> Add Student</Link>
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No students yet"
            description="Add your first student to build the directory."
            action={
              <Button size="sm" asChild>
                <Link to="/students/new">Add Student</Link>
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-[280px]">Student</TableHead>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Class / Arm</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>House</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((s) => (
                    <TableRow key={s.id} className="cursor-pointer" onClick={() => navigate({ to: "/students/$id", params: { id: s.id } })}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={s.photo_url ?? undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {initials(s.first_name, s.surname)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">
                              {s.surname} {s.first_name} {s.middle_name ?? ""}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {s.student_code}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{s.admission_number}</TableCell>
                      <TableCell className="text-sm">
                        {s.classes?.name ?? "—"}
                        {s.class_arms?.name ? <span className="text-muted-foreground"> · {s.class_arms.name}</span> : null}
                      </TableCell>
                      <TableCell className="text-sm capitalize">{s.gender}</TableCell>
                      <TableCell className="text-sm">{s.house ?? "—"}</TableCell>
                      <TableCell><StudentStatusBadge status={s.status} /></TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to="/students/$id" params={{ id: s.id }}>
                                <Eye className="mr-2 h-4 w-4" /> View profile
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <div>
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <span className="tabular-nums">Page {page + 1} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}