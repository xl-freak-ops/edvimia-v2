import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/school/EmptyState";

type Task = { id: string; title: string; done: boolean };

// Personal scratchpad for the day — not backed by a database table, so it
// starts empty per session rather than showing seeded/fake tasks.
export function TasksWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const remaining = tasks.filter((t) => !t.done).length;

  return (
    <Card className="rounded-2xl border-border/70 shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Your tasks</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">{remaining} remaining today</p>
        </div>
        {tasks.length > 0 && (
          <Badge variant="outline" className="rounded-full text-[10px]">
            {tasks.length} total
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-1">
        {tasks.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No tasks for today"
            description="This is your personal scratchpad — it isn't shared with anyone else."
          />
        ) : (
          tasks.map((t) => (
            <label
              key={t.id}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/50"
            >
              <Checkbox
                checked={t.done}
                onCheckedChange={(v) =>
                  setTasks((cur) => cur.map((x) => (x.id === t.id ? { ...x, done: !!v } : x)))
                }
              />
              <p className={cn("truncate text-sm font-medium", t.done && "text-muted-foreground line-through")}>
                {t.title}
              </p>
            </label>
          ))
        )}
      </CardContent>
    </Card>
  );
}
