import { describe, expect, it } from "vitest";
import { LEGAL } from "@/content/legal";
import { DICTIONARIES } from "@/i18n/dictionaries";
import { SITE_LANGS } from "@/i18n/languages";
import { adminEn } from "@/pages/admin/i18n/en";
import { adminFr } from "@/pages/admin/i18n/fr";
import { adminRo } from "@/pages/admin/i18n/ro";

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("site dictionaries", () => {
  const source = DICTIONARIES.ro;
  for (const lang of SITE_LANGS) {
    it(`${lang}: every key present and non-empty`, () => {
      const dict = DICTIONARIES[lang];
      expect(Object.keys(dict).sort()).toEqual(Object.keys(source).sort());
      for (const [k, v] of Object.entries(dict)) expect(v.trim(), k).not.toBe("");
    });
    it(`${lang}: same {placeholders} as Romanian`, () => {
      for (const [k, v] of Object.entries(DICTIONARIES[lang])) {
        expect(placeholders(v), k).toEqual(placeholders(source[k as keyof typeof source]));
      }
    });
  }
  it("Romanian copy uses comma-below ș ț, never the cedilla look-alikes", () => {
    const all = Object.values(DICTIONARIES.ro).join(" ");
    expect(all).not.toMatch(/[şţŞŢ]/);
  });
  it("no contact detail is hard-coded in translations (single source: lib/contact.ts)", () => {
    for (const lang of SITE_LANGS) {
      const all = Object.values(DICTIONARIES[lang]).join(" ");
      expect(all).not.toMatch(/759\s?145\s?041|horizonautoexport@/);
    }
  });
});

describe("admin dictionaries", () => {
  it.each([
    ["Romanian", adminRo],
    ["French", adminFr],
  ])("%s covers every English key with the same placeholders", (_name, dict) => {
    expect(Object.keys(dict).sort()).toEqual(Object.keys(adminEn).sort());
    for (const [k, v] of Object.entries(dict)) {
      expect(v.trim(), k).not.toBe("");
      expect(placeholders(v), k).toEqual(placeholders(adminEn[k as keyof typeof adminEn]));
    }
  });
});

describe("legal documents", () => {
  it("every language has the same sections", () => {
    for (const doc of ["privacy", "terms"] as const) {
      const n = LEGAL.ro[doc].sections.length;
      for (const lang of SITE_LANGS)
        expect(LEGAL[lang][doc].sections, `${lang}/${doc}`).toHaveLength(n);
    }
  });
});
