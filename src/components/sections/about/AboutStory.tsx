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
 * A framed photo for a story row: rounded, with a gold outline offset behind
 * it on the side away from the text, and a slow drift as you scroll.
 */
function StoryPhoto({ name, alt, side }: { name: string; alt: string; side: "start" | "end" }) {
  const p = photo(name, [640, 960]);
  return (
    <div className="relative">
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 hidden translate-y-5 rounded-xl ring-1 ring-gold-500/60 lg:block",
          side === "end" ? "translate-x-5" : "-translate-x-5",
        )}
      />
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-navy-900 shadow-[0_30px_60px_-30px_rgb(8_25_61/0.55)]">
        <div data-drift className="absolute -inset-y-[8%] inset-x-0">
          <img
            src={p.src}
            srcSet={p.srcSet}
            sizes="(min-width: 1024px) 40vw, 100vw"
            alt={alt}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>
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
}> = [
  {
    photo: "fleet",
    title: "about.who.title",
    body: ["about.who.p1", "about.who.p2"],
    alt: "about.who.imageAlt",
  },
  {
    photo: "road",
    title: "about.vision.title",
    body: ["about.vision.text"],
    alt: "about.vision.imageAlt",
  },
  {
    photo: "wheel",
    title: "about.care.title",
    body: ["about.care.text"],
    alt: "about.care.imageAlt",
  },
];

/**
 * The About page with the client's content: a navy header (full logo and
 * "À propos de nous" over the headlight photo), then "who we are", "our
 * vision" and "your satisfaction" as text + framed photo rows that alternate
 * sides, and the motto on a navy band. Photos drift gently with the scroll
 * (transform only; static under reduced motion).
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
    },
    root,
    [reduced],
  );

  const head = photo("headlight", [720, 1200]);

  return (
    <div ref={root}>
      {/* header: logo + "À propos de nous" over the headlight photo */}
      <section className="grain relative isolate overflow-hidden bg-navy-950 text-white">
        <img
          src={head.src}
          srcSet={head.srcSet}
          sizes="100vw"
          alt=""
          decoding="async"
          className="absolute inset-0 -z-10 h-full w-full object-cover object-[70%_50%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/85 to-navy-950/30"
        />
        <div className="container-x flex min-h-[420px] flex-col justify-center py-16 lg:min-h-[480px]">
          <img
            src={logoFullLight}
            alt={BRAND_NAME}
            width={384}
            height={300}
            className="rise h-32 w-auto self-start sm:h-40 [--rise-delay:0.15s]"
          />
          <div className="rise mt-9 flex items-center gap-3 sm:gap-4 [--rise-delay:0.35s]">
            <span aria-hidden className="h-[2px] w-8 shrink-0 bg-gold-500 sm:w-12" />
            <h1 className="font-wide text-[clamp(0.95rem,1.8vw,1.45rem)] font-bold tracking-[0.12em] whitespace-nowrap text-gold-300 uppercase sm:tracking-[0.18em]">
              {t("about.page.title")}
            </h1>
            <span aria-hidden className="h-[2px] w-8 shrink-0 bg-gold-500 sm:w-12" />
          </div>
        </div>
      </section>

      {ROWS.map((row, i) => {
        const photoEnd = i % 2 === 0;
        return (
          <section
            key={row.title}
            className={cn("py-20 lg:py-28", i % 2 === 1 ? "bg-paper" : "bg-white")}
          >
            <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
              <Reveal stagger={0.1} className={cn(!photoEnd && "lg:order-2")}>
                <p className="font-wide text-[12px] font-bold tracking-[0.3em] text-gold-600">
                  0{i + 1}
                </p>
                <div className="mt-4">
                  <StoryHeading>{t(row.title)}</StoryHeading>
                </div>
                {row.body.map((key, j) => (
                  <p
                    key={key}
                    className={cn(
                      "mt-6 max-w-xl text-[17px] leading-relaxed",
                      j === 0 && row.body.length > 1 ? "text-navy-900" : "text-muted",
                    )}
                  >
                    {t(key)}
                  </p>
                ))}
              </Reveal>
              <div className={cn(!photoEnd && "lg:order-1")}>
                <StoryPhoto name={row.photo} alt={t(row.alt)} side={photoEnd ? "end" : "start"} />
              </div>
            </div>
          </section>
        );
      })}

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
