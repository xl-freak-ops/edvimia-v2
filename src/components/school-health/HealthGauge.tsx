import { healthBand } from "@/lib/school-health/calc";

export function HealthGauge({ score }: { score: number }) {
  const band = healthBand(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-2">
      <div className="relative grid h-40 w-40 place-items-center">
        <svg viewBox="0 0 120 120" className="h-40 w-40 -rotate-90">
          <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-extrabold tabular-nums tracking-tight">{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${band.tone}`}>{band.label}</span>
    </div>
  );
}
