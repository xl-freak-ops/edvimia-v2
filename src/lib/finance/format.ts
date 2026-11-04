export function currencyFormatter(currency = "NGN", locale = "en-NG") {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    });
  } catch {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  }
}

export function fmtMoney(v: number | string | null | undefined, currency = "NGN") {
  const n = typeof v === "string" ? Number(v) : (v ?? 0);
  return currencyFormatter(currency).format(Number.isFinite(n) ? n : 0);
}

export function fmtDate(v: string | Date | null | undefined) {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtDateTime(v: string | Date | null | undefined) {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}