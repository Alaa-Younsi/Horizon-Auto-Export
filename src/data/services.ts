import { CarFront, type LucideIcon, Van } from "lucide-react";
import type { TranslationKey } from "@/i18n/dictionaries";

export interface Service {
  /** Anchor on /services (#passenger …) and the stable key in every list. */
  id: "passenger" | "commercial";
  icon: LucideIcon;
  title: TranslationKey;
  short: TranslationKey;
  long: TranslationKey;
  bullets: [TranslationKey, TranslationKey, TranslationKey];
}

/** What the company offers: passenger cars and commercial vehicles. */
export const SERVICES: Service[] = [
  {
    id: "passenger",
    icon: CarFront,
    title: "svc.passenger.title",
    short: "svc.passenger.short",
    long: "svc.passenger.long",
    bullets: ["svc.passenger.b1", "svc.passenger.b2", "svc.passenger.b3"],
  },
  {
    id: "commercial",
    icon: Van,
    title: "svc.commercial.title",
    short: "svc.commercial.short",
    long: "svc.commercial.long",
    bullets: ["svc.commercial.b1", "svc.commercial.b2", "svc.commercial.b3"],
  },
];
