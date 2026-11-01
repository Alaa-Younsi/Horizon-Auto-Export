import { CarFront, FileCheck2, Handshake, type LucideIcon, Truck, Van } from "lucide-react";
import type { TranslationKey } from "@/i18n/dictionaries";
import type { InquiryKind } from "@/types/db";

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

export interface PageService {
  /** Anchor on /services (#sale …). */
  id: "sale" | "advice" | "delivery" | "paperwork";
  icon: LucideIcon;
  title: TranslationKey;
  text: TranslationKey;
  /** Subject pre-selected in the contact form when the visitor asks about it. */
  kind: InquiryKind;
  /** Also offer a link to the stock. */
  stock?: boolean;
}

/** The services page, in the client's words and order (Nov 2026). */
export const PAGE_SERVICES: PageService[] = [
  {
    id: "sale",
    icon: CarFront,
    title: "svcPage.sale.title",
    text: "svcPage.sale.text",
    kind: "vehicle",
    stock: true,
  },
  {
    id: "advice",
    icon: Handshake,
    title: "svcPage.advice.title",
    text: "svcPage.advice.text",
    kind: "general",
  },
  {
    id: "delivery",
    icon: Truck,
    title: "svcPage.delivery.title",
    text: "svcPage.delivery.text",
    kind: "delivery",
  },
  {
    id: "paperwork",
    icon: FileCheck2,
    title: "svcPage.paperwork.title",
    text: "svcPage.paperwork.text",
    kind: "general",
  },
];
