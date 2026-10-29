import type { Lang } from "@/i18n/languages";
import {
  FUELS,
  type Fuel,
  TRANSMISSIONS,
  type Transmission,
  VEHICLE_CATEGORIES,
  type VehicleCategory,
  type VehicleWithMedia,
} from "@/types/db";
import { pick } from "./localized";

export function vehicleTitle(v: Pick<VehicleWithMedia, "title" | "brand" | "model">, lang: Lang) {
  const own = pick(v.title, lang);
  if (own) return own;
  return [v.brand?.name, v.model].filter(Boolean).join(" ") || "—";
}

// ---- filters ------------------------------------------------------------------

export const SORTS = ["newest", "priceAsc", "priceDesc", "yearDesc", "mileageAsc"] as const;
export type Sort = (typeof SORTS)[number];

export interface VehicleFilters {
  category: VehicleCategory | null;
  brand: string | null;
  fuel: Fuel | null;
  transmission: Transmission | null;
  q: string;
  sort: Sort;
  sold: boolean;
}

function oneOf<T extends string>(list: readonly T[], v: string | null): T | null {
  return v !== null && (list as readonly string[]).includes(v) ? (v as T) : null;
}

/** URL search params are hostile input: anything unknown falls back to "no filter". */
export function parseFilters(params: URLSearchParams): VehicleFilters {
  return {
    category: oneOf(VEHICLE_CATEGORIES, params.get("category")),
    brand:
      params
        .get("brand")
        ?.replace(/[^a-z0-9-]/g, "")
        .slice(0, 60) || null,
    fuel: oneOf(FUELS, params.get("fuel")),
    transmission: oneOf(TRANSMISSIONS, params.get("transmission")),
    q: (params.get("q") ?? "").slice(0, 80),
    sort: oneOf(SORTS, params.get("sort")) ?? "newest",
    sold: params.get("sold") === "1",
  };
}

export function filtersToParams(f: VehicleFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.category) p.set("category", f.category);
  if (f.brand) p.set("brand", f.brand);
  if (f.fuel) p.set("fuel", f.fuel);
  if (f.transmission) p.set("transmission", f.transmission);
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.sort !== "newest") p.set("sort", f.sort);
  if (f.sold) p.set("sold", "1");
  return p;
}

const fold = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Prices "on request" (NULL) always sort after priced vehicles, both directions. */
function byPrice(dir: 1 | -1) {
  return (a: VehicleWithMedia, b: VehicleWithMedia) => {
    if (a.price === null && b.price === null) return 0;
    if (a.price === null) return 1;
    if (b.price === null) return -1;
    return (a.price - b.price) * dir;
  };
}

export function applyFilters(list: VehicleWithMedia[], f: VehicleFilters, lang: Lang) {
  const terms = fold(f.q).split(/\s+/).filter(Boolean);
  const out = list.filter((v) => {
    if (!f.sold && v.status === "sold") return false;
    if (f.category && v.category !== f.category) return false;
    if (f.brand && v.brand?.slug !== f.brand) return false;
    if (f.fuel && v.fuel !== f.fuel) return false;
    if (f.transmission && v.transmission !== f.transmission) return false;
    if (terms.length) {
      const hay = fold(
        [vehicleTitle(v, lang), v.brand?.name, v.model, v.year, v.color, v.location].join(" "),
      );
      if (!terms.every((t) => hay.includes(t))) return false;
    }
    return true;
  });
  switch (f.sort) {
    case "priceAsc":
      return out.sort(byPrice(1));
    case "priceDesc":
      return out.sort(byPrice(-1));
    case "yearDesc":
      return out.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    case "mileageAsc":
      return out.sort(
        (a, b) =>
          (a.mileage_km ?? Number.MAX_SAFE_INTEGER) - (b.mileage_km ?? Number.MAX_SAFE_INTEGER),
      );
    default:
      return out; // already newest-first (featured, sort_order, created_at desc) from the query
  }
}

export function activeFilterCount(f: VehicleFilters): number {
  return [f.category, f.brand, f.fuel, f.transmission, f.q.trim() || null, f.sold || null].filter(
    Boolean,
  ).length;
}

/** Same category first, then same make, then nearest year — excluding the vehicle itself. */
export function relatedVehicles(all: VehicleWithMedia[], v: VehicleWithMedia, limit = 3) {
  const score = (x: VehicleWithMedia) =>
    (x.category === v.category ? 4 : 0) +
    (x.brand?.slug && x.brand.slug === v.brand?.slug ? 2 : 0) -
    Math.abs((x.year ?? 0) - (v.year ?? 0)) / 10;
  return all
    .filter((x) => x.id !== v.id && x.status !== "sold")
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit);
}
