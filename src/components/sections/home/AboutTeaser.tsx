import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WorldDots } from "@/components/ui/WorldDots";
import { useGsap } from "@/hooks/useGsap";
import { useReducedMotion } from "@/hooks/useMediaFlags";
import { useSiteSettings } from "@/hooks/usePublicData";
import { useI18n } from "@/i18n/LanguageProvider";
import { gsap, SplitText } from "@/lib/gsap";

/**
 * "Despre noi" from the mock-up: the headlight photo behind a white + gold
 * diagonal blade, copy on the right over a faint world map. The photo drifts
 * inside its frame, the blade slices in, and the quote's words light up as the
 * visitor scrolls past it.
 */
export function AboutTeaser() {
  const { t, path, lang } = useI18n();
  const { data: settings } = useSiteSettings();
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const custom = settings?.about_image_url;

  useGsap(
    () => {
      if (reduced) return;
      gsap.fromTo(
        "[data-about-photo]",
        { yPercent: -7 },
        {
          yPercent: 7,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
      gsap.from("[data-blade]", {
        scaleY: 0,
        transformOrigin: "50% 100%",
        duration: 1.4,
        stagger: 0.12,
        ease: "expo.inOut",
        scrollTrigger: { trigger: root.current, start: "top 75%", once: true },
      });
      const quote = root.current?.querySelector<HTMLElement>("[data-quote]");
      if (!quote) return;
      const split = SplitText.create(quote, { type: "words" });
      gsap.fromTo(
        split.words,
        { opacity: 0.22 },
        {
          opacity: 1,
          stagger: 0.1,
          ease: "none",
          scrollTrigger: { trigger: quote, start: "top 85%", end: "top 45%", scrub: true },
        },
      );
      return () => split.revert();
    },
    root,
    [reduced, lang],
  );

  return (
    <section ref={root} className="relative overflow-hidden py-20 lg:py-28">
      <WorldDots className="absolute -end-[18%] top-10 w-[75%] text-navy-900/[0.05]" />
      <div className="container-x relative grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-navy-900 shadow-[0_50px_90px_-50px_rgb(4_14_36/0.7)]">
            <div data-about-photo className="absolute -inset-y-[10%] inset-x-0">
              <img
                src={custom ?? "/images/about-headlight-720.webp"}
                srcSet={
                  custom
                    ? undefined
                    : "/images/about-headlight-720.webp 720w, /images/about-headlight-1200.webp 1200w"
                }
                sizes="(min-width: 1024px) 40vw, 92vw"
                alt={t("about.imageAlt")}
                width={1200}
                height={1092}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-tr from-navy-950/40 to-transparent"
            />
            {/* the mock-up's diagonal blade: a white cut and a gold stripe */}
            <svg
              aria-hidden
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-y-0 end-0 h-full w-[34%]"
            >
              <polygon data-blade points="62,0 74,0 38,100 26,100" fill="#ffffff" />
              <polygon data-blade points="78,0 86,0 50,100 42,100" fill="var(--color-gold-500)" />
              <polygon data-blade points="90,0 100,0 100,100 54,100" fill="#ffffff" />
            </svg>
          </div>
          <div className="absolute -bottom-6 start-6 hidden rounded-lg bg-navy-900 px-5 py-4 text-white shadow-xl sm:block">
            <p className="font-wide text-[11px] font-bold tracking-[0.25em] text-gold-300 uppercase">
              {t("hero.eyebrow")}
            </p>
            <p className="mt-1 text-sm text-white/70">{t("hero.location")}</p>
          </div>
        </div>

        <div>
          <SectionHeading eyebrow={t("about.eyebrow")} title={t("about.title")} />
          <div className="mt-6 space-y-4 text-[16.5px] leading-relaxed text-muted">
            <p>{t("about.p1")}</p>
            <p>{t("about.p2")}</p>
          </div>
          <blockquote className="mt-8 border-s-2 border-gold-500 ps-5">
            <p
              key={lang}
              data-quote
              className="font-display text-[clamp(1.3rem,2.2vw,1.7rem)] leading-snug font-semibold text-navy-900"
            >
              {t("about.quote")}
            </p>
          </blockquote>
          <ButtonLink to={path("/about")} className="mt-9">
            {t("about.cta")}
            <ArrowRight
              className="size-4 transition-transform group-hover/btn:translate-x-1"
              aria-hidden
            />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
