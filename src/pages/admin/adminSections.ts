import {
  CarFront,
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  Settings,
  ShieldCheck,
  Tags,
  UserRound,
} from "lucide-react";
import type { AdminKey } from "./i18n/en";

export interface AdminSection {
  /** MUST equal the has_section('…') string in supabase/migrations/0003_rls.sql. */
  key: string;
  route: string;
  labelKey: AdminKey;
  icon: LucideIcon;
  /** Visible to every active admin (no grant needed). */
  always?: boolean;
  /** Only the owner (the Team page itself). */
  ownerOnly?: boolean;
}

/**
 * KEEP IN SYNC (a mismatch fails silently — granted in the UI, dropped on save):
 *   this list · has_section('…') in 0003_rls.sql / 0004_functions.sql
 *   · ALLOWED_SECTIONS in supabase/functions/create-staff/index.ts
 */
export const ADMIN_SECTIONS: AdminSection[] = [
  {
    key: "dashboard",
    route: "/admin",
    labelKey: "nav.dashboard",
    icon: LayoutDashboard,
    always: true,
  },
  { key: "inquiries", route: "/admin/inquiries", labelKey: "nav.inquiries", icon: Inbox },
  { key: "vehicles", route: "/admin/vehicles", labelKey: "nav.vehicles", icon: CarFront },
  { key: "brands", route: "/admin/brands", labelKey: "nav.brands", icon: Tags },
  { key: "settings", route: "/admin/settings", labelKey: "nav.settings", icon: Settings },
  { key: "team", route: "/admin/team", labelKey: "nav.team", icon: ShieldCheck, ownerOnly: true },
  {
    key: "account",
    route: "/admin/account",
    labelKey: "nav.account",
    icon: UserRound,
    always: true,
  },
];

export const GRANTABLE_SECTIONS = ADMIN_SECTIONS.filter((s) => !s.always && !s.ownerOnly);

/** Exact "/admin" first, then the LONGEST matching prefix (so /admin/vehicles/x -> vehicles). */
export function routeToSection(pathname: string): AdminSection | undefined {
  const clean = pathname.replace(/\/+$/, "") || "/admin";
  if (clean === "/admin") return ADMIN_SECTIONS[0];
  return ADMIN_SECTIONS.filter(
    (s) => s.route !== "/admin" && (clean === s.route || clean.startsWith(`${s.route}/`)),
  ).sort((a, b) => b.route.length - a.route.length)[0];
}
