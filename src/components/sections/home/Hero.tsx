import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  Coins,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router";
import { RevealText } from "@/components/fx/RevealText";
import { useGsap } from "@/hooks/useGsap";
import { useFinePointer, useReducedMotion } from "@/hooks/useMediaFlags";
import { useSiteSettings } from "@/hooks/usePublicData";
import { useI18n } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/cn";
import { mailHref, telHref } from "@/lib/contact";
import { gsap } from "@/lib/gsap";
import { pick } from "@/lib/localized";

// Static class strings so Tailwind can see them (no inline styles).
const POINT_DELAYS = ["[--rise-delay:2.15s]", "[--rise-delay:2.25s]", "[--rise-delay:2.35s]"];
const POINT_ICONS = [ShieldCheck, Coins, Truck];

const HERO_SRCSET =
  "/images/hero-960.webp 960w, /images/hero-1600.webp 1600w, /images/hero-2400.webp 2400w";
// The photo is 16:9 and covers the hero: on a portrait screen it is drawn at
// roughly 1.8x the viewport height wide, not at the viewport width.
const HERO_SIZES = "(orientation: portrait) 180vh, 100vw";

/** Phone, e-mail, address and hours along the hero's top edge, over the sky. */
function ContactRail() {
  const { lang } = useI18n();
  const { data: s } = useSiteSettings();
  if (!s) return null;
  const item = "flex items-center gap-2.5 whitespace-nowrap";
  const icon = "size-4 shrink-0 text-gold-300";
  return (
    <div className="rise border-b border-white/10 [--rise-delay:2.4s]">
      <ul className="container-x flex h-12 items-center gap-x-6 overflow-hidden text-[13px] text-white/80 lg:gap-x-0 lg:divide-x lg:divide-gold-400/35">
        <li className="lg:pe-6">
          <a
            href={telHref(s.phone_e164)}
            className={cn(item, "font-semibold text-white hover:text-gold-200")}
          >
            <Phone className={icon} aria-hidden />
            <span dir="ltr">{s.phone_display}</span>
          </a>
        </li>
        <li className="hidden sm:block lg:px-6">
          <a href={mailHref(s.email)} className={cn(item, "hover:text-white")}>
            <Mail className={icon} aria-hidden />
            {s.email}
          </a>
        </li>
        <li className="hidden lg:block lg:px-6">
          <p className={item}>
            <MapPin className={icon} aria-hidden />
            {pick(s.address, lang)}
          </p>
        </li>
        <li className="hidden xl:block xl:ps-6">
          <p className={item}>
            <Clock className={icon} aria-hidden />
            {pick(s.hours, lang)}
          </p>
        </li>
      </ul>
    </div>
  );
}

/**
 * Signature moment, on the client's sunset photo. Intro (pure CSS, so it can
 * never stall half-way): a gold horizon line draws across the dark screen, the
 * photo opens out of it, the headline rises word by word, "B2B" catches a gold
 * sheen. On scroll (GSAP, scrubbed): the photo drifts and the whole hero
 * contracts into a rounded card. It fills the first screen exactly, so the
 * services below only appear once the visitor scrolls. Mouse: a few px of
 * depth parallax.
 */
export function Hero() {
  const { t, path } = useI18n();
  const { data: settings } = useSiteSettings();
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const custom = settings?.hero_image_url;

  useGsap(
    () => {
      const el = root.current;
      if (!el || reduced) return;
      const scroll = { trigger: el, start: "top top", end: "bottom top", scrub: true };
      gsap.to("[data-hero-photo]", {
        yPercent: 14,
        scale: 1.05,
        ease: "none",
        scrollTrigger: scroll,
      });
      gsap.to("[data-hero-copy]", { y: -90, autoAlpha: 0, ease: "none", scrollTrigger: scroll });
      gsap.fromTo(
        el,
        { clipPath: "inset(0% 0% 0% 0% round 0px)" },
        {
          clipPath: "inset(0% 2.5% 0% 2.5% round 28px)",
          ease: "none",
          scrollTrigger: { trigger: el, start: "top top", end: "bottom 30%", scrub: true },
        },
      );

      if (!fine) return;
      const layer = el.querySelector<HTMLElement>("[data-hero-depth]");
      if (!layer) return;
      const x = gsap.quickTo(layer, "x", { duration: 1.4, ease: "power3.out" });
      const y = gsap.quickTo(layer, "y", { duration: 1.4, ease: "power3.out" });
      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        x(((e.clientX - r.left) / r.width - 0.5) * -22);
        y(((e.clientY - r.top) / r.height - 0.5) * -14);
      };
      el.addEventListener("pointermove", onMove);
      return () => el.removeEventListener("pointermove", onMove);
    },
    root,
    [reduced, fine],
  );

  const points = [t("hero.point1"), t("hero.point2"), t("hero.point3")];

  return (
    <section
      ref={root}
      aria-labelledby="hero-title"
      className="relative isolate flex h-[calc(100svh-84px)] min-h-[620px] flex-col overflow-hidden bg-navy-950 text-white lg:h-[calc(100svh-92px)]"
    >
      {/* the horizon line the photo opens from */}
      <div
        aria-hidden
        className="hero-horizon absolute inset-x-0 top-1/2 z-20 h-[2px] bg-gradient-to-r from-transparent via-gold-400 to-transparent shadow-[0_0_24px_rgb(213_182_127/0.9)]"
      />

      <div className="hero-open absolute inset-0">
        <div data-hero-photo className="absolute inset-0 will-change-transform">
          <div data-hero-depth className="absolute -inset-6">
            <img
              src={custom ?? "/images/hero-1600.webp"}
              srcSet={custom ? undefined : HERO_SRCSET}
              sizes={HERO_SIZES}
              alt={t("hero.imageAlt")}
              width={2400}
              height={1350}
              // React 18 only knows the lowercase attribute (camelCase is React 19).
              {...{ fetchpriority: "high" }}
              decoding="async"
              className="hero-zoom h-full w-full object-cover object-[74%_62%] lg:object-[60%_58%]"
            />
          </div>
        </div>
        {/* legibility: the photo is already navy on the copy side; deepen it a
            little, fade the floor for the scroll cue, keep the sky open */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-navy-950/90 via-navy-950/55 to-navy-950/0 lg:from-navy-950/70 lg:via-navy-950/25"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-transparent to-navy-950/45"
        />
        {/* one pass of light across the cars after the photo opens */}
        <div aria-hidden className="absolute inset-0 overflow-hidden mix-blend-soft-light">
          <div className="hero-sweep absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent" />
        </div>
      </div>

      <div className="relative z-10">
        <ContactRail />
      </div>

      <div
        data-hero-copy
        className="container-x relative z-10 flex flex-1 flex-col justify-center pt-10 pb-24"
      >
        <p className="rise inline-flex w-fit items-center gap-3 rounded-full bg-white/[0.06] p-1.5 sm:pe-4 text-[12px] font-semibold tracking-[0.14em] text-white/80 uppercase ring-1 ring-white/12 backdrop-blur-md [--rise-delay:1.25s]">
          <span className="rounded-full bg-gold-500 px-2.5 py-1 text-[10.5px] tracking-[0.16em] text-navy-950">
            {t("hero.eyebrow")}
          </span>
          <span className="hidden sm:inline">{t("hero.location")}</span>
        </p>

        <RevealText
          as="h1"
          id="hero-title"
          trigger="mount"
          delay={1.35}
          className="font-display mt-7 text-[clamp(2.7rem,6vw,5.4rem)] leading-[0.95] font-extrabold tracking-[-0.025em]"
        >
          {t("hero.title")} <span className="text-gold-sheen block">{t("hero.titleAccent")}</span>
        </RevealText>

        <p className="rise mt-7 max-w-md border-s-2 border-gold-500 ps-5 text-pretty text-[clamp(1rem,1.35vw,1.15rem)] leading-relaxed text-white/80 [--rise-delay:1.7s]">
          {t("hero.subtitle")}
        </p>

        <div className="rise mt-10 flex flex-wrap items-center gap-x-8 gap-y-5 [--rise-delay:1.95s]">
          <Link
            to={path("/contact")}
            className="group inline-flex h-14 items-center gap-4 rounded-full bg-gold-500 ps-7 pe-2 text-[15px] font-semibold text-white shadow-[0_18px_40px_-16px_rgb(167_124_56/0.95)] transition-[background-color,box-shadow] duration-300 hover:bg-gold-400 hover:shadow-[0_22px_48px_-14px_rgb(191_150_83/1)]"
          >
            {t("hero.cta")}
            <span className="grid size-10 place-items-center overflow-hidden rounded-full bg-navy-950 text-gold-300">
              <ArrowRight
                className="size-4 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5"
                aria-hidden
              />
            </span>
          </Link>
          <Link
            to={path("/vehicles")}
            className="group relative inline-flex items-center gap-2 py-2 text-[15px] font-semibold text-white"
          >
            {t("hero.ctaSecondary")}
            <ArrowUpRight
              className="size-4 text-gold-300 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-px origin-left bg-white/30 transition-colors group-hover:bg-gold-400"
            />
          </Link>
        </div>

        <ul className="mt-12 flex flex-wrap gap-x-7 gap-y-3">
          {points.map((p, i) => {
            const Icon = POINT_ICONS[i] ?? ShieldCheck;
            return (
              <li
                key={p}
                className={cn(
                  "rise flex items-center gap-2.5 text-[13.5px] font-medium text-white/75",
                  POINT_DELAYS[i],
                )}
              >
                <Icon className="size-[18px] text-gold-300" strokeWidth={1.6} aria-hidden />
                {p}
              </li>
            );
          })}
        </ul>
      </div>

      {/* scroll cue: the services start right below the fold */}
      <div
        aria-hidden
        className="rise absolute inset-x-0 bottom-7 z-10 flex justify-center [--rise-delay:2.6s]"
      >
        <span className="flex flex-col items-center gap-3 text-[10.5px] font-semibold tracking-[0.3em] text-white/55 uppercase">
          {t("hero.scroll")}
          <span className="relative h-10 w-px overflow-hidden bg-white/20">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[scroll-cue_2s_var(--ease-in-out-circ)_infinite] bg-gold-400" />
          </span>
        </span>
      </div>
    </section>
  );
}
