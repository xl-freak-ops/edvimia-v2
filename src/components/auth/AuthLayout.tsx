import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  illustration?: ReactNode;
};

export function AuthLayout({ title, subtitle, children, footer, illustration }: Props) {
  return (
    <div className="grid min-h-screen w-full bg-background lg:grid-cols-2">
      {/* Form pane */}
      <div className="flex min-h-screen flex-col px-5 py-8 sm:px-10 lg:px-16">
        <Link to="/welcome" className="inline-flex items-center gap-2.5 self-start">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-glow">
            <span className="text-sm font-bold tracking-tight">E</span>
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-tight">Edvimia</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              School OS
            </span>
          </div>
        </Link>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10 animate-fade-in">
          <div className="mb-7 space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Edvimia · The AI School Operating System
        </p>
      </div>

      {/* Illustration pane */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-accent-brand lg:block">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_45%),radial-gradient(circle_at_80%_70%,white,transparent_40%)]" />
        <div className="relative flex h-full flex-col justify-between p-14 text-primary-foreground">
          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-md w-fit">
            <Sparkles className="h-3.5 w-3.5" />
            Powered by Edvi · AI
          </div>
          <div className="space-y-6">
            {illustration ?? (
              <>
                <h2 className="text-4xl font-bold leading-tight tracking-tight">
                  Run your school with the intelligence of tomorrow.
                </h2>
                <p className="max-w-md text-base leading-relaxed text-primary-foreground/80">
                  Edvimia eliminates paperwork, automates administration, and helps you decide
                  with confidence — from attendance to fees to performance.
                </p>
                <div className="grid max-w-md grid-cols-3 gap-4 pt-4">
                  {[
                    { k: "+38%", v: "Faster admin" },
                    { k: "12k+", v: "Schools served" },
                    { k: "99.9%", v: "Uptime" },
                  ].map((s) => (
                    <div
                      key={s.v}
                      className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-md"
                    >
                      <div className="text-xl font-bold">{s.k}</div>
                      <div className="text-[11px] uppercase tracking-wider text-primary-foreground/70">
                        {s.v}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <p className="text-xs text-primary-foreground/60">
            Trusted by primary and secondary schools across 14 countries.
          </p>
        </div>
      </div>
    </div>
  );
}