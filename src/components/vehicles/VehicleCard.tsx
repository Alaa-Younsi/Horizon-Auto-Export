import { ArrowUpRight, Calendar, Cog, Fuel, Gauge, Images } from "lucide-react";
import { Link } from "react-router";
import { TiltCard } from "@/components/fx/TiltCard";
import { Price } from "@/components/ui/Price";
import { SmartImage, VehiclePlaceholder } from "@/components/ui/VehicleImage";
import { useI18n } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/cn";
import { formatKm } from "@/lib/format";
import { vehicleTitle } from "@/lib/vehicles";
import type { VehicleWithMedia } from "@/types/db";

const IMG_SIZES = "(min-width: 1280px) 400px, (min-width: 768px) 45vw, 92vw";

export function StatusBadge({ status }: { status: VehicleWithMedia["status"] }) {
  const { t } = useI18n();
  if (status === "available" || status === "draft") return null;
  return (
    <span
      className={cn(
        "rounded-sm px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase",
        status === "reserved" ? "bg-gold-500 text-white" : "bg-navy-900 text-white",
      )}
    >
      {t(`veh.status.${status}`)}
    </span>
  );
}

export function VehicleCard({
  vehicle: v,
  priority,
}: {
  vehicle: VehicleWithMedia;
  priority?: boolean;
}) {
  const { t, lang, path } = useI18n();
  const title = vehicleTitle(v, lang);
  const cover = v.images[0];
  const demo = v.id.startsWith("demo-");

  const specs = [
    v.year ? { icon: Calendar, text: String(v.year) } : null,
    v.mileage_km !== null ? { icon: Gauge, text: formatKm(v.mileage_km, lang) } : null,
    v.fuel ? { icon: Fuel, text: t(`fuel.${v.fuel}`) } : null,
    v.transmission ? { icon: Cog, text: t(`trans.${v.transmission}`) } : null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);

  return (
    <TiltCard max={5} className="h-full rounded-xl">
      <Link
        to={path(`/vehicles/${v.slug}`)}
        className="group flex h-full flex-col overflow-hidden rounded-xl bg-white ring-1 ring-navy-900/8 shadow-[0_24px_50px_-34px_rgb(4_14_36/0.5)] transition-[box-shadow,transform] duration-500 hover:shadow-[0_34px_70px_-30px_rgb(4_14_36/0.55)] focus-visible:ring-2 focus-visible:ring-gold-500"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-navy-900">
          {cover ? (
            <SmartImage
              src={cover.url}
              sizes={IMG_SIZES}
              alt={cover.alt ?? title}
              width={800}
              height={600}
              loading={priority ? "eager" : "lazy"}
              className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
            />
          ) : (
            <VehiclePlaceholder label={t("veh.noPhoto")} />
          )}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy-950/55 to-transparent"
          />
          <div className="absolute start-3 top-3 flex flex-wrap gap-1.5">
            <StatusBadge status={v.status} />
            {demo && (
              <span className="rounded-sm bg-white/90 px-2.5 py-1 text-[11px] font-bold tracking-wider text-navy-900 uppercase">
                {t("veh.demo")}
              </span>
            )}
          </div>
          {v.images.length > 1 && (
            <span className="absolute end-3 bottom-3 flex items-center gap-1.5 rounded-sm bg-navy-950/60 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
              <Images className="size-3.5" aria-hidden />
              {v.images.length}
            </span>
          )}
          <span className="absolute start-3 bottom-3 rounded-sm bg-white/95 px-2 py-1 text-[11px] font-bold tracking-wide text-navy-900 uppercase">
            {t(`cat.${v.category}`)}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          {v.brand && <p className="eyebrow text-[10.5px] text-gold-700">{v.brand.name}</p>}
          <h3 className="font-display mt-1.5 line-clamp-2 text-[17px] leading-snug font-bold text-navy-900">
            {title}
          </h3>
          {specs.length > 0 && (
            <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-[13px] text-muted">
              {specs.map((s) => (
                <li key={s.text} className="flex items-center gap-1.5">
                  <s.icon className="size-3.5 shrink-0 text-gold-500" aria-hidden />
                  <span className="truncate">{s.text}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
            <div>
              <Price
                value={v.price}
                currency={v.currency}
                className={cn(
                  "font-display block font-bold text-navy-900",
                  v.price === null ? "text-[15px]" : "text-xl",
                )}
              />
              {v.vat_deductible && (
                <span className="mt-0.5 block text-[11.5px] font-semibold text-gold-700">
                  {t("veh.vatDeductible")}
                </span>
              )}
            </div>
            <span className="grid size-10 place-items-center rounded-full bg-navy-50 text-navy-900 transition-colors duration-300 group-hover:bg-gold-500 group-hover:text-white">
              <ArrowUpRight className="size-4" aria-hidden />
              <span className="sr-only">{t("veh.view")}</span>
            </span>
          </div>
        </div>
      </Link>
    </TiltCard>
  );
}
