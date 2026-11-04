import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/access-denied")({
  head: () => ({ meta: [{ title: "Access denied · Edvimia" }] }),
  component: AccessDeniedPage,
});

function AccessDeniedPage() {
  const router = useRouter();
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="max-w-md text-center animate-fade-in">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive shadow-soft">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your role doesn't have permission to view this page. If you think this is a mistake,
          contact your school administrator.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="outline" onClick={() => router.history.back()}>
            Go back
          </Button>
          <Button asChild>
            <Link to="/">Return home</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/recover">Recover access</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}