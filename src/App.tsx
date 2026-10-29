import { QueryClientProvider } from "@tanstack/react-query";
import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { AddLangRedirect, LangLayout, RootRedirect } from "@/components/layout/PublicLayout";
import { SITE_LANGS } from "@/i18n/languages";
import { queryClient } from "@/lib/queryClient";
import Home from "@/pages/Home";

// Home is eager (it's the LCP route); everything else is split per route.
const About = lazy(() => import("@/pages/About"));
const Services = lazy(() => import("@/pages/Services"));
const Vehicles = lazy(() => import("@/pages/Vehicles"));
const VehicleDetail = lazy(() => import("@/pages/VehicleDetail"));
const Contact = lazy(() => import("@/pages/Contact"));
const Legal = lazy(() => import("@/pages/Legal"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const AdminApp = lazy(() => import("@/pages/admin/AdminApp"));

/**
 * Public pages live under a STATIC language prefix (/ro, /en, /fr) — not a
 * `/:lang` param: React Router ranks `/:lang/vehicles/:slug` above `/admin/*`,
 * which would swallow /admin/vehicles/… into the public site. "/" picks a
 * language; any other unprefixed path ("/vehicles") is redirected into one.
 * Keep in sync with STATIC_ROUTES in scripts/seo-routes.ts and
 * NAV_ITEMS in components/layout/navigation.ts.
 */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/admin/*" element={<AdminApp />} />
          {SITE_LANGS.map((lang) => (
            <Route key={lang} path={`/${lang}`} element={<LangLayout lang={lang} />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="services" element={<Services />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="vehicles/:slug" element={<VehicleDetail />} />
              <Route path="contact" element={<Contact />} />
              <Route path="privacy" element={<Legal doc="privacy" />} />
              <Route path="terms" element={<Legal doc="terms" />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          ))}
          <Route path="*" element={<AddLangRedirect />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
