import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { useVehicles } from "@/hooks/usePublicData";
import { useI18n } from "@/i18n/LanguageProvider";

/**
 * Featured stock as a snap-scrolling track (native scroll: momentum, trackpads
 * and touch all work for free). Falls back to the newest available vehicles if
 * none are flagged featured; renders nothing when there is no stock at all.
 */
export function FeaturedVehicles() {
  const { t, path } = useI18n();
  const { data = [] } = useVehicles();
  const track = useRef<HTMLUListElement>(null);
  const available = data.filter((v) => v.status !== "sold");
  const featured = available.filter((v) => v.featured);
  const list = (featured.length >= 3 ? featured : available).slice(0, 8);
  if (list.length === 0) return null;

  const scrollBy = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("li");
    el.scrollBy({ left: dir * ((card?.clientWidth ?? 320) + 24), behavior: "smooth" });
  };

  return (
    <section className="overflow-hidden py-20 lg:py-28">
      <div className="container-x flex flex-wrap items-end justify-between gap-6">
        <SectionHeading eyebrow={t("featured.eyebrow")} title={t("featured.title")} />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label={t("veh.gallery.prev")}
            className="grid size-12 place-items-center rounded-full ring-1 ring-navy-900/15 transition-colors hover:bg-navy-900 hover:text-white"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label={t("veh.gallery.next")}
            className="grid size-12 place-items-center rounded-full ring-1 ring-navy-900/15 transition-colors hover:bg-navy-900 hover:text-white"
          >
            <ArrowRight className="size-5" aria-hidden />
          </button>
          <ButtonLink to={path("/vehicles")} variant="navy" className="ms-2 hidden sm:inline-flex">
            {t("featured.all")}
          </ButtonLink>
        </div>
      </div>
      <ul
        ref={track}
        className="mt-12 flex snap-x snap-mandatory scroll-px-[max(1rem,calc((100vw-82rem)/2+2.5rem))] gap-6 overflow-x-auto scroll-smooth px-[max(1rem,calc((100vw-82rem)/2+2.5rem))] pb-8 scrollbar-none"
      >
        {list.map((v) => (
          <li key={v.id} className="w-[min(84vw,380px)] shrink-0 snap-start">
            <VehicleCard vehicle={v} />
          </li>
        ))}
      </ul>
    </section>
  );
}
