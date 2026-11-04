import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, ShieldCheck, BarChart3, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome to Edvimia · The AI School Operating System" },
      { name: "description", content: "Edvimia is the AI-powered operating system for primary and secondary schools." },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background flourish */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-1/2 -right-40 h-[460px] w-[460px] rounded-full bg-accent-brand/20 blur-3xl" />
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/welcome" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-glow">
            <span className="text-sm font-bold">E</span>
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-tight">Edvimia</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              School OS
            </span>
          </div>
        </Link>
        <Button asChild variant="ghost" size="sm" className="rounded-lg">
          <Link to="/login">Sign in</Link>
        </Button>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col items-center px-6 pt-12 pb-24 text-center animate-fade-in">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-accent-brand" />
          Now with Edvi · the AI school assistant
        </span>

        <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
          The operating system for the
          <span className="bg-gradient-to-r from-primary to-accent-brand bg-clip-text text-transparent">
            {" "}
            modern school.
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Eliminate paperwork. Automate administration. Decide with intelligence — from
          attendance and timetables to fees, results, and parent communication.
        </p>

        <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 rounded-xl px-6 text-sm font-semibold shadow-soft">
            <Link to="/login">Login <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-6 text-sm font-semibold">
            <Link to="/signup">Create school account</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="h-12 rounded-xl px-6 text-sm font-semibold">
            <a href="mailto:hello@edvimia.com?subject=Request%20a%20demo">Request demo</a>
          </Button>
        </div>

        <div className="mt-20 grid w-full gap-4 sm:grid-cols-3">
          {[
            { icon: GraduationCap, t: "Built for schools", d: "Designed end-to-end for primary and secondary education." },
            { icon: BarChart3, t: "Decide with data", d: "Live attendance, performance, and finance intelligence." },
            { icon: ShieldCheck, t: "Secure by design", d: "Role-based access, encryption, and audit trails out of the box." },
          ].map((f) => (
            <div
              key={f.t}
              className="rounded-2xl border border-border/70 bg-card/70 p-6 text-left shadow-soft backdrop-blur-sm"
            >
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold tracking-tight">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}