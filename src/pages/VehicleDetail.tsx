import {
  ArrowLeft,
  Calendar,
  CarFront,
  Check,
  Cog,
  Copy,
  DoorOpen,
  Fuel,
  Gauge,
  Leaf,
  type LucideIcon,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
  Settings2,
  Share2,
  TriangleAlert,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { Reveal } from "@/components/fx/Reveal";
import { ButtonAnchor, ButtonLink } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { Gallery } from "@/components/vehicles/Gallery";
import { StatusBadge, VehicleCard } from "@/components/vehicles/VehicleCard";
import { useSiteSettings, useVehicle, useVehicles } from "@/hooks/usePublicData";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/LanguageProvider";
import { telHref, whatsappHref } from "@/lib/contact";
import { SITE_URL } from "@/lib/env";
import { formatKm, formatNumber } from "@/lib/format";
import { pick, pickLines } from "@/lib/localized";
import { relatedVehicles, vehicleTitle } from "@/lib/vehicles";
import type { VehicleWithMedia } from "@/types/db";

function SpecItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-lg bg-white p-4 ring-1 ring-navy-900/6">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold-50 text-gold-600">
        <Icon className="size-[18px]" strokeWidth={1.6} aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-[11.5px] font-semibold tracking-wide text-muted uppercase">{label}</dt>
        <dd className="truncate font-semibold text-navy-900">{value}</dd>
      </div>
    </div>
  );
}

function useSpecs(v: VehicleWithMedia) {
  const { t, lang } = useI18n();
  const rows: Array<[LucideIcon, string, string | null]> = [
    [Calendar, t("spec.year"), v.year ? String(v.year) : null],
    [Gauge, t("spec.mileage"), v.mileage_km !== null ? formatKm(v.mileage_km, lang) : null],
    [Fuel, t("spec.fuel"), v.fuel ? t(`fuel.${v.fuel}`) : null],
    [Cog, t("spec.transmission"), v.transmission ? t(`trans.${v.transmission}`) : null],
    [
      Zap,
      t("spec.power"),
      v.power_hp ? `${v.power_hp} ${t("unit.hp")} / ${Math.round(v.power_hp * 0.7355)} kW` : null,
    ],
    [Settings2, t("spec.engine"), v.engine_cc ? `${formatNumber(v.engine_cc, lang)} cm³` : null],
    [CarFront, t("spec.body"), t(`body.${v.body_type}`)],
    [Settings2, t("spec.drivetrain"), v.drivetrain ? t(`drive.${v.drivetrain}`) : null],
    [Palette, t("spec.color"), v.color],
    [DoorOpen, t("spec.doors"), v.doors ? String(v.doors) : null],
    [Users, t("spec.seats"), v.seats ? String(v.seats) : null],
    [Leaf, t("spec.euro"), v.euro_norm],
    [MapPin, t("spec.location"), v.location],
  ];
  return rows.filter((r): r is [LucideIcon, string, string] => Boolean(r[2]));
}

function ShareButton({ url, title }: { url: string; title: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // dismissed / blocked: nothing to do
    }
  };
  return (
    <button
      type="button"
      onClick={() => void share()}
      className="inline-flex items-center gap-2 text-sm font-semibold text-navy-900 hover:text-gold-600"
    >
      {copied ? <Copy className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
      {copied ? t("veh.copied") : t("veh.share")}
    </button>
  );
}

function Detail({ v }: { v: VehicleWithMedia }) {
  const { t, lang, path } = useI18n();
  const { data: s } = useSiteSettings();
  const { data: all = [] } = useVehicles();
  const title = vehicleTitle(v, lang);
  const specs = useSpecs(v);
  const description = pick(v.description, lang);
  const equipment = pickLines(v.equipment, lang);
  const damage = pick(v.damage_notes, lang);
  const url = `${SITE_URL}${path(`/vehicles/${v.slug}`)}`;
  const related = relatedVehicles(all, v);
  const cover = v.images[0]?.url;

  useSeo({
    title: `${title}${v.year ? ` (${v.year})` : ""}`,
    description: description.slice(0, 155) || t("meta.vehicles.desc"),
    image: cover,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Car",
      name: title,
      url,
      image: v.images.map((i) => i.url),
      ...(v.brand ? { brand: { "@type": "Brand", name: v.brand.name } } : {}),
      ...(v.model ? { model: v.model } : {}),
      ...(v.year ? { vehicleModelDate: String(v.year) } : {}),
      ...(v.mileage_km !== null
        ? {
            mileageFromOdometer: {
              "@type": "QuantitativeValue",
              value: v.mileage_km,
              unitCode: "KMT",
            },
          }
        : {}),
      ...(v.fuel ? { fuelType: t(`fuel.${v.fuel}`) } : {}),
      itemCondition: "https://schema.org/UsedCondition",
      ...(v.price !== null
        ? {
            offers: {
              "@type": "Offer",
              price: v.price,
              priceCurrency: v.currency,
              url,
              availability:
                v.status === "sold" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
              seller: { "@type": "AutoDealer", name: s?.company_name ?? "Horizon Auto Export" },
            },
          }
        : {}),
    },
  });

  const waText = `${title} — ${url}`;

  return (
    <>
      <section className="bg-paper pt-8 pb-16 lg:pt-12 lg:pb-24">
        <div className="container-x">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Link
              to={path("/vehicles")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-navy-900 hover:text-gold-600"
            >
              <ArrowLeft className="size-4" aria-hidden />
              {t("veh.back")}
            </Link>
            <ShareButton url={url} title={title} />
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.45fr_1fr] lg:gap-12">
            <div className="min-w-0">
              <Gallery
                title={title}
                images={v.images.map((img) => ({
                  id: img.id,
                  url: img.url,
                  alt: img.alt ?? title,
                }))}
              />
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-2xl bg-white p-6 shadow-[0_30px_70px_-50px_rgb(4_14_36/0.6)] ring-1 ring-navy-900/6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-sm bg-navy-50 px-2.5 py-1 text-[11px] font-bold tracking-wide text-navy-900 uppercase">
                    {t(`cat.${v.category}`)}
                  </span>
                  <StatusBadge status={v.status} />
                </div>
                {v.brand && <p className="eyebrow mt-5 text-gold-700">{v.brand.name}</p>}
                <h1 className="font-display mt-2 text-[clamp(1.6rem,3vw,2.2rem)] leading-tight font-bold text-navy-900">
                  {title}
                </h1>
                <div className="mt-6 border-t border-line pt-6">
                  <Price
                    value={v.price}
                    currency={v.currency}
                    className="font-display block text-[2rem] leading-none font-extrabold text-navy-900"
                  />
                  {v.vat_deductible && (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-700">
                      <Check className="size-4" aria-hidden />
                      {t("veh.vatDeductible")}
                    </p>
                  )}
                </div>
                <div className="mt-7 grid gap-3">
                  <ButtonAnchor href="#inquiry" size="lg">
                    {t("form.submit")}
                  </ButtonAnchor>
                  <div className="grid grid-cols-2 gap-3">
                    {s?.whatsapp_e164 && (
                      <ButtonAnchor
                        href={whatsappHref(s.whatsapp_e164, waText)}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="navy"
                      >
                        <MessageCircle className="size-4" aria-hidden />
                        WhatsApp
                      </ButtonAnchor>
                    )}
                    {s?.phone_e164 && (
                      <ButtonAnchor href={telHref(s.phone_e164)} variant="outline">
                        <Phone className="size-4" aria-hidden />
                        {t("veh.call")}
                      </ButtonAnchor>
                    )}
                  </div>
                </div>
                <p className="mt-5 text-xs text-muted">
                  {t("veh.ref")} {v.slug}
                </p>
              </div>
            </aside>
          </div>

          <div className="mt-14 grid gap-12 lg:grid-cols-[1.45fr_1fr] lg:gap-12">
            <div className="space-y-12">
              <Reveal>
                <h2 className="font-display text-2xl font-bold text-navy-900">{t("veh.specs")}</h2>
                <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {specs.map(([icon, label, value]) => (
                    <SpecItem key={label} icon={icon} label={label} value={value} />
                  ))}
                </dl>
              </Reveal>

              {description && (
                <Reveal>
                  <h2 className="font-display text-2xl font-bold text-navy-900">
                    {t("veh.description")}
                  </h2>
                  <p className="mt-5 text-[16.5px] leading-relaxed whitespace-pre-line text-muted">
                    {description}
                  </p>
                </Reveal>
              )}

              {equipment.length > 0 && (
                <Reveal>
                  <h2 className="font-display text-2xl font-bold text-navy-900">
                    {t("veh.equipment")}
                  </h2>
                  <ul className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                    {equipment.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-navy-900">
                        <span className="mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-gold-500 text-white">
                          <Check className="size-2.5" strokeWidth={3.5} aria-hidden />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              )}

              {(v.category === "damaged" || damage) && (
                <Reveal className="rounded-xl border border-gold-300 bg-gold-50 p-6">
                  <h2 className="font-display flex items-center gap-2.5 text-xl font-bold text-navy-900">
                    <TriangleAlert className="size-5 text-gold-600" aria-hidden />
                    {t("veh.damage")}
                  </h2>
                  {damage && (
                    <p className="mt-3 leading-relaxed whitespace-pre-line text-navy-900">
                      {damage}
                    </p>
                  )}
                  <p className="mt-3 text-sm text-muted">{t("veh.damageNote")}</p>
                </Reveal>
              )}
            </div>

            <div id="inquiry" className="scroll-mt-28">
              <div className="rounded-2xl bg-navy-900 p-6 text-white sm:p-8">
                <h2 className="font-display text-2xl font-bold">{t("veh.inquire.title")}</h2>
                <p className="mt-2 text-white/70">{t("veh.inquire.text")}</p>
              </div>
              <div className="-mt-4 rounded-2xl bg-white p-6 ring-1 ring-navy-900/6 sm:p-8">
                <InquiryForm
                  compact
                  vehicle={{ id: v.id, label: `${title}${v.year ? ` (${v.year})` : ""}` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-16 lg:py-24">
          <div className="container-x">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-bold text-navy-900">{t("veh.related")}</h2>
              <ButtonLink to={path("/vehicles")} variant="outline">
                {t("featured.all")}
              </ButtonLink>
            </div>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {related.map((r) => (
                <li key={r.id}>
                  <VehicleCard vehicle={r} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}

function NotAvailable() {
  const { t, path } = useI18n();
  useSeo({ title: t("veh.notFound.title"), noindex: true });
  return (
    <section className="grid min-h-[60vh] place-items-center bg-paper px-6 py-24 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-navy-900 text-gold-300">
          <CarFront className="size-7" aria-hidden />
        </span>
        <h1 className="font-display mt-6 text-3xl font-bold text-navy-900">
          {t("veh.notFound.title")}
        </h1>
        <p className="mt-3 text-muted">{t("veh.notFound.text")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink to={path("/vehicles")}>{t("featured.all")}</ButtonLink>
          <ButtonLink to={`${path("/contact")}?kind=availability`} variant="outline">
            {t("veh.empty.cta")}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

export default function VehicleDetail() {
  const { slug } = useParams();
  const { t } = useI18n();
  const q = useVehicle(slug);
  if (q.isPending) {
    return (
      <div className="grid min-h-[70vh] place-items-center bg-paper text-sm text-muted">
        {t("veh.loading")}
      </div>
    );
  }
  if (!q.data) return <NotAvailable />;
  return <Detail key={q.data.id} v={q.data} />;
}
