import { DEFAULT_LANG, type Lang, SITE_LANGS } from "@/i18n/languages";
import type { Localized } from "@/types/db";

/**
 * Resolve a localized jsonb field: active language -> Romanian (source) -> any
 * other language that has text. Per field and per language, so a half-translated
 * row degrades to real text instead of an empty heading.
 */
export function pick(value: Localized | null | undefined, lang: Lang, fallback = ""): string {
  if (!value) return fallback;
  const own = value[lang]?.trim();
  if (own) return own;
  const source = value[DEFAULT_LANG]?.trim();
  if (source) return source;
  for (const l of SITE_LANGS) {
    const v = value[l]?.trim();
    if (v) return v;
  }
  return fallback;
}

/** Multi-line localized text -> non-empty trimmed lines (equipment lists). */
export function pickLines(value: Localized | null | undefined, lang: Lang): string[] {
  return pick(value, lang)
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-•*·]\s*/, "").trim())
    .filter(Boolean);
}

/** Drop empty translations so we never store {"en": ""}. */
export function cleanLocalized(value: Localized): Localized {
  const out: Localized = {};
  for (const [k, v] of Object.entries(value) as [Lang, string | undefined][]) {
    const trimmed = v?.trim();
    if (trimmed) out[k] = trimmed;
  }
  return out;
}

export function hasAnyText(value: Localized | null | undefined): boolean {
  return Boolean(value && SITE_LANGS.some((l) => value[l]?.trim()));
}
