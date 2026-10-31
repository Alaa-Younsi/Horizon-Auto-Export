import { ArrowRight, Check } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SERVICES } from "@/data/services";
import { useGsap } from "@/hooks/useGsap";
import { useReducedMotion } from "@/hooks/useMediaFlags";
import { useI18n } from "@/i18n/LanguageProvider";
import { gsap } from "@/lib/gsap";

/**
 * What the company offers — passenger cars and commercial vehicles — as two
 * wide navy cards right under the hero (it fills the first screen, so these
 * appear on the first scroll). Each card carries its service's three key
 * points; the service icon sits large and faint in the corner. Lit at rest;
 * hover only lifts the card and warms its glow.
 */
export function ServicesStrip() {
  const { t, path } = useI18n();
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGsap(
    () => {
      const grid = root.current?.querySelector("[data-svc-grid]");
      if (reduced || !grid) return;
      const trigger = { trigger: grid, start: "top 85%", once: true };
      gsap.from("[data-svc]", {
        y: 80,
        duration: 1.3,
        stagger: 0.12,
        ease: "expo.out",
        scrollTrigger: trigger,
      });
      gsap.from("[data-svc-mark]", {
        rotate: -20,
        scale: 0.7,
        duration: 1.8,
        stagger: 0.12,
        ease: "expo.out",
        scrollTrigger: trigger,
      });
    },
    root,
    [reduced],
  );

  return (
    <section
      ref={root}
      aria-labelledby="svc-home-title"
      className="relative bg-white pt-20 lg:pt-28"
    >
      <div className="container-x">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading id="svc-home-title" eyebrow={t("svc.eyebrow")} title={t("svc.title")} />
          <Link
            to={path("/services")}
            className="group inline-flex shrink-0 items-center gap-2 text-[15px] font-semibold text-navy-900"
          >
            <span className="relative">
              {t("svc.all")}
              <span aria-hidden className="absolute inset-x-0 -bottom-1 h-px bg-gold-500" />
            </span>
            <ArrowRight
              className="size-4 text-gold-600 transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
        </div>

        <div data-svc-grid className="mt-10 grid gap-5 lg:mt-14 lg:grid-cols-2 lg:gap-6">
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            return (
              // GSAP moves the wrapper, CSS moves the card on hover: one element
              // must never carry both, or a transform transition mid-flight is
              // read back as the tween's end state and the card freezes.
              <div key={s.id} data-svc>
                <article className="group relative isolate flex h-full min-h-[360px] flex-col overflow-hidden rounded-3xl bg-navy-900 p-7 text-white shadow-[0_40px_80px_-44px_rgb(4_14_36/0.75)] transition-transform duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1.5 sm:p-10">
                  <span
                    aria-hidden
                    className="absolute -end-24 -top-24 -z-10 size-72 rounded-full bg-gold-500/20 blur-3xl transition-opacity duration-500 group-hover:opacity-100 lg:opacity-60"
                  />
                  <span aria-hidden data-svc-mark className="absolute -end-10 -bottom-12 -z-10">
                    <Icon
                      className="size-64 text-white/[0.05] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:-rotate-6 group-hover:scale-105 sm:size-80"
                      strokeWidth={0.9}
                    />
                  </span>

                  <div className="flex items-center justify-between">
                    <span className="grid size-14 place-items-center rounded-2xl bg-gold-500 text-navy-950">
                      <Icon className="size-7" strokeWidth={1.7} aria-hidden />
                    </span>
                    <span className="font-wide text-[15px] font-black tracking-[0.1em] text-gold-300/80 tabular-nums">
                      0{i + 1} / 0{SERVICES.length}
                    </span>
                  </div>

                  <h3 className="font-display mt-auto pt-12 text-[clamp(1.6rem,2.6vw,2.2rem)] leading-tight font-bold">
                    {t(s.title)}
                  </h3>
                  <p className="mt-2 text-[16px] font-semibold text-gold-300">{t(s.short)}</p>
                  <ul className="mt-6 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-3 sm:gap-4">
                    {s.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-2.5 text-[14px] leading-snug text-white/75"
                      >
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-gold-400"
                          strokeWidth={2.5}
                          aria-hidden
                        />
                        {t(b)}
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
