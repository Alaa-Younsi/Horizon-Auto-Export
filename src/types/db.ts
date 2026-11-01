/**
 * Database types, in the shape `supabase gen types typescript` produces, written
 * by hand against supabase/migrations. Once the project is linked you can
 * regenerate: `bunx supabase gen types typescript --project-id <id> > src/types/db.ts`
 * (then re-export the helper aliases at the bottom).
 */
import type { Lang } from "@/i18n/languages";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/** {"ro": "...", "en": "...", "fr": "..."} — every language optional per row. */
export type Localized = { [K in Lang]?: string };

export const VEHICLE_CATEGORIES = ["passenger", "commercial", "damaged"] as const;
/** The categories the public site offers (the company sells passenger + commercial). */
export const PUBLIC_CATEGORIES = ["passenger", "commercial"] as const;
export type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];

export const BODY_TYPES = [
  "sedan",
  "suv",
  "hatchback",
  "estate",
  "coupe",
  "convertible",
  "mpv",
  "van",
  "pickup",
  "truck",
  "other",
] as const;
export type BodyType = (typeof BODY_TYPES)[number];

export const FUELS = [
  "petrol",
  "diesel",
  "hybrid",
  "plugin_hybrid",
  "electric",
  "lpg",
  "cng",
  "other",
] as const;
export type Fuel = (typeof FUELS)[number];

export const TRANSMISSIONS = ["manual", "automatic"] as const;
export type Transmission = (typeof TRANSMISSIONS)[number];

export const DRIVETRAINS = ["fwd", "rwd", "awd"] as const;
export type Drivetrain = (typeof DRIVETRAINS)[number];

export const VEHICLE_STATUSES = ["draft", "available", "reserved", "sold"] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const CURRENCIES = ["EUR", "RON"] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Pipeline order — every list renders statuses in THIS order, never Object.keys(). */
export const INQUIRY_STATUSES = ["new", "contacted", "negotiating", "won", "lost", "spam"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

/** The subjects the contact form offers (0009_inquiry_subjects.sql). */
export const INQUIRY_KINDS = ["general", "vehicle", "availability", "delivery"] as const;
export type InquiryKind = (typeof INQUIRY_KINDS)[number];
/** Subjects of the first version of the form; old rows may still carry them. */
export const LEGACY_INQUIRY_KINDS = ["sourcing", "sell", "export"] as const;
export type StoredInquiryKind = InquiryKind | (typeof LEGACY_INQUIRY_KINDS)[number];

type Rel<FK extends string, Col extends string, Ref extends string> = {
  foreignKeyName: FK;
  columns: [Col];
  isOneToOne: false;
  referencedRelation: Ref;
  referencedColumns: [Col extends "user_id" ? "user_id" : "id"];
};

/** Insert = every column optional except the listed required ones. */
type TableDef<Row, Req extends keyof Row, R extends Rel<string, string, string>[] = []> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Req>;
  Update: Partial<Row>;
  Relationships: R;
};

export type BrandRow = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  show_on_home: boolean;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type VehicleRow = {
  id: string;
  slug: string;
  title: Localized;
  description: Localized;
  equipment: Localized;
  damage_notes: Localized;
  category: VehicleCategory;
  body_type: BodyType;
  brand_id: string | null;
  model: string | null;
  year: number | null;
  mileage_km: number | null;
  fuel: Fuel | null;
  transmission: Transmission | null;
  drivetrain: Drivetrain | null;
  power_hp: number | null;
  engine_cc: number | null;
  color: string | null;
  doors: number | null;
  seats: number | null;
  euro_norm: string | null;
  location: string | null;
  price: number | null;
  currency: Currency;
  vat_deductible: boolean;
  status: VehicleStatus;
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type VehicleImageRow = {
  id: string;
  vehicle_id: string;
  url: string;
  alt: string | null;
  sort_order: number;
  created_at: string;
};

export type VehiclePrivateRow = {
  vehicle_id: string;
  vin: string | null;
  purchase_price: number | null;
  purchase_currency: Currency;
  supplier: string | null;
  internal_notes: string | null;
  updated_at: string;
};

export type InquiryRow = {
  id: string;
  reference: string;
  kind: StoredInquiryKind;
  vehicle_id: string | null;
  vehicle_label: string | null;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  country: string | null;
  message: string;
  language: Lang;
  consent_at: string;
  status: InquiryStatus;
  admin_notes: string | null;
  notified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SiteSettingsRow = {
  id: boolean;
  company_name: string | null;
  phone_display: string | null;
  phone_e164: string | null;
  whatsapp_e164: string | null;
  email: string | null;
  address: Localized | null;
  hours: Localized | null;
  vat_id: string | null;
  trade_register: string | null;
  map_url: string | null;
  hero_image_url: string | null;
  about_image_url: string | null;
  socials: Record<string, string>;
  updated_at: string;
};

export type AdminProfileRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  is_owner: boolean;
  sections: string[];
  active: boolean;
  created_at: string;
};

export type NotificationPrefsRow = {
  user_id: string;
  email_enabled: boolean;
  notify_email: string | null;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      brands: TableDef<BrandRow, "slug" | "name">;
      vehicles: TableDef<
        VehicleRow,
        "slug" | "title",
        [Rel<"vehicles_brand_id_fkey", "brand_id", "brands">]
      >;
      vehicle_images: TableDef<
        VehicleImageRow,
        "vehicle_id" | "url",
        [Rel<"vehicle_images_vehicle_id_fkey", "vehicle_id", "vehicles">]
      >;
      vehicle_private: TableDef<
        VehiclePrivateRow,
        "vehicle_id",
        [Rel<"vehicle_private_vehicle_id_fkey", "vehicle_id", "vehicles">]
      >;
      inquiries: TableDef<
        InquiryRow,
        "reference" | "name" | "email" | "message" | "consent_at",
        [Rel<"inquiries_vehicle_id_fkey", "vehicle_id", "vehicles">]
      >;
      site_settings: TableDef<SiteSettingsRow, never>;
      admin_profiles: TableDef<AdminProfileRow, "user_id">;
      admin_notification_prefs: TableDef<
        NotificationPrefsRow,
        "user_id",
        [Rel<"admin_notification_prefs_user_id_fkey", "user_id", "admin_profiles">]
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      submit_inquiry: { Args: { p: Json }; Returns: string };
      get_admin_stats: { Args: Record<string, never>; Returns: Json };
      has_section: { Args: { s: string }; Returns: boolean };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_owner: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type TableName = keyof Database["public"]["Tables"];
export type Insert<T extends TableName> = Database["public"]["Tables"][T]["Insert"];
export type Update<T extends TableName> = Database["public"]["Tables"][T]["Update"];

/** A published vehicle as the site renders it: brand + images joined. */
export type VehicleWithMedia = VehicleRow & {
  brand: Pick<BrandRow, "id" | "slug" | "name" | "logo_url"> | null;
  images: Pick<VehicleImageRow, "id" | "url" | "alt" | "sort_order">[];
};
