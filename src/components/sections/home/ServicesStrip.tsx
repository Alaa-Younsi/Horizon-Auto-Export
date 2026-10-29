import { ArrowUpRight } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router";
import { DrawIcon } from "@/components/fx/DrawIcon";
import { SERVICES } from "@/data/services";
import { useGsap } from "@/hooks/useGsap";
import { useReducedMotion } from "@/hooks/useMediaFlags";
import { useI18n } from "@/i18n/LanguageProvider";
import { gsap } from "@/lib/gsap";

/**
 * The mock-up's five-column services band, lifted onto the hero's lower edge.
 * At rest every tile is already "lit" (gold icon, gold rule stub) — hover only
 * adds lift and a full-width rule, because phones have no hover at all.
 */
export function ServicesStrip() {
  const { t, path } = useI18n();
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGsap(
    () => {
      if (reduced) return;
      gsap.from("[data-svc]", {
        y: 60,
        duration: 1.2,
        stagger: 0.08,
        ease: "expo.out",
        scrollTrigger: { trigger: root.current, start: "top 92%", once: true },
      });
    },
    root,
    [reduced],
  );

  return (
    <section aria-label={t("svc.eyebrow")} className="relative z-20 -mt-20 pb-6 sm:-mt-16">
      <div className="container-x">
        <div
          ref={root}
          className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-line shadow-[0_40px_80px_-40px_rgb(4_14_36/0.45)] ring-1 ring-navy-900/6 lg:grid-cols-5"
        >
          {SERVICES.map((s, i) => (
            <Link
              key={s.id}
              data-svc
              to={`${path("/services")}#${s.id}`}
              className="group relative flex flex-col items-center bg-white px-3 pt-7 pb-7 text-center transition-colors duration-500 last:col-span-2 hover:bg-navy-50 focus-visible:bg-navy-50 sm:px-6 lg:pt-9 lg:pb-8 lg:last:col-span-1"
            >
              <span className="relative grid size-14 place-items-center rounded-full lg:size-16 bg-gold-50 text-gold-600 ring-1 ring-gold-200 transition-[background-color,color,transform] duration-500 group-hover:-translate-y-1 group-hover:bg-navy-900 group-hover:text-gold-300 group-focus-visible:bg-navy-900 group-focus-visible:text-gold-300">
                <DrawIcon icon={s.icon} className="size-6 lg:size-7" delay={0.2 + i * 0.1} />
              </span>
              <h3 className="font-display mt-4 text-[14px] font-bold text-navy-900 sm:text-[15px] lg:mt-5">
                {t(s.title)}
              </h3>
              <p className="mt-1.5 text-[12.5px] leading-snug text-muted sm:text-[13.5px]">
                {t(s.short)}
              </p>
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 mx-auto h-[3px] w-8 bg-gold-500 transition-[width] duration-500 ease-[var(--ease-out-expo)] group-hover:w-full group-focus-visible:w-full"
              />
              <ArrowUpRight
                aria-hidden
                className="absolute end-4 top-4 size-4 text-navy-900/25 transition-[transform,color] duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gold-500"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
