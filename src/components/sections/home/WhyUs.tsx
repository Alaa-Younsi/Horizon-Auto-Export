import { Clock3, type LucideIcon, ShieldCheck, Star, UsersRound } from "lucide-react";
import { useRef } from "react";
import { DrawIcon } from "@/components/fx/DrawIcon";
import { RevealText } from "@/components/fx/RevealText";
import { useGsap } from "@/hooks/useGsap";
import { useReducedMotion } from "@/hooks/useMediaFlags";
import type { TranslationKey } from "@/i18n/dictionaries";
import { useI18n } from "@/i18n/LanguageProvider";
import { gsap } from "@/lib/gsap";

const ITEMS: Array<{ icon: LucideIcon; key: TranslationKey }> = [
  { icon: ShieldCheck, key: "why.i1" },
  { icon: UsersRound, key: "why.i2" },
  { icon: Clock3, key: "why.i3" },
  { icon: Star, key: "why.i4" },
];

/** The mock-up's navy band. A gold line draws across it, then each reason rises in turn. */
export function WhyUs() {
  const { t } = useI18n();
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGsap(
    () => {
      if (reduced) return;
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: "top 80%", once: true },
      });
      tl.from("[data-why-line]", {
        scaleX: 0,
        transformOrigin: "0% 50%",
        duration: 1.4,
        ease: "expo.inOut",
      }).from("[data-why-item]", { y: 36, duration: 1, stagger: 0.1, ease: "expo.out" }, "-=0.9");
    },
    root,
    [reduced],
  );

  return (
    <section ref={root} className="grain relative overflow-hidden bg-navy-900 text-white">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(50%_120%_at_100%_50%,rgb(36_68_125/0.6),transparent_70%)]"
      />
      <div className="container-x relative grid items-center gap-10 py-16 lg:grid-cols-[minmax(0,17rem)_1fr] lg:gap-14 lg:py-20">
        <div>
          <RevealText
            as="h2"
            className="font-display text-[clamp(1.7rem,3vw,2.3rem)] leading-tight font-bold"
          >
            {t("why.title")}
          </RevealText>
          <span aria-hidden className="mt-4 block h-[3px] w-14 bg-gold-500" />
        </div>
        <div className="relative">
          <span
            data-why-line
            aria-hidden
            className="absolute inset-x-0 top-0 hidden h-px bg-gradient-to-r from-gold-400/80 via-gold-400/30 to-transparent lg:block"
          />
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:pt-8">
            {ITEMS.map((item, i) => (
              <li
                key={item.key}
                data-why-item
                className="flex items-center gap-4 lg:border-white/10 lg:px-6 lg:not-last:border-e lg:first:ps-0"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white/5 text-gold-400 ring-1 ring-gold-500/30">
                  <DrawIcon icon={item.icon} className="size-6" delay={0.4 + i * 0.12} />
                </span>
                <p className="text-[15px] leading-snug font-medium text-white/90">{t(item.key)}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
