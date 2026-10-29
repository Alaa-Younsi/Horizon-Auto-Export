import { type QueryClient, useQuery } from "@tanstack/react-query";
import { publicKeys } from "@/hooks/usePublicData";
import { requireSupabase } from "@/lib/supabase";
import type { BrandRow, InquiryRow, Json, SiteSettingsRow, VehicleWithMedia } from "@/types/db";

export const adminKeys = {
  vehicles: ["admin", "vehicles"] as const,
  vehicle: (id: string) => ["admin", "vehicle", id] as const,
  brands: ["admin", "brands"] as const,
  inquiries: ["admin", "inquiries"] as const,
  stats: ["admin", "stats"] as const,
  settings: ["admin", "settings"] as const,
  staff: ["admin", "staff"] as const,
};

/**
 * One write must invalidate EVERY cache holding that row — admin lists and the
 * public site's caches — or staff see "it saved but the site didn't change".
 */
export function invalidateVehicles(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: adminKeys.vehicles });
  void qc.invalidateQueries({ queryKey: ["admin", "vehicle"] });
  void qc.invalidateQueries({ queryKey: adminKeys.stats });
  void qc.invalidateQueries({ queryKey: publicKeys.vehicles });
  void qc.invalidateQueries({ queryKey: ["public", "vehicle"] });
}

/** Brands are embedded in vehicle rows too, so a brand edit refreshes vehicles. */
export function invalidateBrands(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: adminKeys.brands });
  void qc.invalidateQueries({ queryKey: publicKeys.brands });
  invalidateVehicles(qc);
}

export function invalidateInquiries(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: adminKeys.inquiries });
  void qc.invalidateQueries({ queryKey: adminKeys.stats });
}

export function invalidateSettings(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: adminKeys.settings });
  void qc.invalidateQueries({ queryKey: publicKeys.settings });
}

export const ADMIN_VEHICLE_SELECT =
  "*, brand:brands(id, slug, name, logo_url), images:vehicle_images(id, url, alt, sort_order)";

type AdminVehicleRow = Omit<VehicleWithMedia, "images"> & {
  images: VehicleWithMedia["images"] | null;
};

export function normalizeAdminVehicle(row: AdminVehicleRow): VehicleWithMedia {
  return {
    ...row,
    price: row.price === null ? null : Number(row.price),
    images: [...(row.images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  };
}

export const VEHICLES_LIMIT = 500;

export function useAdminVehicles() {
  return useQuery({
    queryKey: adminKeys.vehicles,
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("vehicles")
        .select(ADMIN_VEHICLE_SELECT)
        .order("updated_at", { ascending: false })
        .limit(VEHICLES_LIMIT)
        .overrideTypes<AdminVehicleRow[], { merge: false }>();
      if (error) throw error;
      return { rows: data.map(normalizeAdminVehicle), capped: data.length >= VEHICLES_LIMIT };
    },
  });
}

export function useAdminBrands() {
  return useQuery({
    queryKey: adminKeys.brands,
    queryFn: async (): Promise<BrandRow[]> => {
      const { data, error } = await requireSupabase()
        .from("brands")
        .select("*")
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export const INQUIRIES_LIMIT = 300;

export function useInquiries() {
  return useQuery({
    queryKey: adminKeys.inquiries,
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(INQUIRIES_LIMIT);
      if (error) throw error;
      return { rows: data as InquiryRow[], capped: data.length >= INQUIRIES_LIMIT };
    },
    refetchInterval: 60_000,
  });
}

export interface AdminStats {
  vehicles: {
    available: number;
    reserved: number;
    sold: number;
    draft: number;
    sold_30d: number;
  } | null;
  inquiries: { new: number; open: number; last_30d: number; won_30d: number; spam: number } | null;
  daily: Array<{ day: string; count: number }> | null;
}

function isStats(v: Json): v is Json & AdminStats {
  return typeof v === "object" && v !== null && !Array.isArray(v) && "vehicles" in v;
}

export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats,
    queryFn: async (): Promise<AdminStats> => {
      const { data, error } = await requireSupabase().rpc("get_admin_stats");
      if (error) throw error;
      if (!isStats(data)) throw new Error("ERR_INVALID_INPUT: stats shape");
      return data;
    },
    refetchInterval: 60_000,
  });
}

export function useSettingsRow() {
  return useQuery({
    queryKey: adminKeys.settings,
    queryFn: async (): Promise<SiteSettingsRow | null> => {
      const { data, error } = await requireSupabase()
        .from("site_settings")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
