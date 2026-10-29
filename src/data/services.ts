import { CarFront, Globe2, Handshake, type LucideIcon, ShieldCheck, Van } from "lucide-react";
import type { TranslationKey } from "@/i18n/dictionaries";

export interface Service {
  /** Anchor on /services (#passenger …) and the stable key in every list. */
  id: "passenger" | "commercial" | "damaged" | "b2b" | "export";
  icon: LucideIcon;
  title: TranslationKey;
  short: TranslationKey;
  long: TranslationKey;
  bullets: [TranslationKey, TranslationKey, TranslationKey];
}

/** The five services, in the mock-up's order. */
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
  {
    id: "damaged",
    icon: ShieldCheck,
    title: "svc.damaged.title",
    short: "svc.damaged.short",
    long: "svc.damaged.long",
    bullets: ["svc.damaged.b1", "svc.damaged.b2", "svc.damaged.b3"],
  },
  {
    id: "b2b",
    icon: Handshake,
    title: "svc.b2b.title",
    short: "svc.b2b.short",
    long: "svc.b2b.long",
    bullets: ["svc.b2b.b1", "svc.b2b.b2", "svc.b2b.b3"],
  },
  {
    id: "export",
    icon: Globe2,
    title: "svc.export.title",
    short: "svc.export.short",
    long: "svc.export.long",
    bullets: ["svc.export.b1", "svc.export.b2", "svc.export.b3"],
  },
];
