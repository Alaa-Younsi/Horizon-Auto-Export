import type { BrandRow, VehicleWithMedia } from "@/types/db";

/**
 * Compiled stand-ins used ONLY while no database is linked.
 *
 * - Brands mirror 0007_seed.sql (real content: the makes from the mock-up).
 * - Demo vehicles exist for local development and design review and are shown
 *   ONLY in `vite dev` (import.meta.env.DEV), each marked "Demo". A production
 *   build without a database shows the "we source to order" state instead —
 *   never invented stock on a live site.
 */
const t0 = "2026-10-01T09:00:00Z";

function brand(slug: string, name: string, sort: number): BrandRow {
  return {
    id: `demo-brand-${slug}`,
    slug,
    name,
    logo_url: null,
    show_on_home: true,
    active: true,
    sort_order: sort,
    created_at: t0,
    updated_at: t0,
  };
}

export const DEMO_BRANDS: BrandRow[] = [
  brand("volkswagen", "Volkswagen", 10),
  brand("audi", "Audi", 20),
  brand("skoda", "Škoda", 30),
  brand("seat", "SEAT", 40),
  brand("cupra", "CUPRA", 50),
  brand("porsche", "Porsche", 60),
  brand("bmw", "BMW", 70),
  brand("dacia", "Dacia", 80),
  brand("renault", "Renault", 90),
];

type DemoSeed = Partial<VehicleWithMedia> & Pick<VehicleWithMedia, "slug" | "title">;

function vehicle(seed: DemoSeed, brandSlug: string): VehicleWithMedia {
  const b = DEMO_BRANDS.find((x) => x.slug === brandSlug) ?? null;
  return {
    id: `demo-${seed.slug}`,
    description: {},
    equipment: {},
    damage_notes: {},
    category: "passenger",
    body_type: "sedan",
    brand_id: b?.id ?? null,
    model: null,
    year: null,
    mileage_km: null,
    fuel: null,
    transmission: null,
    drivetrain: null,
    power_hp: null,
    engine_cc: null,
    color: null,
    doors: null,
    seats: null,
    euro_norm: null,
    location: "București",
    price: null,
    currency: "EUR",
    vat_deductible: true,
    status: "available",
    featured: false,
    sort_order: 0,
    created_at: t0,
    updated_at: t0,
    images: [],
    brand: b ? { id: b.id, slug: b.slug, name: b.name, logo_url: null } : null,
    ...seed,
  };
}

export const DEMO_VEHICLES: VehicleWithMedia[] = [
  vehicle(
    {
      slug: "demo-bmw-520d-xdrive-2021",
      title: {
        ro: "BMW 520d xDrive Touring",
        en: "BMW 520d xDrive Touring",
        fr: "BMW 520d xDrive Touring",
      },
      description: {
        ro: "Exemplu demonstrativ. Break premium din flotă, istoric complet de service, un singur proprietar.",
        en: "Demo example. Premium fleet estate, full service history, one owner.",
        fr: "Exemple de démo. Break premium issu de flotte, historique d'entretien complet, un propriétaire.",
      },
      equipment: {
        ro: "Navigație Professional\nFaruri LED\nScaune încălzite\nCârlig de remorcare",
        en: "Professional navigation\nLED headlights\nHeated seats\nTow bar",
        fr: "Navigation Professional\nPhares LED\nSièges chauffants\nAttelage",
      },
      body_type: "estate",
      model: "520d xDrive",
      year: 2021,
      mileage_km: 96500,
      fuel: "diesel",
      transmission: "automatic",
      drivetrain: "awd",
      power_hp: 190,
      engine_cc: 1995,
      color: "Carbon Black",
      doors: 5,
      seats: 5,
      euro_norm: "Euro 6d",
      price: 27900,
      featured: true,
    },
    "bmw",
  ),
  vehicle(
    {
      slug: "demo-audi-a6-avant-2020",
      title: { ro: "Audi A6 Avant 40 TDI", en: "Audi A6 Avant 40 TDI", fr: "Audi A6 Avant 40 TDI" },
      body_type: "estate",
      model: "A6 Avant",
      year: 2020,
      mileage_km: 128000,
      fuel: "diesel",
      transmission: "automatic",
      drivetrain: "fwd",
      power_hp: 204,
      engine_cc: 1968,
      euro_norm: "Euro 6d",
      price: 23500,
      featured: true,
    },
    "audi",
  ),
  vehicle(
    {
      slug: "demo-skoda-octavia-combi-2022",
      title: {
        ro: "Škoda Octavia Combi Style",
        en: "Škoda Octavia Combi Style",
        fr: "Škoda Octavia Combi Style",
      },
      body_type: "estate",
      model: "Octavia Combi",
      year: 2022,
      mileage_km: 74000,
      fuel: "diesel",
      transmission: "automatic",
      power_hp: 150,
      price: 18900,
      featured: true,
    },
    "skoda",
  ),
  vehicle(
    {
      slug: "demo-vw-crafter-35-2021",
      title: {
        ro: "Volkswagen Crafter 35 L3H3",
        en: "Volkswagen Crafter 35 L3H3",
        fr: "Volkswagen Crafter 35 L3H3",
      },
      category: "commercial",
      body_type: "van",
      model: "Crafter 35",
      year: 2021,
      mileage_km: 142000,
      fuel: "diesel",
      transmission: "manual",
      power_hp: 140,
      seats: 3,
      price: 21400,
      featured: true,
    },
    "volkswagen",
  ),
  vehicle(
    {
      slug: "demo-cupra-formentor-2023",
      title: {
        ro: "CUPRA Formentor 1.5 TSI",
        en: "CUPRA Formentor 1.5 TSI",
        fr: "CUPRA Formentor 1.5 TSI",
      },
      body_type: "suv",
      model: "Formentor",
      year: 2023,
      mileage_km: 31000,
      fuel: "petrol",
      transmission: "automatic",
      power_hp: 150,
      status: "reserved",
    },
    "cupra",
  ),
  vehicle(
    {
      slug: "demo-porsche-macan-2019-damaged",
      title: {
        ro: "Porsche Macan S — avariat",
        en: "Porsche Macan S — damaged",
        fr: "Porsche Macan S — accidenté",
      },
      damage_notes: {
        ro: "Avarie frontală ușoară, airbag-uri nedeclanșate.",
        en: "Light front-end damage, airbags not deployed.",
        fr: "Choc avant léger, airbags non déclenchés.",
      },
      category: "damaged",
      body_type: "suv",
      model: "Macan S",
      year: 2019,
      mileage_km: 88000,
      fuel: "petrol",
      transmission: "automatic",
      drivetrain: "awd",
      power_hp: 354,
      price: null,
      vat_deductible: false,
    },
    "porsche",
  ),
];
