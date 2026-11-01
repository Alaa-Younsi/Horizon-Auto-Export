import { describe, expect, it } from "vitest";
import { DEMO_VEHICLES } from "@/data/demo";
import { withLang } from "@/i18n/languages";
import { cellSafe, sanitizeSearchTerm } from "@/lib/export";
import { formatPrice, parseDay, slugify, toLocalDay } from "@/lib/format";
import { cleanLocalized, pick, pickLines } from "@/lib/localized";
import { inquirySchema } from "@/lib/schemas";
import {
  activeFilterCount,
  applyFilters,
  filtersToParams,
  parseFilters,
  relatedVehicles,
  vehicleTitle,
} from "@/lib/vehicles";
import { routeToSection } from "@/pages/admin/adminSections";
import type { VehicleWithMedia } from "@/types/db";

describe("localized fields", () => {
  it("falls back active -> ro -> any", () => {
    expect(pick({ ro: "Mașină", en: "Car" }, "fr")).toBe("Mașină");
    expect(pick({ en: "Car" }, "fr")).toBe("Car");
    expect(pick({ fr: "  " }, "fr", "x")).toBe("x");
    expect(pick(null, "ro")).toBe("");
  });
  it("splits equipment lines and strips bullets", () => {
    expect(pickLines({ ro: "- GPS\n• Cârlig\n\n  Senzori  " }, "ro")).toEqual([
      "GPS",
      "Cârlig",
      "Senzori",
    ]);
  });
  it("drops empty translations", () => {
    expect(cleanLocalized({ ro: " a ", en: "", fr: "  " })).toEqual({ ro: "a" });
  });
});

describe("format", () => {
  it("slugifies Romanian and French diacritics", () => {
    expect(slugify("Škoda Octavia Combi — ședință în București")).toBe(
      "skoda-octavia-combi-sedinta-in-bucuresti",
    );
    expect(slugify("Peugeot 308 Équipée!!")).toBe("peugeot-308-equipee");
    expect(slugify("???")).toBe("");
  });
  it("formats prices per locale with the currency", () => {
    // the ISO code, never the symbol: "EUR 23,900" / "23.900 EUR"
    expect(formatPrice(23900, "EUR", "en")).toMatch(/EUR\s?23,900/);
    expect(formatPrice(23900, "EUR", "ro")).toMatch(/23\.900\s?EUR/);
    expect(formatPrice(23900, "RON", "fr")).toMatch(/23\s?900/);
  });
  it("treats bare dates as local calendar days", () => {
    const d = parseDay("2026-10-01");
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 9, 1]);
    expect(toLocalDay(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("language routing", () => {
  it("swaps or adds the language prefix", () => {
    expect(withLang("/ro/vehicles/x", "en")).toBe("/en/vehicles/x");
    expect(withLang("/fr", "ro")).toBe("/ro");
    expect(withLang("/vehicles", "fr")).toBe("/fr/vehicles");
    expect(withLang("/romania-trip", "en")).toBe("/en/romania-trip");
  });
});

describe("vehicle filters", () => {
  const list = DEMO_VEHICLES as VehicleWithMedia[];

  it("rejects hostile URL params", () => {
    const f = parseFilters(
      new URLSearchParams(`category=hack&fuel=nuclear&sort=x&brand=a'b;drop&q=${"z".repeat(200)}`),
    );
    expect(f.category).toBeNull();
    expect(f.fuel).toBeNull();
    expect(f.sort).toBe("newest");
    expect(f.brand).toBe("abdrop");
    expect(f.q).toHaveLength(80);
  });
  it("round-trips through the URL", () => {
    const f = parseFilters(
      new URLSearchParams("category=commercial&brand=volkswagen&sort=priceAsc&sold=1"),
    );
    expect(parseFilters(filtersToParams(f))).toEqual(f);
    expect(activeFilterCount(f)).toBe(3);
  });
  it("filters by category, brand and accent-insensitive search", () => {
    const base = parseFilters(new URLSearchParams());
    expect(
      applyFilters([...list], { ...base, category: "damaged" }, "ro").map((v) => v.slug),
    ).toEqual(["demo-porsche-macan-2019-damaged"]);
    expect(applyFilters([...list], { ...base, brand: "audi" }, "ro")).toHaveLength(1);
    expect(applyFilters([...list], { ...base, q: "skoda octavia" }, "ro")).toHaveLength(1);
  });
  it("hides sold vehicles unless asked", () => {
    const sold = { ...list[0], id: "s", status: "sold" } as VehicleWithMedia;
    const base = parseFilters(new URLSearchParams());
    expect(applyFilters([sold], base, "ro")).toHaveLength(0);
    expect(applyFilters([sold], { ...base, sold: true }, "ro")).toHaveLength(1);
  });
  it("sorts price-on-request after priced vehicles in both directions", () => {
    const base = parseFilters(new URLSearchParams());
    const asc = applyFilters([...list], { ...base, sort: "priceAsc" }, "ro");
    const desc = applyFilters([...list], { ...base, sort: "priceDesc" }, "ro");
    expect(asc.at(-1)?.price).toBeNull();
    expect(desc.at(-1)?.price).toBeNull();
    expect((asc[0]?.price ?? 0) <= (asc[1]?.price ?? 0)).toBe(true);
  });
  it("finds related vehicles, never itself", () => {
    const v = list[0] as VehicleWithMedia;
    const rel = relatedVehicles(list, v);
    expect(rel.some((r) => r.id === v.id)).toBe(false);
    expect(rel.length).toBeLessThanOrEqual(3);
  });
  it("titles fall back to make + model", () => {
    expect(
      vehicleTitle(
        { title: {}, brand: { id: "b", slug: "bmw", name: "BMW", logo_url: null }, model: "X5" },
        "en",
      ),
    ).toBe("BMW X5");
  });
});

describe("exports", () => {
  it("neutralises spreadsheet formulas", () => {
    expect(cellSafe('=HYPERLINK("x")')).toBe('\'=HYPERLINK("x")');
    expect(cellSafe("+40 721")).toBe("'+40 721");
    expect(cellSafe("Andrei")).toBe("Andrei");
  });
  it("sanitises PostgREST search terms", () => {
    expect(sanitizeSearchTerm("a,b(c)%_")).toBe("a b c \\%\\_".replace("  ", " "));
  });
});

describe("inquiry schema (mirrors submit_inquiry)", () => {
  const ok = {
    kind: "availability",
    name: "Andrei Popescu",
    email: "andrei@example.ro",
    phone: "+40 721 000 000",
    message: "Caut 5 autoturisme pentru flotă.",
    consent: true,
    website: "",
  };
  it("accepts a valid inquiry", () => {
    expect(inquirySchema.safeParse(ok).success).toBe(true);
  });
  it.each([
    [{ email: "nope" }, "form.err.email"],
    [{ phone: "call me" }, "form.err.phone"],
    [{ message: "short" }, "form.err.message"],
    [{ consent: false }, "form.err.consent"],
    [{ name: "A" }, "form.err.name"],
  ])("rejects %o", (patch, key) => {
    const r = inquirySchema.safeParse({ ...ok, ...patch });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toBe(key);
  });
  it("allows an empty phone", () => {
    expect(inquirySchema.safeParse({ ...ok, phone: "" }).success).toBe(true);
  });
});

describe("admin routing", () => {
  it("maps routes to sections by longest prefix", () => {
    expect(routeToSection("/admin")?.key).toBe("dashboard");
    expect(routeToSection("/admin/vehicles/new")?.key).toBe("vehicles");
    expect(routeToSection("/admin/vehicles/abc/")?.key).toBe("vehicles");
    expect(routeToSection("/admin/nowhere")).toBeUndefined();
  });
});
