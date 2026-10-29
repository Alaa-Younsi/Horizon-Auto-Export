import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { DICTIONARIES, type TranslationKey } from "./dictionaries";
import { interpolate, interpolateRich, type Vars } from "./interpolate";
import { DEFAULT_LANG, LANG_META, LANG_STORAGE_KEY, type Lang, withLang } from "./languages";

interface LanguageContextValue {
  lang: Lang;
  locale: string;
  /** Switch language, keeping the visitor on the same page. */
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: Vars) => string;
  rich: (key: TranslationKey, nodes: Record<string, ReactNode>) => ReactNode;
  /** "/vehicles" -> "/en/vehicles" for the active language. */
  path: (to: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * The language lives in the URL (/ro, /en, /fr): shareable, crawlable and
 * hreflang-friendly. This provider is mounted by the /:lang route with the
 * validated value; switching language is a navigation, not hidden state.
 */
export function LanguageProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const navigate = useNavigate();
  const { pathname, search, hash } = useLocation();
  const meta = LANG_META[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // private mode: the URL still carries the language
    }
  }, [lang]);

  const setLang = useCallback(
    (next: Lang) => {
      if (next === lang) return;
      navigate(`${withLang(pathname, next)}${search}${hash}`, { preventScrollReset: true });
    },
    [lang, navigate, pathname, search, hash],
  );

  const value = useMemo<LanguageContextValue>(() => {
    const dict = DICTIONARIES[lang];
    const fallback = DICTIONARIES[DEFAULT_LANG];
    const raw = (key: TranslationKey) => dict[key] ?? fallback[key] ?? key;
    return {
      lang,
      locale: meta.locale,
      setLang,
      t: (key, vars) => interpolate(raw(key), vars),
      rich: (key, nodes) => interpolateRich(raw(key), nodes),
      path: (to) => `/${lang}${to === "/" ? "" : to}`,
    };
  }, [lang, meta.locale, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useI18n must be used inside <LanguageProvider>");
  return ctx;
}
