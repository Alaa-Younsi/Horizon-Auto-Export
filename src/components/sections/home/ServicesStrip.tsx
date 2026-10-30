import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SERVICES } from "@/data/services";
import { useGsap } from "@/hooks/useGsap";
import { useReducedMotion } from "@/hooks/useMediaFlags";
import { useI18n } from "@/i18n/LanguageProvider";
import { gsap } from "@/lib/gsap";

/**
 * The mock-up's five services, in their own section right under the hero (it
 * fills the first screen, so these appear on the first scroll). Navy cards on
 * white: gold number and icon, the service's own icon as a large watermark.
 * Fully lit at rest; hover/focus lifts the card, fills the icon gold and warms
 * the glow — phones have no hover, so nothing depends on it.
 */
export function ServicesStrip() {
  const { t, path } = useI18n();
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGsap(
    () => {
      const grid = root.current?.querySelector("[data-svc-grid]");
      if (reduced || !grid) return;
      gsap.from("[data-svc]", {
        y: 80,
        duration: 1.3,
        stagger: 0.08,
        ease: "expo.out",
        scrollTrigger: { trigger: grid, start: "top 88%", once: true },
      });
      gsap.from("[data-svc-mark]", {
        rotate: -25,
        scale: 0.6,
        duration: 1.8,
        stagger: 0.08,
        ease: "expo.out",
        scrollTrigger: { trigger: grid, start: "top 88%", once: true },
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
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-1 h-px origin-left bg-gold-500 transition-transform duration-500 group-hover:scale-x-110"
              />
            </span>
            <ArrowRight
              className="size-4 text-gold-600 transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
        </div>

        <div
          data-svc-grid
          className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:mt-14 lg:grid-cols-5 lg:gap-5"
        >
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            return (
              // GSAP moves the wrapper, CSS moves the card on hover: one
              // element must never carry both, or a transform transition mid-
              // flight is read back as the tween's end state and it freezes.
              <div key={s.id} data-svc className="last:col-span-2 lg:last:col-span-1">
                <Link
                  to={`${path("/services")}#${s.id}`}
                  className="group relative isolate flex min-h-[220px] flex-col overflow-hidden rounded-2xl bg-navy-900 p-4 sm:min-h-[280px] sm:p-6 text-white shadow-[0_30px_60px_-34px_rgb(4_14_36/0.7)] transition-transform duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1.5 focus-visible:-translate-y-1.5 h-full lg:min-h-[340px]"
                >
                  {/* warm glow in the corner, brighter on hover */}
                  <span
                    aria-hidden
                    className="absolute -end-16 -top-16 -z-10 size-48 rounded-full bg-gold-500/20 blur-3xl transition-opacity duration-500 group-hover:opacity-100 lg:opacity-70"
                  />
                  <span aria-hidden data-svc-mark className="absolute -end-8 -bottom-8 -z-10">
                    <Icon
                      className="size-28 text-white/[0.05] sm:size-44 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:-rotate-6 group-hover:scale-110"
                      strokeWidth={1}
                    />
                  </span>

                  <span className="flex items-center justify-between">
                    <span className="grid size-10 place-items-center rounded-xl bg-gold-500/12 sm:size-12 text-gold-300 ring-1 ring-gold-400/30 transition-colors duration-500 group-hover:bg-gold-500 group-hover:text-navy-950 group-focus-visible:bg-gold-500 group-focus-visible:text-navy-950">
                      <Icon className="size-[22px]" strokeWidth={1.7} aria-hidden />
                    </span>
                    <span className="font-wide text-[13px] font-black tracking-[0.1em] text-gold-300/80 tabular-nums">
                      0{i + 1}
                    </span>
                  </span>

                  <h3 className="font-display mt-auto pt-8 text-[16px] sm:pt-10 sm:text-[19px] leading-snug font-bold text-balance">
                    {t(s.title)}
                  </h3>
                  <p className="mt-2 text-[13px] leading-snug text-white/60 sm:text-[14px]">
                    {t(s.short)}
                  </p>
                  <span className="mt-5 flex items-center gap-1.5 border-t border-white/10 pt-3.5 text-[11px] sm:mt-6 sm:pt-4 sm:text-[12px] font-bold tracking-[0.16em] text-gold-300 uppercase">
                    {t("svc.more")}
                    <ArrowUpRight
                      aria-hidden
                      className="size-3.5 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
