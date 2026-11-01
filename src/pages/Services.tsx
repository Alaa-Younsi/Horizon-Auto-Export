import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { DrawIcon } from "@/components/fx/DrawIcon";
import { PageHero } from "@/components/layout/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { PAGE_SERVICES } from "@/data/services";
import { useGsap } from "@/hooks/useGsap";
import { useReducedMotion } from "@/hooks/useMediaFlags";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/LanguageProvider";
import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/cn";
import { gsap } from "@/lib/gsap";

export default function Services() {
  const { t, path } = useI18n();
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useSeo({ title: t("meta.services.title"), description: t("meta.services.desc") });

  useGsap(
    () => {
      if (reduced) return;
      for (const row of gsap.utils.toArray<HTMLElement>("[data-svc-row]")) {
        gsap.from(row.querySelectorAll("[data-svc-anim]"), {
          y: 50,
          duration: 1.2,
          stagger: 0.08,
          ease: "expo.out",
          scrollTrigger: { trigger: row, start: "top 80%", once: true },
        });
        const num = row.querySelector("[data-svc-num]");
        if (num) {
          gsap.fromTo(
            num,
            { yPercent: 30 },
            {
              yPercent: -30,
              ease: "none",
              scrollTrigger: { trigger: row, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        }
      }
    },
    root,
    [reduced],
  );

  return (
    <>
      <PageHero
        eyebrow={t("svcPage.eyebrow")}
        title={t("svcPage.title")}
        lead={t("svcPage.lead")}
      />

      <div ref={root} className="py-12 lg:py-20">
        {PAGE_SERVICES.map((s, i) => {
          return (
            <section
              key={s.id}
              id={s.id}
              data-svc-row
              aria-labelledby={`svc-${s.id}`}
              className="scroll-mt-28 py-10 lg:py-14"
            >
              <div
                className={cn(
                  "container-x grid items-center gap-10 lg:grid-cols-2 lg:gap-20",
                  i % 2 === 1 && "lg:[&>*:first-child]:order-2",
                )}
              >
                <div className="relative grid aspect-[16/11] place-items-center overflow-hidden rounded-2xl bg-navy-900 text-gold-300">
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[radial-gradient(70%_70%_at_30%_25%,rgb(36_68_125/0.9),transparent_70%)]"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-x-0 top-[64%] h-px bg-gradient-to-r from-transparent via-gold-400/70 to-transparent"
                  />
                  <span
                    data-svc-num
                    aria-hidden
                    className="font-wide absolute -end-4 -bottom-6 text-[11rem] leading-none font-black text-transparent [-webkit-text-stroke:1px_rgb(213_182_127/0.25)]"
                  >
                    0{i + 1}
                  </span>
                  <span className="relative grid size-32 place-items-center rounded-full bg-white/5 ring-1 ring-gold-400/30 backdrop-blur-sm">
                    <DrawIcon icon={s.icon} className="size-14" />
                  </span>
                </div>
                <div>
                  <p data-svc-anim className="eyebrow flex items-center gap-3 text-gold-600">
                    <span aria-hidden className="h-px w-8 bg-current" />0{i + 1}
                  </p>
                  <h2
                    data-svc-anim
                    id={`svc-${s.id}`}
                    className="font-display mt-4 text-[clamp(1.8rem,3.4vw,2.7rem)] leading-tight font-bold text-navy-900"
                  >
                    {t(s.title)}
                  </h2>
                  <p data-svc-anim className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted">
                    {t(s.text)}
                  </p>
                  <div data-svc-anim className="mt-9 flex flex-wrap gap-3">
                    <ButtonLink to={`${path("/contact")}?kind=${s.kind}`}>
                      {t("hero.cta")}
                      <ArrowRight
                        className="size-4 transition-transform group-hover/btn:translate-x-1"
                        aria-hidden
                      />
                    </ButtonLink>
                    {s.stock && (
                      <ButtonLink to={path("/vehicles")} variant="outline">
                        {t("hero.ctaSecondary")}
                      </ButtonLink>
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <p className="container-x flex items-center gap-5 pb-20 text-center text-[clamp(1rem,1.6vw,1.2rem)] text-navy-900/80 italic lg:pb-28">
        <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-transparent to-gold-500" />
        {BRAND_NAME} — Excellence Beyond Borders.
        <span aria-hidden className="h-px flex-1 bg-gradient-to-l from-transparent to-gold-500" />
      </p>
    </>
  );
}
