import { ArrowRight, Check } from "lucide-react";
import { useRef } from "react";
import { RevealText } from "@/components/fx/RevealText";
import { ButtonLink } from "@/components/ui/Button";
import { useGsap } from "@/hooks/useGsap";
import { useFinePointer, useReducedMotion } from "@/hooks/useMediaFlags";
import { useSiteSettings } from "@/hooks/usePublicData";
import { useI18n } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/cn";
import { gsap } from "@/lib/gsap";

// Static class strings so Tailwind can see them (no inline styles).
const POINT_DELAYS = ["[--rise-delay:1.85s]", "[--rise-delay:1.95s]", "[--rise-delay:2.05s]"];

const HERO_SRCSET =
  "/images/hero-960.webp 960w, /images/hero-1600.webp 1600w, /images/hero-2360.webp 2360w";

/**
 * Signature moment. Intro (pure CSS, so it can never stall half-way): a gold
 * horizon line draws across the dark screen, the photo opens out of it, the
 * headline rises word by word, "B2B" catches a gold sheen. On scroll (GSAP,
 * scrubbed): the photo drifts and the whole hero contracts into a rounded card
 * as the services strip slides over it. Mouse: a few px of depth parallax.
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
        yPercent: 16,
        scale: 1.06,
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
      className="relative isolate h-[min(84svh,720px)] min-h-[580px] overflow-hidden bg-navy-950 text-white"
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
              sizes="100vw"
              alt={t("hero.imageAlt")}
              width={2360}
              height={619}
              // React 18 only knows the lowercase attribute (camelCase is React 19).
              {...{ fetchpriority: "high" }}
              decoding="async"
              className="hero-zoom h-full w-full object-cover object-[70%_55%]"
            />
          </div>
        </div>
        {/* legibility: navy from the copy side, a floor fade, a top vignette */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/80 to-navy-950/0 lg:via-navy-950/55"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-transparent to-navy-950/30"
        />
        {/* one pass of light across the cars after the photo opens */}
        <div aria-hidden className="absolute inset-0 overflow-hidden mix-blend-soft-light">
          <div className="hero-sweep absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent" />
        </div>
      </div>

      <div
        data-hero-copy
        className="container-x relative z-10 flex h-full flex-col justify-center pb-16"
      >
        <p className="rise eyebrow flex items-center gap-3 text-gold-300 [--rise-delay:1.25s]">
          <span aria-hidden className="h-px w-10 bg-gold-400" />
          {t("hero.eyebrow")}
        </p>
        <RevealText
          as="h1"
          id="hero-title"
          trigger="mount"
          delay={1.35}
          className="font-display mt-5 max-w-4xl text-[clamp(2.5rem,6.4vw,5.2rem)] leading-[0.98] font-extrabold tracking-tight"
        >
          {t("hero.title")} <span className="text-gold-sheen">{t("hero.titleAccent")}</span>
        </RevealText>
        <p className="rise mt-6 max-w-xl text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-white/85 [--rise-delay:1.7s]">
          {t("hero.subtitle")}
        </p>
        <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
          {points.map((p, i) => (
            <li
              key={p}
              className={cn(
                "rise flex items-center gap-2.5 text-[14px] font-medium text-white/90",
                POINT_DELAYS[i],
              )}
            >
              <span className="grid size-5 place-items-center rounded-full bg-gold-500 text-navy-950">
                <Check className="size-3" strokeWidth={3} aria-hidden />
              </span>
              {p}
            </li>
          ))}
        </ul>
        <div className="rise mt-10 flex flex-wrap gap-3 [--rise-delay:2.2s]">
          <ButtonLink to={path("/contact")} size="lg">
            {t("hero.cta")}
            <ArrowRight
              className="size-4 transition-transform group-hover/btn:translate-x-1"
              aria-hidden
            />
          </ButtonLink>
          <ButtonLink to={path("/vehicles")} size="lg" variant="outlineLight">
            {t("hero.ctaSecondary")}
          </ButtonLink>
        </div>
      </div>

      <div
        aria-hidden
        className="rise absolute start-0 bottom-24 z-10 hidden items-center gap-4 ps-[max(1rem,calc((100vw-82rem)/2+2.5rem))] text-[11px] font-semibold tracking-[0.3em] text-white/60 uppercase [--rise-delay:2.6s] lg:flex"
      >
        <span className="relative h-12 w-px overflow-hidden bg-white/20">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-[scroll-cue_2s_var(--ease-in-out-circ)_infinite] bg-gold-400" />
        </span>
        {t("hero.scroll")}
      </div>
    </section>
  );
}
