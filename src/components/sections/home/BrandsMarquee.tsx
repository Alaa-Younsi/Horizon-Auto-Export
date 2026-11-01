import { Link } from "react-router";
import { BrandMark } from "@/components/ui/BrandMark";
import { useBrands } from "@/hooks/usePublicData";
import { useI18n } from "@/i18n/LanguageProvider";

/**
 * "Mărci disponibile": an endless, slow marquee of the makes we trade.
 * Each mark links to the vehicles page filtered by that make. Marks are navy at
 * rest (fully "lit"), gold on hover/focus. Pauses on hover; static under reduced
 * motion (the global rule stops the animation).
 */
export function BrandsMarquee() {
  const { t, path } = useI18n();
  const { data: brands = [] } = useBrands();
  const shown = brands.filter((b) => b.show_on_home);
  if (shown.length === 0) return null;
  // Enough copies to overfill a wide screen, then the whole run twice for the loop.
  const run = Array.from({ length: Math.max(2, Math.ceil(12 / shown.length)) }, () => shown).flat();
  // The run is duplicated on purpose (seamless loop), so each copy needs its own key.
  const items = [...run, ...run].map((brand, n) => ({ brand, id: `${brand.id}:${n}`, n }));

  return (
    <section aria-labelledby="brands-title" className="border-y border-line bg-paper/60">
      <div className="container-x flex flex-col gap-6 py-8 lg:flex-row lg:items-center lg:gap-10">
        <h2 id="brands-title" className="shrink-0 text-[15px] font-bold text-navy-900">
          {t("brands.title")}
        </h2>
        <div className="group/marquee relative min-w-0 flex-1 overflow-hidden mask-fade-x">
          <ul className="flex w-max animate-marquee items-center [--marquee-duration:46s] group-hover/marquee:[animation-play-state:paused]">
            {items.map(({ brand: b, id, n }) => (
              <li key={id} aria-hidden={n >= shown.length || undefined} className="px-7 lg:px-9">
                <Link
                  to={`${path("/vehicles")}?brand=${b.slug}`}
                  tabIndex={n >= shown.length ? -1 : undefined}
                  className="flex h-9 items-center text-navy-900/80 transition-[color,transform] duration-300 hover:scale-110 hover:text-gold-500 focus-visible:text-gold-500"
                  title={b.name}
                >
                  <BrandMark brand={b} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
