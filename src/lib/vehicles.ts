import type { Lang } from "@/i18n/languages";
import {
  FUELS,
  type Fuel,
  PUBLIC_CATEGORIES,
  TRANSMISSIONS,
  type Transmission,
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
  /** Model year range, inclusive; either end may be open. */
  yearMin: number | null;
  yearMax: number | null;
  q: string;
  sort: Sort;
  sold: boolean;
}

export const EMPTY_FILTERS: VehicleFilters = {
  category: null,
  brand: null,
  fuel: null,
  transmission: null,
  yearMin: null,
  yearMax: null,
  q: "",
  sort: "newest",
  sold: false,
};

/** A plausible model year (4 digits, 1950 .. next year), else null. */
export function parseYear(v: string | null): number | null {
  if (!v || !/^[0-9]{4}$/.test(v)) return null;
  const y = Number(v);
  return y >= 1950 && y <= new Date().getFullYear() + 1 ? y : null;
}

function oneOf<T extends string>(list: readonly T[], v: string | null): T | null {
  return v !== null && (list as readonly string[]).includes(v) ? (v as T) : null;
}

/** URL search params are hostile input: anything unknown falls back to "no filter". */
export function parseFilters(params: URLSearchParams): VehicleFilters {
  return {
    category: oneOf(PUBLIC_CATEGORIES, params.get("category")),
    brand:
      params
        .get("brand")
        ?.replace(/[^a-z0-9-]/g, "")
        .slice(0, 60) || null,
    fuel: oneOf(FUELS, params.get("fuel")),
    transmission: oneOf(TRANSMISSIONS, params.get("transmission")),
    yearMin: parseYear(params.get("yearMin")),
    yearMax: parseYear(params.get("yearMax")),
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
  if (f.yearMin) p.set("yearMin", String(f.yearMin));
  if (f.yearMax) p.set("yearMax", String(f.yearMax));
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
    // a vehicle without a year can't satisfy a year range
    if (f.yearMin && (v.year ?? 0) < f.yearMin) return false;
    if (f.yearMax && (v.year === null || v.year > f.yearMax)) return false;
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
  return [
    f.category,
    f.brand,
    f.fuel,
    f.transmission,
    f.yearMin,
    f.yearMax,
    f.q.trim() || null,
    f.sold || null,
  ].filter(Boolean).length;
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
