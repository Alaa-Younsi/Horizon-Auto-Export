import { useRef } from "react";
import logoFullLight from "@/assets/logo-full-light.webp";
import { Reveal } from "@/components/fx/Reveal";
import { useGsap } from "@/hooks/useGsap";
import { useReducedMotion } from "@/hooks/useMediaFlags";
import type { TranslationKey } from "@/i18n/dictionaries";
import { useI18n } from "@/i18n/LanguageProvider";
import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/cn";
import { gsap } from "@/lib/gsap";

/** The client's photos (cut from their "À propos" mock-up, see optimize-assets). */
function photo(name: string, widths: number[]) {
  return {
    src: `/images/about-${name}-${widths[0]}.webp`,
    srcSet: widths.map((w) => `/images/about-${name}-${w}.webp ${w}w`).join(", "),
  };
}

/**
 * The diagonal cut from the client's mock-up: a wedge of the section's colour
 * slicing into the photo, with a gold stripe running beside it. `side` is the
 * photo edge that touches the text.
 */
function Blade({ side, tone }: { side: "start" | "end"; tone: "navy" | "white" | "paper" }) {
  const fill = { navy: "fill-navy-950", white: "fill-white", paper: "fill-paper" }[tone];
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn(
        "absolute inset-y-0 z-10 h-full w-[26%]",
        side === "start" ? "start-0" : "end-0 -scale-x-100",
      )}
    >
      <polygon className={fill} points="0,0 58,0 0,100" />
      <polygon data-stripe className="fill-gold-500" points="64,0 74,0 16,100 6,100" />
    </svg>
  );
}

/** Photo half of a story row: bleeds to the page edge, drifts as you scroll. */
function StoryPhoto({
  name,
  alt,
  side,
  tone,
  className,
}: {
  name: string;
  alt: string;
  side: "start" | "end";
  tone: "navy" | "white" | "paper";
  className?: string;
}) {
  const p = photo(name, name === "headlight" ? [720, 1200] : [640, 960]);
  return (
    <div className={cn("relative overflow-hidden bg-navy-900", className)}>
      <div data-drift className="absolute -inset-y-[8%] inset-x-0">
        <img
          src={p.src}
          srcSet={p.srcSet}
          sizes="(min-width: 1024px) 45vw, 100vw"
          alt={alt}
          loading={name === "headlight" ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="hidden lg:block">
        <Blade side={side} tone={tone} />
      </div>
    </div>
  );
}

/** "Qui sommes-nous ? ——": the mock-up's headings end in a short gold rule. */
function StoryHeading({ children }: { children: string }) {
  return (
    <h2 className="font-display flex flex-wrap items-center gap-x-5 gap-y-3 text-[clamp(1.8rem,3.2vw,2.6rem)] leading-tight font-bold text-navy-900">
      {children}
      <span aria-hidden className="h-[2px] w-20 bg-gold-500" />
    </h2>
  );
}

const ROWS: Array<{
  photo: string;
  title: TranslationKey;
  body: TranslationKey[];
  alt: TranslationKey;
  photoSide: "start" | "end";
  tone: "white" | "paper";
}> = [
  {
    photo: "fleet",
    title: "about.who.title",
    body: ["about.who.p1", "about.who.p2"],
    alt: "about.who.imageAlt",
    photoSide: "end",
    tone: "white",
  },
  {
    photo: "road",
    title: "about.vision.title",
    body: ["about.vision.text"],
    alt: "about.vision.imageAlt",
    photoSide: "start",
    tone: "paper",
  },
  {
    photo: "wheel",
    title: "about.care.title",
    body: ["about.care.text"],
    alt: "about.care.imageAlt",
    photoSide: "start",
    tone: "white",
  },
];

/**
 * The About page as the client designed it: a navy header with the full logo
 * beside the headlight photo, then "who we are", "our vision" and "your
 * satisfaction" as rows of photo + text split by the gold diagonal blade, and
 * the motto on a navy band. Photos drift with the scroll and the gold stripes
 * draw in (transform only; static under reduced motion).
 */
export function AboutStory() {
  const { t } = useI18n();
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGsap(
    () => {
      if (reduced) return;
      for (const el of gsap.utils.toArray<HTMLElement>("[data-drift]")) {
        gsap.fromTo(
          el,
          { yPercent: -6 },
          {
            yPercent: 6,
            ease: "none",
            scrollTrigger: {
              trigger: el.parentElement,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      }
      for (const el of gsap.utils.toArray<SVGElement>("[data-stripe]")) {
        gsap.from(el, {
          scaleY: 0,
          transformOrigin: "50% 0%",
          duration: 1.3,
          ease: "expo.inOut",
          scrollTrigger: { trigger: el.closest("section"), start: "top 75%", once: true },
        });
      }
    },
    root,
    [reduced],
  );

  return (
    <div ref={root}>
      {/* header: logo + "À propos de nous" on navy, the headlight photo beside it */}
      <section className="grain relative bg-navy-950 text-white">
        <div className="grid lg:min-h-[520px] lg:grid-cols-2">
          <div className="flex flex-col justify-center px-4 py-14 sm:px-6 lg:ps-[max(2.5rem,calc((100vw-82rem)/2+2.5rem))] lg:pe-12">
            <img
              src={logoFullLight}
              alt={BRAND_NAME}
              width={384}
              height={300}
              className="rise h-36 w-auto self-start sm:h-44 [--rise-delay:0.15s]"
            />
            <div className="rise mt-10 flex items-center gap-3 sm:gap-4 [--rise-delay:0.35s]">
              <span aria-hidden className="h-[2px] w-8 shrink-0 bg-gold-500 sm:w-12" />
              <h1 className="font-wide text-[clamp(0.95rem,1.8vw,1.45rem)] font-bold tracking-[0.12em] whitespace-nowrap text-gold-300 uppercase sm:tracking-[0.18em]">
                {t("about.page.title")}
              </h1>
              <span aria-hidden className="h-[2px] w-8 shrink-0 bg-gold-500 sm:w-12" />
            </div>
          </div>
          <StoryPhoto
            name="headlight"
            alt={t("about.imageAlt")}
            side="start"
            tone="navy"
            className="h-64 sm:h-80 lg:h-auto"
          />
        </div>
      </section>

      {ROWS.map((row) => (
        <section
          key={row.title}
          className={cn("relative", row.tone === "paper" ? "bg-paper" : "bg-white")}
        >
          <div className="grid lg:min-h-[440px] lg:grid-cols-[1fr_1.15fr]">
            <StoryPhoto
              name={row.photo}
              alt={t(row.alt)}
              side={row.photoSide === "start" ? "end" : "start"}
              tone={row.tone}
              // phones: text first, photo after, so two photos never stack
              className={cn(
                "order-2 h-64 sm:h-80 lg:h-auto",
                row.photoSide === "end" ? "lg:order-2" : "lg:order-1",
              )}
            />
            <Reveal
              stagger={0.1}
              className={cn(
                "order-1 flex flex-col justify-center px-4 py-14 sm:px-6 lg:py-20",
                row.photoSide === "end" ? "lg:order-1" : "lg:order-2",
                row.photoSide === "end"
                  ? "lg:ps-[max(2.5rem,calc((100vw-82rem)/2+2.5rem))] lg:pe-16"
                  : "lg:ps-16 lg:pe-[max(2.5rem,calc((100vw-82rem)/2+2.5rem))]",
              )}
            >
              <StoryHeading>{t(row.title)}</StoryHeading>
              {row.body.map((key, i) => (
                <p
                  key={key}
                  className={cn(
                    "mt-6 max-w-xl text-[17px] leading-relaxed",
                    i === 0 && row.body.length > 1 ? "text-navy-900" : "text-muted",
                  )}
                >
                  {t(key)}
                </p>
              ))}
            </Reveal>
          </div>
        </section>
      ))}

      {/* the signature line */}
      <section className="grain relative overflow-hidden bg-navy-900 py-16 text-center text-white lg:py-20">
        <span
          aria-hidden
          className="absolute -start-10 top-0 h-[140%] w-px origin-top-left -rotate-[55deg] bg-gradient-to-b from-gold-500/80 to-transparent"
        />
        <span
          aria-hidden
          className="absolute -end-10 bottom-0 h-[140%] w-px origin-bottom-right -rotate-[55deg] bg-gradient-to-t from-gold-500/80 to-transparent"
        />
        <Reveal className="container-x relative">
          <p className="flex items-center justify-center gap-5 text-[13px] font-semibold tracking-[0.3em] text-gold-300 uppercase sm:text-[15px]">
            <span aria-hidden className="h-px w-10 bg-gold-500 sm:w-16" />
            {BRAND_NAME}
            <span aria-hidden className="h-px w-10 bg-gold-500 sm:w-16" />
          </p>
          <p className="mt-4 text-[clamp(1.05rem,1.8vw,1.3rem)] text-white/85 italic">
            {t("about.motto")}
          </p>
        </Reveal>
      </section>
    </div>
  );
}
