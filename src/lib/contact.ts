import type { SiteSettingsRow } from "@/types/db";

/**
 * The company's contact details — the ONLY place they are typed. Footer, header,
 * contact page, JSON-LD and the vehicle page all read them through
 * useSiteSettings(), which overlays whatever the admin saved in site_settings
 * (blank columns keep these values). Never run them through i18n: a phone
 * number is the same in every language, and a translated copy is one that drifts.
 *
 * Source: the client's approved mock-up (Oct 2026); street address Nov 2026.
 */
export const CONTACT_FALLBACK: SiteSettingsRow = {
  id: true,
  company_name: "Horizon Auto Export S.R.L.",
  phone_display: "+40 759 145 041",
  // E.164, so a tap on a phone actually dials.
  phone_e164: "+40759145041",
  whatsapp_e164: "+40759145041",
  email: "horizonautoexport@gmail.com",
  address: {
    ro: "Str. Ilioara, Nr. 54, Sectorul 3, București",
    en: "Str. Ilioara, Nr. 54, Sector 3, Bucharest, Romania",
    fr: "Str. Ilioara, Nr. 54, Secteur 3, Bucarest, Roumanie",
  },
  hours: {
    ro: "Luni – Vineri: 09:00 – 18:00",
    en: "Monday – Friday: 09:00 – 18:00",
    fr: "Lundi – vendredi : 09h00 – 18h00",
  },
  vat_id: "RO55177825",
  trade_register: null,
  map_url:
    "https://www.google.com/maps/search/?api=1&query=Strada%20Ilioara%2054%2C%20Sector%203%2C%20Bucure%C8%99ti",
  hero_image_url: null,
  about_image_url: null,
  socials: {},
  updated_at: "",
};

/**
 * The Romanian company ID (CUI). For a VAT-registered company it is the VAT
 * number without the "RO" prefix (RO55177825 -> 55177825), so it is derived
 * rather than typed twice.
 */
export function cuiOf(vatId: string | null | undefined): string | null {
  const digits = vatId?.trim().replace(/^RO\s*/i, "") ?? "";
  return /^[0-9]{2,10}$/.test(digits) ? digits : null;
}

export function telHref(e164: string | null | undefined): string | undefined {
  return e164 ? `tel:${e164}` : undefined;
}

export function mailHref(email: string | null | undefined, subject?: string): string | undefined {
  if (!email) return undefined;
  return subject ? `mailto:${email}?subject=${encodeURIComponent(subject)}` : `mailto:${email}`;
}

export function whatsappHref(e164: string | null | undefined, text?: string): string | undefined {
  if (!e164) return undefined;
  const digits = e164.replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
