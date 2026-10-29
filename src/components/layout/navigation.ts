import type { TranslationKey } from "@/i18n/dictionaries";

/** Keep in sync with the <Route>s in App.tsx and STATIC_ROUTES in scripts/seo-routes.ts. */
export const NAV_ITEMS: Array<{ to: string; key: TranslationKey; end?: boolean }> = [
  { to: "/", key: "nav.home", end: true },
  { to: "/about", key: "nav.about" },
  { to: "/vehicles", key: "nav.vehicles" },
  { to: "/services", key: "nav.services" },
  { to: "/contact", key: "nav.contact" },
];
