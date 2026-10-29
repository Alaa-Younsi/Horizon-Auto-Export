import { ArrowUpRight, Clock, Mail, MapPin, Menu, Phone, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router";
import { Logo } from "@/components/ui/Logo";
import { useIsDesktop } from "@/hooks/useMediaFlags";
import { useSiteSettings } from "@/hooks/usePublicData";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useI18n } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/cn";
import { mailHref, telHref } from "@/lib/contact";
import { pick } from "@/lib/localized";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NAV_ITEMS } from "./navigation";

function DesktopNav() {
  const { t, path } = useI18n();
  return (
    <nav aria-label={t("nav.primary")} className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={path(item.to)}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "relative block px-3.5 py-2 text-[14px] font-semibold transition-colors duration-300",
                  isActive ? "text-navy-900" : "text-navy-900/70 hover:text-navy-900",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {t(item.key)}
                  {isActive ? (
                    <motion.span
                      layoutId="nav-underline"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      className="absolute inset-x-3.5 -bottom-0.5 h-[2px] rounded-full bg-gold-500"
                    />
                  ) : null}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ContactBlock({ compact }: { compact: boolean }) {
  const { lang } = useI18n();
  const { data: s } = useSiteSettings();
  if (!s) return null;
  return (
    <div className="hidden items-center gap-6 border-s border-line ps-6 text-[12.5px] leading-snug xl:flex">
      <div className="space-y-1">
        <a
          href={telHref(s.phone_e164)}
          className="flex items-center gap-2 font-bold text-navy-900 hover:text-gold-600"
        >
          <Phone className="size-3.5 text-gold-500" aria-hidden />
          <span dir="ltr">{s.phone_display}</span>
        </a>
        <p
          className={cn(
            "flex items-center gap-2 text-muted transition-all duration-500",
            compact && "h-0 overflow-hidden opacity-0",
          )}
        >
          <Clock className="size-3.5 text-gold-500" aria-hidden />
          {pick(s.hours, lang)}
        </p>
      </div>
      <div
        className={cn(
          "space-y-1 transition-all duration-500",
          compact && "pointer-events-none w-0 overflow-hidden opacity-0",
        )}
      >
        <a
          href={mailHref(s.email)}
          className="flex items-center gap-2 text-navy-900 hover:text-gold-600"
        >
          <Mail className="size-3.5 text-gold-500" aria-hidden />
          {s.email}
        </a>
        <p className="flex items-center gap-2 text-muted">
          <MapPin className="size-3.5 text-gold-500" aria-hidden />
          {pick(s.address, lang)}
        </p>
      </div>
    </div>
  );
}

/* Module scope on purpose: a component defined inside Header's render would be a
   new type every render and React would remount the open menu mid-tap. */
function MobileMenu({ onClose }: { onClose: () => void }) {
  const { t, path, lang } = useI18n();
  const { data: s } = useSiteSettings();
  useScrollLock(true);
  return (
    <motion.div
      key="mobile-menu"
      initial={{ clipPath: "inset(0 0 100% 0)" }}
      animate={{ clipPath: "inset(0 0 0% 0)" }}
      exit={{ clipPath: "inset(0 0 100% 0)" }}
      transition={{ duration: 0.6, ease: [0.85, 0, 0.15, 1] }}
      className="grain fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-navy-950 px-6 pt-5 pb-8 text-white lg:hidden"
    >
      <div className="flex h-14 items-center justify-between">
        <Logo tone="light" className="h-12" />
        <button
          type="button"
          onClick={onClose}
          className="-me-2 grid size-12 place-items-center rounded-full text-white/80 hover:text-white"
          aria-label={t("nav.close")}
        >
          <X className="size-6" aria-hidden />
        </button>
      </div>
      <div aria-hidden className="my-6 h-px bg-gradient-to-r from-gold-500/70 to-transparent" />
      <nav aria-label={t("nav.primary")} className="flex-1">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item, i) => (
            <motion.li
              key={item.to}
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.25 + i * 0.06, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <NavLink
                to={path(item.to)}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "font-display flex items-center justify-between py-2.5 text-[2rem] leading-tight font-bold",
                    isActive ? "text-gold-300" : "text-white",
                  )
                }
              >
                {t(item.key)}
                <ArrowUpRight className="size-6 text-white/30" aria-hidden />
              </NavLink>
            </motion.li>
          ))}
        </ul>
      </nav>
      {s && (
        <div className="mt-8 space-y-3 border-t border-white/10 pt-6 text-sm text-white/75">
          <a href={telHref(s.phone_e164)} className="flex items-center gap-3 text-white">
            <Phone className="size-4 text-gold-400" aria-hidden />
            <span dir="ltr">{s.phone_display}</span>
          </a>
          <a href={mailHref(s.email)} className="flex items-center gap-3">
            <Mail className="size-4 text-gold-400" aria-hidden />
            {s.email}
          </a>
          <p className="flex items-center gap-3">
            <MapPin className="size-4 text-gold-400" aria-hidden />
            {pick(s.address, lang)}
          </p>
          <div className="pt-2">
            <LanguageSwitcher tone="light" />
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function Header() {
  const { t } = useI18n();
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A route change (link, back button) or crossing to desktop closes the menu.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (isDesktop) setOpen(false);
  }, [isDesktop]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-[background-color,box-shadow,border-color] duration-500",
          compact
            ? "border-transparent bg-white/88 shadow-[0_10px_40px_-24px_rgb(4_14_36/0.45)] backdrop-blur-xl"
            : "border-line bg-white",
        )}
      >
        <div
          className={cn(
            "container-x flex items-center gap-6 transition-[height] duration-500 ease-[var(--ease-out-expo)]",
            compact ? "h-[68px]" : "h-[84px] lg:h-[92px]",
          )}
        >
          <Logo
            className={cn(
              "transition-[height] duration-500 ease-[var(--ease-out-expo)]",
              compact ? "h-12" : "h-14 lg:h-16",
            )}
          />
          <div className="flex flex-1 items-center justify-end gap-4 lg:justify-center">
            <DesktopNav />
          </div>
          <ContactBlock compact={compact} />
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="-me-2 grid size-11 place-items-center rounded-md text-navy-900 lg:hidden"
              aria-label={t("nav.menu")}
              aria-expanded={open}
            >
              <Menu className="size-6" aria-hidden />
            </button>
          </div>
        </div>
      </header>
      <AnimatePresence>{open && <MobileMenu onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}
