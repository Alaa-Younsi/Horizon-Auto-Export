import { LANG_META, type Lang } from "@/i18n/languages";
import type { Currency } from "@/types/db";

/**
 * "23.900 €" / "€23,900" / "23 900 €" — locale-correct grouping per language.
 * Render through <Price> so every call site formats the same way.
 */
export function formatPrice(value: number, currency: Currency, lang: Lang): string {
  return new Intl.NumberFormat(LANG_META[lang].locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    numberingSystem: "latn",
  }).format(value);
}

export function formatNumber(value: number, lang: Lang): string {
  return new Intl.NumberFormat(LANG_META[lang].locale, {
    maximumFractionDigits: 0,
    numberingSystem: "latn",
  }).format(value);
}

export function formatKm(value: number, lang: Lang): string {
  return `${formatNumber(value, lang)} km`;
}

/**
 * Bare YYYY-MM-DD dates are calendar days, not instants: parse them as local
 * dates or `new Date("2026-10-01")` (UTC midnight) shows the previous day west
 * of Greenwich.
 */
export function parseDay(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(value);
}

export function formatDate(
  value: string | Date,
  lang: Lang,
  opts?: Intl.DateTimeFormatOptions,
): string {
  const date = typeof value === "string" ? parseDay(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(LANG_META[lang].locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...opts,
  }).format(date);
}

export function formatDateTime(value: string, lang: Lang): string {
  return formatDate(value, lang, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Local calendar day as YYYY-MM-DD (never toISOString, which re-projects to UTC). */
export function toLocalDay(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** URL-safe slug: strips Romanian/French diacritics ("Škoda Octavia" -> "skoda-octavia"). */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}
