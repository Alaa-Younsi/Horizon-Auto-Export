import { useRef, useState } from "react";
import { Globe } from "@/components/three/Globe";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useGsap } from "@/hooks/useGsap";
import { useReducedMotion } from "@/hooks/useMediaFlags";
import type { TranslationKey } from "@/i18n/dictionaries";
import { useI18n } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/cn";
import { gsap } from "@/lib/gsap";

const STEPS: Array<{ title: TranslationKey; text: TranslationKey }> = [
  { title: "export.step1.title", text: "export.step1.text" },
  { title: "export.step2.title", text: "export.step2.text" },
  { title: "export.step3.title", text: "export.step3.text" },
  { title: "export.step4.title", text: "export.step4.text" },
];

/**
 * The scroll story. Desktop: the globe stays put (CSS sticky — calmer with Lenis
 * than a GSAP pin) while the four steps scroll past; the story's progress lights
 * up the export lanes out of Bucharest one by one and a gold rule fills beside
 * the steps. Phones: the globe sits on top and plays its lanes as it scrolls by.
 */
export function ExportStory() {
  const { t } = useI18n();
  const root = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();

  useGsap(
    () => {
      if (reduced) {
        progress.current = 1;
        return;
      }
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px)", () => {
        gsap.to("[data-story-rule]", {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-story-steps]",
            start: "top center",
            end: "bottom center",
            scrub: true,
            onUpdate: (self) => {
              progress.current = self.progress;
              setActive(Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length)));
            },
          },
        });
      });
      mm.add("(max-width: 1023px)", () => {
        gsap.to(progress, {
          current: 1,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-story-globe]",
            start: "top 75%",
            end: "bottom 25%",
            scrub: true,
          },
        });
        gsap.from("[data-story-step]", {
          y: 40,
          duration: 1,
          stagger: 0.12,
          ease: "expo.out",
          scrollTrigger: { trigger: "[data-story-steps]", start: "top 85%", once: true },
        });
      });
      return () => mm.revert();
    },
    root,
    [reduced],
  );

  return (
    // overflow-clip, NOT overflow-hidden: hidden makes the section a scroll
    // container and silently breaks the globe's position: sticky.
    <section ref={root} className="grain relative overflow-clip bg-navy-950 text-white">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(60%_50%_at_25%_40%,rgb(36_68_125/0.45),transparent_70%)]"
      />
      <div className="container-x relative pt-24 lg:pt-32">
        <SectionHeading
          tone="light"
          eyebrow={t("export.eyebrow")}
          title={t("export.title")}
          lead={t("export.lead")}
        />
      </div>

      <div className="container-x relative grid gap-6 pb-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pb-10">
        <div
          data-story-globe
          className="relative h-[min(92vw,520px)] lg:sticky lg:top-[10vh] lg:h-[80vh]"
        >
          <Globe
            className="h-full w-full"
            progress={progress}
            label={t("export.globeLabel")}
            origin={t("export.origin")}
          />
        </div>

        <div data-story-steps className="relative lg:py-[22vh]">
          <span
            aria-hidden
            className="absolute inset-y-[22vh] start-0 hidden w-px bg-white/10 lg:block"
          >
            <span
              data-story-rule
              className="block h-full w-full origin-top scale-y-0 bg-gold-400"
            />
          </span>
          <ol className="space-y-6 lg:space-y-0">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                data-story-step
                className={cn(
                  "relative rounded-xl bg-white/[0.03] p-6 ring-1 ring-white/8 transition-[opacity,background-color] duration-700 lg:flex lg:min-h-[52vh] lg:flex-col lg:justify-center lg:rounded-none lg:bg-transparent lg:py-0 lg:ps-12 lg:ring-0",
                  !reduced && "lg:opacity-40",
                  !reduced && active === i && "lg:opacity-100",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute start-[-5px] top-1/2 hidden size-[11px] -translate-y-1/2 rounded-full border-2 transition-colors duration-500 lg:block",
                    active >= i || reduced
                      ? "border-gold-400 bg-gold-400"
                      : "border-white/30 bg-navy-950",
                  )}
                />
                <p className="eyebrow text-gold-300">{t("export.stepLabel", { n: i + 1 })}</p>
                <p
                  aria-hidden
                  className="font-wide mt-2 text-6xl leading-none font-black text-transparent [-webkit-text-stroke:1px_rgb(213_182_127/0.45)] lg:text-7xl"
                >
                  0{i + 1}
                </p>
                <h3 className="font-display mt-4 text-2xl font-bold lg:text-3xl">{t(s.title)}</h3>
                <p className="mt-3 max-w-md text-[16px] leading-relaxed text-white/70">
                  {t(s.text)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
