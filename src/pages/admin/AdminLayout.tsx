import { ExternalLink, Languages, LogOut, Menu, ShieldAlert, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Suspense, useEffect, useRef, useState } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation } from "react-router";
import markLight from "@/assets/logo-mark-light.webp";
import { useAuth } from "@/auth/AuthProvider";
import { useIsDesktop } from "@/hooks/useMediaFlags";
import { LANG_META } from "@/i18n/languages";
import { cn } from "@/lib/cn";
import { ADMIN_SECTIONS, type AdminSection, routeToSection } from "./adminSections";
import { ADMIN_LANGS, useAdminT } from "./i18n/AdminI18n";
import { Spinner } from "./ui/kit";
import { AdminToastProvider } from "./ui/Toast";
import { useAdminProfile } from "./useAdminProfile";

/* Every piece below is declared at MODULE scope on purpose: defined inside the
   layout's render it would be a new component type every render, React would
   remount the drawer mid-tap, and on phones the close button would stop
   working (dz-cod-store, Phase 8 — "opens but won't close"). */
function Wordmark() {
  const { t } = useAdminT();
  return (
    <Link to="/admin" className="flex shrink-0 items-center gap-3">
      <img src={markLight} alt="" width={359} height={160} className="h-9 w-auto" />
      <span className="leading-tight">
        <span className="font-wide block text-[13px] font-bold tracking-[0.14em] text-white">
          HORIZON
        </span>
        <span className="block text-xs text-gold-300">{t("appName")}</span>
      </span>
    </Link>
  );
}

function NavItems({ sections }: { sections: AdminSection[] }) {
  const { t } = useAdminT();
  return (
    <ul className="space-y-0.5">
      {sections.map((s) => {
        const Icon = s.icon;
        return (
          <li key={s.key}>
            <NavLink
              to={s.route}
              end={s.route === "/admin"}
              className={({ isActive }) =>
                cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/65 hover:bg-white/5 hover:text-white",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-gold-400" />
                  )}
                  <Icon
                    className={cn("size-[18px] shrink-0", isActive && "text-gold-300")}
                    aria-hidden
                  />
                  {t(s.labelKey)}
                </>
              )}
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
}

function SidebarFooter({ onSignOut }: { onSignOut: () => void }) {
  const { t, lang, setLang } = useAdminT();
  const item =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/65 hover:bg-white/5 hover:text-white";
  return (
    <div className="mt-4 shrink-0 space-y-1 border-t border-white/10 pt-4">
      <a href="/" target="_blank" rel="noopener noreferrer" className={item}>
        <ExternalLink className="size-[18px]" aria-hidden />
        {t("backToSite")}
      </a>
      <fieldset className="flex items-center gap-3 px-3 py-1.5">
        <legend className="sr-only">{t("lang")}</legend>
        <Languages className="size-[18px] shrink-0 text-white/65" aria-hidden />
        <div className="flex gap-1">
          {ADMIN_LANGS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              title={LANG_META[l].native}
              className={cn(
                "h-8 rounded-md px-2.5 text-xs font-bold tracking-wide transition-colors",
                lang === l
                  ? "bg-gold-500 text-navy-950"
                  : "text-white/65 ring-1 ring-white/15 hover:text-white",
              )}
            >
              {LANG_META[l].short}
            </button>
          ))}
        </div>
      </fieldset>
      <button type="button" onClick={onSignOut} className={item}>
        <LogOut className="size-[18px]" aria-hidden />
        {t("signOut")}
      </button>
    </div>
  );
}

function SidebarContent({
  sections,
  onSignOut,
}: {
  sections: AdminSection[];
  onSignOut: () => void;
}) {
  return (
    <>
      <Wordmark />
      {/* Only the links scroll: wordmark and footer (sign-out!) stay on screen. min-h-0 is the trick. */}
      <nav className="mt-8 min-h-0 flex-1 overflow-y-auto pe-1 scrollbar-brand-dark">
        <NavItems sections={sections} />
      </nav>
      <SidebarFooter onSignOut={onSignOut} />
    </>
  );
}

/** position:fixed lock — overflow:hidden alone lets iOS rubber-band the drawer off its tap targets. */
function useBodyLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const { body } = document;
    const y = window.scrollY;
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.width = "";
      body.style.overflow = "";
      window.scrollTo(0, y);
    };
  }, [locked]);
}

export function AdminLayout() {
  const { t } = useAdminT();
  const { session, loading, signOut } = useAuth();
  const { isActive, canAccess, isLoading } = useAdminProfile();
  const { pathname } = useLocation();
  const [drawer, setDrawer] = useState(false);
  const isDesktop = useIsDesktop();
  const mainRef = useRef<HTMLElement>(null);

  // <main> is the scroller (not the window), so reset it per route; a route
  // change (link, redirect, back button) also closes the drawer.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
    setDrawer(false);
  }, [pathname]);
  useEffect(() => {
    if (isDesktop) setDrawer(false);
  }, [isDesktop]);
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);
  useBodyLock(drawer);

  if (loading || (session && isLoading)) return <Spinner className="min-h-dvh" />;
  if (!session) return <Navigate to="/admin/login" replace />;

  const handleSignOut = () => void signOut();

  if (!isActive) {
    return (
      <div className="grid min-h-dvh place-items-center bg-paper p-6">
        <div className="max-w-md rounded-[24px] bg-white p-8 text-center ring-1 ring-line">
          <ShieldAlert className="mx-auto size-10 text-gold-500" aria-hidden />
          <h1 className="mt-4 text-xl font-semibold text-navy-900">{t("noAccess.title")}</h1>
          <p className="mt-2 text-sm text-muted">{t("noAccess.desc")}</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-navy-900 px-5 text-sm font-semibold text-white"
          >
            <LogOut className="size-4" aria-hidden />
            {t("signOut")}
          </button>
        </div>
      </div>
    );
  }

  const visible = ADMIN_SECTIONS.filter(canAccess);
  const current = routeToSection(pathname);
  // Direct-URL guard mirrors RLS; the dashboard is `always`, so this can't loop.
  if (current && !canAccess(current)) return <Navigate to="/admin" replace />;

  return (
    <div className="flex h-dvh overflow-hidden bg-paper">
      <aside className="grain relative hidden h-full w-64 shrink-0 flex-col overflow-hidden bg-navy-950 p-5 lg:flex">
        <SidebarContent sections={visible} onSignOut={handleSignOut} />
      </aside>

      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.button
              type="button"
              aria-label={t("close")}
              className="absolute inset-0 bg-navy-950/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-y-0 start-0 flex w-72 max-w-[85vw] flex-col overflow-hidden bg-navy-950 p-5"
            >
              <button
                type="button"
                onClick={() => setDrawer(false)}
                className="absolute end-3 top-4 -m-2 p-3 text-white/70 hover:text-white"
                aria-label={t("close")}
              >
                <X className="size-[18px]" aria-hidden />
              </button>
              <SidebarContent sections={visible} onSignOut={handleSignOut} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-white px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            className="-m-2 p-3 text-navy-900"
            aria-label={t("appName")}
            aria-expanded={drawer}
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <span className="font-semibold text-navy-900">Horizon · {t("appName")}</span>
        </header>
        <AdminToastProvider>
          <main ref={mainRef} className="relative min-w-0 flex-1 overflow-y-auto scrollbar-brand">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
              {/* Suspense scoped to the Outlet ONLY: a lazy page suspending must
                  never tear down the layout (and a half-closed drawer) above it. */}
              <Suspense fallback={<Spinner />}>
                <Outlet />
              </Suspense>
            </div>
          </main>
        </AdminToastProvider>
      </div>
    </div>
  );
}
