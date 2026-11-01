import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { DICTIONARIES, type TranslationKey } from "@/i18n/dictionaries";
import { interpolate, type Vars } from "@/i18n/interpolate";
import { LANG_META } from "@/i18n/languages";
import { type AdminKey, adminEn } from "./en";
import { adminFr } from "./fr";
import { adminRo } from "./ro";

export const ADMIN_LANGS = ["ro", "en", "fr"] as const;
export type AdminLang = (typeof ADMIN_LANGS)[number];
const KEY = "hae-admin-lang";
const ADMIN_DICTS = { ro: adminRo, en: adminEn, fr: adminFr } as const;

interface AdminI18nValue {
  lang: AdminLang;
  locale: string;
  setLang: (l: AdminLang) => void;
  /** Admin keys first, then the site dictionary (fuel, body types, categories…). */
  t: (key: AdminKey | TranslationKey, vars?: Vars) => string;
}

const Ctx = createContext<AdminI18nValue | null>(null);

function initial(): AdminLang {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "ro" || v === "en" || v === "fr") return v;
  } catch {
    // ignore
  }
  // Romanian by default; staff can switch to English or French from the sidebar.
  return "ro";
}

export function AdminI18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AdminLang>(initial);
  const setLang = useCallback((l: AdminLang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<AdminI18nValue>(() => {
    const admin: Record<string, string> = ADMIN_DICTS[lang];
    const site: Record<string, string> = DICTIONARIES[lang];
    return {
      lang,
      locale: LANG_META[lang].locale,
      setLang,
      t: (key, vars) => interpolate(admin[key] ?? site[key] ?? key, vars),
    };
  }, [lang, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminT(): AdminI18nValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminT must be used inside <AdminI18nProvider>");
  return ctx;
}
