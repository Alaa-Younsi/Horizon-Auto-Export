import { ArrowRight, Coins, ShieldCheck, Truck } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router";
import { RevealText } from "@/components/fx/RevealText";
import { useGsap } from "@/hooks/useGsap";
import { useFinePointer, useIsDesktop, useReducedMotion } from "@/hooks/useMediaFlags";
import { useSiteSettings } from "@/hooks/usePublicData";
import type { TranslationKey } from "@/i18n/dictionaries";
import { useI18n } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/cn";
import { gsap } from "@/lib/gsap";

const POINTS: Array<{ key: TranslationKey; icon: typeof ShieldCheck }> = [
  { key: "hero.point1", icon: ShieldCheck },
  { key: "hero.point2", icon: Coins },
  { key: "hero.point3", icon: Truck },
];

const HERO_SRCSET =
  "/images/hero-960.webp 960w, /images/hero-1600.webp 1600w, /images/hero-2400.webp 2400w";
// Phones: a 9:16 crop of the same photo. The 16:9 file covering a tall screen
// would otherwise be picked at ~1.8x the screen height (the 2400 px file).
const HERO_PORTRAIT_SRCSET =
  "/images/hero-portrait-720.webp 720w, /images/hero-portrait-1080.webp 1080w";

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
  const desktop = useIsDesktop();
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

  return (
    <section
      ref={root}
      data-hero
      aria-labelledby="hero-title"
      className="relative isolate flex h-[calc(100svh-92px)] min-h-[620px] flex-col overflow-hidden bg-navy-950 text-white lg:h-[calc(100svh-108px)]"
    >
      {/* the horizon line the photo opens from */}
      <div
        aria-hidden
        className="hero-horizon absolute inset-x-0 top-1/2 z-20 h-[2px] bg-gradient-to-r from-transparent via-gold-400 to-transparent shadow-[0_0_24px_rgb(213_182_127/0.9)]"
      />

      <div className="hero-open absolute inset-0">
        <div data-hero-photo className="absolute inset-0 will-change-transform">
          <div data-hero-depth className="absolute -inset-6">
            <picture className="block h-full w-full">
              {!custom && (
                <source
                  media="(orientation: portrait)"
                  srcSet={HERO_PORTRAIT_SRCSET}
                  sizes="100vw"
                  type="image/webp"
                />
              )}
              <img
                src={custom ?? "/images/hero-1600.webp"}
                srcSet={custom ? undefined : HERO_SRCSET}
                sizes="100vw"
                alt={t("hero.imageAlt")}
                width={2400}
                height={1350}
                // React 18 only knows the lowercase attribute (camelCase is React 19).
                {...{ fetchpriority: "high" }}
                decoding="async"
                className="hero-zoom h-full w-full object-cover object-[74%_62%] lg:object-[60%_58%]"
              />
            </picture>
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

      <div
        data-hero-copy
        className="container-x relative z-10 flex flex-1 flex-col justify-center pt-10 pb-24"
      >
        <RevealText
          as="h1"
          id="hero-title"
          trigger="mount"
          delay={1.35}
          // phones: no word-by-word split (it waits for the scripts); a quick CSS rise instead
          animate={desktop}
          className={cn(
            !desktop && "rise [--rise-delay:0.5s]",
            "font-display max-w-4xl text-[clamp(2.5rem,5.6vw,5rem)] leading-[1.02] font-extrabold tracking-[-0.025em]",
          )}
        >
          {t("hero.title")} <span className="text-gold-sheen block">{t("hero.titleAccent")}</span>
        </RevealText>

        <p className="rise mt-6 max-w-lg text-pretty text-[clamp(1rem,1.35vw,1.2rem)] leading-relaxed text-white/85 [--rise-delay:1.7s]">
          {t("hero.subtitle")}
        </p>

        {/* the three promises, split by thin gold rules */}
        <ul className="rise mt-9 flex max-w-xl divide-x divide-gold-500/50 [--rise-delay:1.85s] rtl:divide-x-reverse">
          {POINTS.map(({ key, icon: Icon }) => (
            <li
              key={key}
              className="flex flex-1 flex-col gap-2.5 px-4 first:ps-0 last:pe-0 sm:px-6"
            >
              <Icon className="size-7 text-gold-400 sm:size-8" strokeWidth={1.4} aria-hidden />
              <span className="text-[13px] leading-snug font-medium text-white/90 sm:text-[14.5px]">
                {t(key)}
              </span>
            </li>
          ))}
        </ul>

        <div className="rise mt-10 [--rise-delay:2s]">
          <Link
            to={path("/vehicles")}
            className="group inline-flex h-14 items-center gap-4 rounded-md bg-gold-600 ps-7 pe-6 text-[15px] font-semibold text-white shadow-[0_18px_40px_-16px_rgb(167_124_56/0.95)] transition-[background-color,box-shadow] duration-300 hover:bg-gold-700 hover:shadow-[0_22px_48px_-14px_rgb(191_150_83/1)]"
          >
            {t("hero.discover")}
            <ArrowRight
              className="size-4 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
        </div>
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
