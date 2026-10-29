import { MessageCircle } from "lucide-react";
import { Suspense, useLayoutEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ScrollProgress } from "@/components/fx/ScrollProgress";
import { SmoothScroll } from "@/components/fx/SmoothScroll";
import { useReducedMotion } from "@/hooks/useMediaFlags";
import { useSiteSettings } from "@/hooks/usePublicData";
import { LanguageProvider, useI18n } from "@/i18n/LanguageProvider";
import { type Lang, preferredLang } from "@/i18n/languages";
import { cn } from "@/lib/cn";
import { whatsappHref } from "@/lib/contact";
import { Footer } from "./Footer";
import { Header } from "./Header";

/** One per language prefix (see App.tsx): provides the language to the public site. */
export function LangLayout({ lang }: { lang: Lang }) {
  return (
    <LanguageProvider lang={lang}>
      <PublicLayout />
    </LanguageProvider>
  );
}

/** A path without a language ("/vehicles") is redirected into one ("/ro/vehicles"). */
export function AddLangRedirect() {
  const { pathname, search, hash } = useLocation();
  return <Navigate to={`/${preferredLang()}${pathname}${search}${hash}`} replace />;
}

/** The bare "/" entry: stored choice -> browser language -> Romanian. */
export function RootRedirect() {
  const { search, hash } = useLocation();
  return <Navigate to={`/${preferredLang()}${search}${hash}`} replace />;
}

/**
 * A navy curtain with a gold horizon line lifts off each new page. Keyed on the
 * path WITHOUT the language prefix, so switching language never plays it, and
 * skipped on the first load (the hero has its own intro).
 */
function RouteCurtain() {
  const { pathname } = useLocation();
  const page = pathname.replace(/^\/(ro|en|fr)(?=\/|$)/, "") || "/";
  const first = useRef(page);
  const [key, setKey] = useState<string | null>(null);
  // Layout effect: the curtain must be up before the new page's first paint.
  useLayoutEffect(() => {
    if (page !== first.current) {
      first.current = "";
      setKey(page);
    }
  }, [page]);
  if (!key) return null;
  return (
    <div
      key={key}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[65] origin-top bg-navy-900 [animation:curtain-up_0.85s_var(--ease-in-out-circ)_0.05s_both]"
    >
      <span className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
    </div>
  );
}

function FloatingWhatsApp() {
  const { t } = useI18n();
  const { data: s } = useSiteSettings();
  const href = whatsappHref(s?.whatsapp_e164);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("contact.whatsapp")}
      className="group fixed end-4 bottom-4 z-40 grid size-14 place-items-center rounded-full bg-navy-900 text-gold-300 shadow-[0_18px_40px_-14px_rgb(4_14_36/0.8)] ring-1 ring-gold-500/40 transition-transform duration-300 hover:scale-105 sm:end-6 sm:bottom-6"
    >
      <span className="absolute inset-0 animate-pulse-ring rounded-full ring-1 ring-gold-400/50" />
      <MessageCircle className="size-6" aria-hidden />
    </a>
  );
}

function PageFallback() {
  return <div className="min-h-[70vh]" />;
}

export function PublicLayout() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const reduced = useReducedMotion();
  const mainRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const [curtain, setCurtain] = useState(false);

  // Curtain-reveal footer: pinned under the page while it fits the viewport; the
  // page keeps a bottom margin of the footer's height to scroll it into view.
  useLayoutEffect(() => {
    const footer = footerRef.current;
    const main = mainRef.current;
    if (!footer || !main) return;
    const measure = () => {
      const h = footer.offsetHeight;
      const fits = !reduced && h < window.innerHeight * 0.92 && window.innerWidth >= 768;
      main.style.setProperty("--footer-h", `${h}px`);
      setCurtain(fits);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(footer);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [reduced]);

  return (
    <SmoothScroll>
      <a
        href="#main"
        className="sr-only z-[80] rounded-md bg-navy-900 px-4 py-3 text-white focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
      >
        {t("nav.skip")}
      </a>
      <ScrollProgress />
      <Header />
      <main
        id="main"
        ref={mainRef}
        className={cn(
          "relative z-10 bg-white shadow-[0_40px_60px_-30px_rgb(4_14_36/0.35)]",
          curtain && "mb-[var(--footer-h)]",
        )}
      >
        <ErrorBoundary key={pathname}>
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <div className={cn(curtain ? "fixed inset-x-0 bottom-0 z-0" : "relative")}>
        <Footer ref={footerRef} />
      </div>
      <FloatingWhatsApp />
      <RouteCurtain />
    </SmoothScroll>
  );
}
