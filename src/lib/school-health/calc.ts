export type HealthDimension = {
  key: string;
  label: string;
  score: number; // 0-100
  detail: string;
};

export function overallHealthScore(dimensions: HealthDimension[]): number {
  const scored = dimensions.filter((d) => d.score >= 0);
  if (!scored.length) return 0;
  return Math.round(scored.reduce((s, d) => s + d.score, 0) / scored.length);
}

export function healthBand(score: number): { label: string; tone: string } {
  if (score >= 85) return { label: "Excellent", tone: "text-emerald-600 bg-emerald-500/10" };
  if (score >= 70) return { label: "Healthy", tone: "text-sky-600 bg-sky-500/10" };
  if (score >= 50) return { label: "Needs attention", tone: "text-amber-600 bg-amber-500/10" };
  return { label: "At risk", tone: "text-rose-600 bg-rose-500/10" };
}
