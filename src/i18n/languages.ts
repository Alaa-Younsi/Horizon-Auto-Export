export const SITE_LANGS = ["ro", "en", "fr"] as const;
export type Lang = (typeof SITE_LANGS)[number];
/** Romanian: the company is in Bucharest and the approved mock-up is Romanian. */
export const DEFAULT_LANG: Lang = "ro";
export const LANG_STORAGE_KEY = "hae-lang";

interface LangMeta {
  /** The language in itself — what a speaker looks for in a switcher. */
  native: string;
  short: string;
  /** Intl locale for dates and numbers. */
  locale: string;
  ogLocale: string;
  /** Flag shown in the switcher (ISO country). */
  flag: "ro" | "gb" | "fr";
}

export const LANG_META: Record<Lang, LangMeta> = {
  ro: { native: "Română", short: "RO", locale: "ro-RO", ogLocale: "ro_RO", flag: "ro" },
  en: { native: "English", short: "EN", locale: "en-GB", ogLocale: "en_GB", flag: "gb" },
  fr: { native: "Français", short: "FR", locale: "fr-FR", ogLocale: "fr_FR", flag: "fr" },
};

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (SITE_LANGS as readonly string[]).includes(value);
}

/** Stored choice -> browser preference -> Romanian. Used only for the bare "/" entry. */
export function preferredLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    // private mode
  }
  if (typeof navigator !== "undefined") {
    for (const tag of navigator.languages ?? [navigator.language]) {
      const base = tag?.slice(0, 2).toLowerCase();
      if (isLang(base)) return base;
    }
  }
  return DEFAULT_LANG;
}

/** Swap (or add) the language prefix of a path: ("/en/vehicles", "fr") -> "/fr/vehicles". */
export function withLang(pathname: string, lang: Lang): string {
  const rest = pathname.replace(/^\/(ro|en|fr)(?=\/|$)/, "");
  return `/${lang}${rest === "/" ? "" : rest}`;
}
