import { useEffect } from "react";
import { useLocation } from "react-router";
import { useI18n } from "@/i18n/LanguageProvider";
import { LANG_META, SITE_LANGS, withLang } from "@/i18n/languages";
import { BRAND_NAME } from "@/lib/brand";
import { SITE_URL } from "@/lib/env";

interface SeoOptions {
  title: string;
  description?: string;
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    if (hreflang) el.hreflang = hreflang;
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * Per-route title/description/canonical/hreflang/OG. Helps Googlebot (which runs
 * JS) and browser tabs; social crawlers get middleware.ts / index.html instead.
 * og:image is set on EVERY route, so a page without an image never inherits the
 * previous page's photo.
 */
export function useSeo({ title, description, image, noindex, jsonLd }: SeoOptions): void {
  const { pathname } = useLocation();
  const { lang } = useI18n();
  const ld = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    const previousTitle = document.title;
    const fullTitle = title.includes(BRAND_NAME) ? title : `${title} | ${BRAND_NAME}`;
    const url = `${SITE_URL}${pathname}`;
    const img = image ?? `${SITE_URL}/og-image.jpg`;
    document.title = fullTitle;
    upsertLink("canonical", url);
    for (const l of SITE_LANGS) upsertLink("alternate", `${SITE_URL}${withLang(pathname, l)}`, l);
    upsertLink("alternate", `${SITE_URL}${withLang(pathname, "ro")}`, "x-default");
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", img);
    upsertMeta("name", "twitter:image", img);
    upsertMeta("property", "og:locale", LANG_META[lang].ogLocale);
    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    if (description) {
      upsertMeta("name", "description", description);
      upsertMeta("property", "og:description", description);
      upsertMeta("name", "twitter:description", description);
    }
    let script: HTMLScriptElement | null = null;
    if (ld) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.page = "1";
      script.textContent = ld;
      document.head.appendChild(script);
    }
    return () => {
      document.title = previousTitle;
      script?.remove();
    };
  }, [title, description, image, noindex, ld, pathname, lang]);
}
