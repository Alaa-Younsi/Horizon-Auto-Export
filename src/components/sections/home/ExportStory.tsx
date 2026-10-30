import {
  Check,
  FileCheck2,
  type LucideIcon,
  MessageSquareText,
  SearchCheck,
  Truck,
} from "lucide-react";
import { useId, useRef, useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useGsap } from "@/hooks/useGsap";
import { useReducedMotion } from "@/hooks/useMediaFlags";
import type { TranslationKey } from "@/i18n/dictionaries";
import { useI18n } from "@/i18n/LanguageProvider";
import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/cn";
import { gsap } from "@/lib/gsap";

const STEPS: Array<{ title: TranslationKey; text: TranslationKey; icon: LucideIcon }> = [
  { title: "export.step1.title", text: "export.step1.text", icon: MessageSquareText },
  { title: "export.step2.title", text: "export.step2.text", icon: SearchCheck },
  { title: "export.step3.title", text: "export.step3.text", icon: FileCheck2 },
  { title: "export.step4.title", text: "export.step4.text", icon: Truck },
];

// Static class strings so Tailwind can see them: each sheet sticks a little
// lower than the one before, so the pile shows every sheet's header strip.
const STICK = [
  "top-[84px] lg:top-[15vh]",
  "top-[96px] lg:top-[calc(15vh+30px)]",
  "top-[108px] lg:top-[calc(15vh+60px)]",
  "top-[120px] lg:top-[calc(15vh+90px)]",
];

/** A rubber stamp: the company name around the ring, a check in the middle. */
function Stamp({ city }: { city: string }) {
  const id = useId();
  return (
    <svg
      data-stamp
      viewBox="0 0 120 120"
      aria-hidden
      className="size-24 shrink-0 -rotate-12 text-gold-500 sm:size-28"
    >
      <defs>
        <path id={id} d="M60,60 m-41,0 a41,41 0 1,1 82,0 a41,41 0 1,1 -82,0" />
      </defs>
      <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="60" cy="60" r="31" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text className="fill-current text-[10.5px] font-bold tracking-[0.18em] uppercase">
        <textPath href={`#${id}`} startOffset="0">
          {`${BRAND_NAME} · ${city} ·`}
        </textPath>
      </text>
      <path
        d="M47 60.5l8.5 8.5L74 51"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * How an order travels, told as an export file. Each step is a sheet of the
 * dossier: the sheets stick and pile up as you scroll (CSS sticky, so it stays
 * calm under Lenis), the sheet underneath settles back, and every sheet gets
 * stamped as it lands. Beside the pile, a truck drives the road from Bucharest
 * to Europe with the story's progress.
 */
export function ExportStory() {
  const { t } = useI18n();
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();

  useGsap(
    () => {
      if (reduced) return;
      const sheets = gsap.utils.toArray<HTMLElement>("[data-sheet]");

      // the road: truck + gold fill follow the whole pile's progress
      gsap.to("[data-road-fill]", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-dossier]",
          start: "top 65%",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (self) =>
            setActive(Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length))),
        },
      });
      gsap.to("[data-truck]", {
        x: () => {
          const road = root.current?.querySelector<HTMLElement>("[data-road]");
          const truck = root.current?.querySelector<HTMLElement>("[data-truck]");
          return (road?.clientWidth ?? 0) - (truck?.offsetWidth ?? 0);
        },
        ease: "none",
        scrollTrigger: {
          trigger: "[data-dossier]",
          start: "top 65%",
          end: "bottom bottom",
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      sheets.forEach((sheet, i) => {
        // stamped as it lands
        gsap.fromTo(
          sheet.querySelector("[data-stamp]"),
          { scale: 2.6, rotate: -48, autoAlpha: 0 },
          {
            scale: 1,
            rotate: -12,
            autoAlpha: 1,
            duration: 0.45,
            ease: "back.out(2.2)",
            scrollTrigger: {
              trigger: sheet,
              start: "top 55%",
              toggleActions: "play none none reverse",
            },
          },
        );
        // and pushed back once the next sheet covers it
        const next = sheets[i + 1];
        if (!next) return;
        const scrub = { trigger: next, start: "top bottom", end: "top 30%", scrub: true };
        gsap.to(sheet.querySelector("[data-sheet-body]"), {
          scale: 0.94,
          ease: "none",
          scrollTrigger: scrub,
        });
        gsap.to(sheet.querySelector("[data-sheet-dim]"), {
          opacity: 1,
          ease: "none",
          scrollTrigger: scrub,
        });
      });
    },
    root,
    [reduced],
  );

  return (
    // overflow-clip, NOT overflow-hidden: hidden makes the section a scroll
    // container and silently breaks every position: sticky inside it.
    <section ref={root} className="grain relative overflow-clip bg-navy-950 text-white">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(55%_45%_at_80%_30%,rgb(167_124_56/0.16),transparent_70%)]"
      />
      <div className="container-x relative grid gap-12 py-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:py-32">
        <div className="lg:sticky lg:top-[15vh] lg:self-start">
          <SectionHeading
            tone="light"
            eyebrow={t("export.eyebrow")}
            title={t("export.title")}
            lead={t("export.lead")}
          />

          <div className="mt-12 max-w-md">
            <div className="flex items-baseline justify-between text-[12px] font-semibold tracking-[0.2em] text-white/50 uppercase">
              <span>{t("export.origin")}</span>
              <span>{t("export.destination")}</span>
            </div>
            <div data-road className="relative mt-3 h-12">
              <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-white/15" />
              <span
                aria-hidden
                className="absolute inset-x-0 top-1/2 h-px border-t border-dashed border-white/25"
              />
              <span
                aria-hidden
                data-road-fill
                className={cn(
                  "absolute inset-x-0 top-1/2 h-[2px] -translate-y-px origin-left bg-gold-400",
                  !reduced && "scale-x-0",
                )}
              />
              <span
                data-truck
                aria-hidden
                className="absolute start-0 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-gold-500 text-navy-950 shadow-[0_0_0_6px_rgb(167_124_56/0.18)]"
              >
                <Truck className="size-5" />
              </span>
            </div>
            <p className="mt-6 flex items-baseline gap-3" aria-hidden>
              <span className="font-wide text-5xl leading-none font-black text-gold-300 tabular-nums">
                0{(reduced ? STEPS.length - 1 : active) + 1}
              </span>
              <span className="text-white/40">/ 0{STEPS.length}</span>
              <span className="ms-2 text-[15px] font-semibold text-white/80">
                {t(STEPS[reduced ? STEPS.length - 1 : active]?.title ?? "export.step1.title")}
              </span>
            </p>
          </div>
        </div>

        <ol data-dossier className="relative space-y-[14vh] pb-[6vh] lg:space-y-[28vh]">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} data-sheet className={cn("sticky", STICK[i])}>
                <article
                  data-sheet-body
                  className="relative origin-top overflow-hidden rounded-2xl bg-white text-navy-900 shadow-[0_30px_70px_-30px_rgb(0_0_0/0.75)]"
                >
                  <header className="flex items-center justify-between gap-4 border-b border-dashed border-navy-900/15 bg-navy-50 px-6 py-3 text-[11px] font-semibold tracking-[0.18em] text-navy-900/55 uppercase sm:px-8">
                    <span className="flex items-center gap-2">
                      <span aria-hidden className="size-1.5 rounded-full bg-gold-500" />
                      {t("export.docTitle")}
                    </span>
                    <span className="tabular-nums" dir="ltr">
                      HAE · 0{i + 1}/0{STEPS.length}
                    </span>
                  </header>
                  <div className="grid gap-6 px-6 pt-7 pb-8 sm:grid-cols-[1fr_auto] sm:px-8 sm:pt-9">
                    <div>
                      <div className="flex items-center gap-4">
                        <span className="grid size-12 place-items-center rounded-xl bg-navy-900 text-gold-300">
                          <Icon className="size-5" aria-hidden />
                        </span>
                        <p className="eyebrow text-gold-600">
                          {t("export.stepLabel", { n: i + 1 })}
                        </p>
                      </div>
                      <h3 className="font-display mt-5 text-2xl font-bold lg:text-[1.9rem] lg:leading-tight">
                        {t(s.title)}
                      </h3>
                      <p className="mt-3 max-w-md text-[16px] leading-relaxed text-muted">
                        {t(s.text)}
                      </p>
                      <p className="mt-6 flex items-center gap-2 border-t border-navy-900/10 pt-4 text-[13px] font-semibold text-navy-900/70">
                        <Check className="size-4 text-gold-600" aria-hidden />
                        {t("export.status")}
                      </p>
                    </div>
                    <div className="hidden items-end sm:flex">
                      <Stamp city={t("export.origin")} />
                    </div>
                  </div>
                  <span
                    aria-hidden
                    data-sheet-dim
                    className="pointer-events-none absolute inset-0 bg-navy-950/45 opacity-0"
                  />
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
