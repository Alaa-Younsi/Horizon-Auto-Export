import { useQuery } from "@tanstack/react-query";
import { DEMO_BRANDS, DEMO_VEHICLES } from "@/data/demo";
import { CONTACT_FALLBACK } from "@/lib/contact";
import { supabase } from "@/lib/supabase";
import type { BrandRow, Localized, SiteSettingsRow, VehicleWithMedia } from "@/types/db";

/**
 * Public, read-only data. Rule for every hook here: with no database linked, or
 * when a read fails, render compiled content or a designed empty state — never
 * a blank page and never a raw error.
 */
export const publicKeys = {
  settings: ["public", "settings"] as const,
  brands: ["public", "brands"] as const,
  vehicles: ["public", "vehicles"] as const,
  vehicle: (slug: string) => ["public", "vehicle", slug] as const,
};

export const isDemoMode = supabase === null;
/** Invented stock is for `vite dev` only — never a production build. */
const demoVehicles = (): VehicleWithMedia[] => (import.meta.env.DEV ? DEMO_VEHICLES : []);

/** Settings merged field by field over the compiled fallback (a blank column keeps its default). */
export function mergeSettings(row: SiteSettingsRow): SiteSettingsRow {
  const f = CONTACT_FALLBACK;
  const filled = (v: Localized | null) => (v && Object.keys(v).length ? v : null);
  return {
    ...row,
    company_name: row.company_name || f.company_name,
    phone_display: row.phone_display || f.phone_display,
    phone_e164: row.phone_e164 || f.phone_e164,
    whatsapp_e164: row.whatsapp_e164 || f.whatsapp_e164,
    email: row.email || f.email,
    address: filled(row.address) ?? f.address,
    hours: filled(row.hours) ?? f.hours,
    vat_id: row.vat_id || f.vat_id,
    trade_register: row.trade_register || f.trade_register,
    map_url: row.map_url || f.map_url,
    socials: row.socials ?? {},
  };
}

export function useSiteSettings() {
  return useQuery({
    queryKey: publicKeys.settings,
    queryFn: async (): Promise<SiteSettingsRow> => {
      if (!supabase) return CONTACT_FALLBACK;
      const { data, error } = await supabase.from("site_settings").select("*").maybeSingle();
      if (error || !data) return CONTACT_FALLBACK;
      return mergeSettings(data);
    },
    placeholderData: CONTACT_FALLBACK,
    staleTime: 30 * 60 * 1000,
    retry: 0,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: publicKeys.brands,
    queryFn: async (): Promise<BrandRow[]> => {
      if (!supabase) return DEMO_BRANDS;
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("active", true)
        .order("sort_order")
        .order("name");
      if (error) return DEMO_BRANDS;
      return data;
    },
    placeholderData: DEMO_BRANDS,
    staleTime: 30 * 60 * 1000,
  });
}

const VEHICLE_SELECT =
  "*, brand:brands(id, slug, name, logo_url), images:vehicle_images(id, url, alt, sort_order)";

type VehicleQueryRow = Omit<VehicleWithMedia, "images"> & {
  images: VehicleWithMedia["images"] | null;
};

/** Numeric columns can arrive as strings over PostgREST; images arrive unordered. */
export function normalizeVehicle(row: VehicleQueryRow): VehicleWithMedia {
  return {
    ...row,
    price: row.price === null ? null : Number(row.price),
    images: [...(row.images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  };
}

/**
 * Every published (non-draft) vehicle, in one cached request, filtered in the
 * browser: the filter bar is flicked constantly and a single-dealer inventory
 * stays small. Revisit (server-side filters + pagination) past ~500 vehicles.
 */
export function useVehicles() {
  return useQuery({
    queryKey: publicKeys.vehicles,
    queryFn: async (): Promise<VehicleWithMedia[]> => {
      if (!supabase) return demoVehicles();
      const { data, error } = await supabase
        .from("vehicles")
        .select(VEHICLE_SELECT)
        .neq("status", "draft")
        .order("featured", { ascending: false })
        .order("sort_order")
        .order("created_at", { ascending: false })
        .limit(500)
        .overrideTypes<VehicleQueryRow[], { merge: false }>();
      if (error) throw error;
      return data.map(normalizeVehicle);
    },
  });
}

export function useVehicle(slug: string | undefined) {
  return useQuery({
    queryKey: publicKeys.vehicle(slug ?? ""),
    enabled: Boolean(slug),
    queryFn: async (): Promise<VehicleWithMedia | null> => {
      if (!supabase) return demoVehicles().find((v) => v.slug === slug) ?? null;
      const { data, error } = await supabase
        .from("vehicles")
        .select(VEHICLE_SELECT)
        .eq("slug", slug ?? "")
        .neq("status", "draft")
        .maybeSingle()
        .overrideTypes<VehicleQueryRow | null, { merge: false }>();
      if (error) throw error;
      return data ? normalizeVehicle(data) : null;
    },
  });
}
