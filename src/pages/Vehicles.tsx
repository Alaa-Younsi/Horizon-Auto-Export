import { ArrowRight, CarFront, RotateCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useDeferredValue, useMemo } from "react";
import { useSearchParams } from "react-router";
import { PageHero } from "@/components/layout/PageHero";
import { CtaBand } from "@/components/sections/CtaBand";
import { ButtonLink } from "@/components/ui/Button";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { VehicleFilters } from "@/components/vehicles/VehicleFilters";
import { useReducedMotion } from "@/hooks/useMediaFlags";
import { useBrands, useVehicles } from "@/hooks/usePublicData";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/LanguageProvider";
import {
  applyFilters,
  type VehicleFilters as Filters,
  filtersToParams,
  parseFilters,
} from "@/lib/vehicles";

function SkeletonGrid() {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
        <li key={i} className="overflow-hidden rounded-xl bg-white ring-1 ring-navy-900/6">
          <div className="aspect-[4/3] animate-pulse bg-navy-50" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-1/3 animate-pulse rounded bg-navy-50" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-navy-50" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-navy-50" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Vehicles() {
  const { t, lang, path } = useI18n();
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(params), [params]);
  const deferred = useDeferredValue(filters);
  const vehicles = useVehicles();
  const { data: brands = [] } = useBrands();
  const reduced = useReducedMotion();
  useSeo({ title: t("meta.vehicles.title"), description: t("meta.vehicles.desc") });

  const all = vehicles.data ?? [];
  const list = useMemo(() => applyFilters([...all], deferred, lang), [all, deferred, lang]);
  const tradedBrands = brands.filter((b) => all.some((v) => v.brand?.slug === b.slug));

  const onChange = (next: Filters) =>
    setParams(filtersToParams(next), { replace: true, preventScrollReset: true });

  return (
    <>
      <PageHero eyebrow={t("veh.eyebrow")} title={t("veh.title")} lead={t("veh.lead")} />

      <section className="relative bg-paper pb-20 lg:pb-28">
        <div className="container-x -mt-8 sm:-mt-10">
          <div className="relative z-10">
            <VehicleFilters
              value={filters}
              onChange={onChange}
              brands={tradedBrands.length ? tradedBrands : brands}
            />
          </div>

          <p aria-live="polite" className="mt-8 mb-6 text-sm font-semibold text-muted">
            {!vehicles.isPending &&
              !vehicles.isError &&
              (list.length === 1 ? t("veh.results.one") : t("veh.results", { n: list.length }))}
          </p>

          {vehicles.isPending ? (
            <SkeletonGrid />
          ) : vehicles.isError ? (
            <div className="rounded-xl bg-white p-10 text-center ring-1 ring-navy-900/8">
              <p className="text-navy-900">{t("veh.loadError")}</p>
              <button
                type="button"
                onClick={() => void vehicles.refetch()}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gold-700 hover:text-gold-600"
              >
                <RotateCw className="size-4" aria-hidden />
                {t("veh.retry")}
              </button>
            </div>
          ) : list.length === 0 ? (
            <div className="grid place-items-center rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-navy-900/8">
              <span className="grid size-16 place-items-center rounded-full bg-navy-900 text-gold-300">
                <CarFront className="size-7" aria-hidden />
              </span>
              <h2 className="font-display mt-6 text-2xl font-bold text-navy-900">
                {all.length === 0 ? t("veh.empty.stockTitle") : t("veh.empty.title")}
              </h2>
              <p className="mt-3 max-w-md text-muted">
                {all.length === 0 ? t("veh.empty.stockText") : t("veh.empty.text")}
              </p>
              <ButtonLink to={`${path("/contact")}?kind=sourcing`} className="mt-8">
                {t("veh.empty.cta")}
                <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
            </div>
          ) : (
            <motion.ul layout={!reduced} className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout" initial={false}>
                {list.map((v, i) => (
                  <motion.li
                    key={v.id}
                    layout={!reduced}
                    initial={{ scale: 0.94, y: 24 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.94, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <VehicleCard vehicle={v} priority={i < 3} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
