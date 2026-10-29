/**
 * A tiny in-test Supabase: answers every request the app makes to
 * https://e2emock.supabase.co from fixtures, records writes, and can seed a
 * signed-in session the way supabase-js stores it. Lets the public site and the
 * whole dashboard be exercised without a database.
 */
import type { Page, Route } from "@playwright/test";

export const MOCK_URL = "https://e2emock.supabase.co";
const OWNER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const NOW = new Date().toISOString();

type Row = Record<string, unknown>;

export interface MockOptions {
  profile?: { is_owner: boolean; sections: string[]; active: boolean };
}

const BRAND_AUDI = { id: "b-audi", slug: "audi", name: "Audi", logo_url: null };
const BRAND_VW = { id: "b-vw", slug: "volkswagen", name: "Volkswagen", logo_url: null };

function vehicle(over: Row): Row {
  return {
    description: { ro: "Vehicul de test.", en: "Test vehicle." },
    equipment: { ro: "GPS\nSenzori parcare", en: "Navigation\nParking sensors" },
    damage_notes: {},
    category: "passenger",
    body_type: "estate",
    brand_id: "b-audi",
    model: "A6",
    year: 2021,
    mileage_km: 98000,
    fuel: "diesel",
    transmission: "automatic",
    drivetrain: null,
    power_hp: 204,
    engine_cc: 1968,
    color: null,
    doors: 5,
    seats: 5,
    euro_norm: "Euro 6d",
    location: "București",
    price: 23900,
    currency: "EUR",
    vat_deductible: true,
    status: "available",
    featured: true,
    sort_order: 0,
    created_at: NOW,
    updated_at: NOW,
    brand: BRAND_AUDI,
    images: [],
    ...over,
  };
}

function fixtures(opts: MockOptions): Record<string, Row[]> {
  const profile = opts.profile ?? { is_owner: true, sections: [], active: true };
  return {
    admin_profiles: [
      {
        user_id: OWNER_ID,
        email: "owner@test.ro",
        full_name: "Owner",
        created_at: NOW,
        ...profile,
      },
      ...(profile.is_owner
        ? [
            {
              user_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
              email: "sales@test.ro",
              full_name: "Sales",
              is_owner: false,
              sections: ["inquiries"],
              active: true,
              created_at: NOW,
            },
          ]
        : []),
    ],
    brands: [
      {
        ...BRAND_AUDI,
        show_on_home: true,
        active: true,
        sort_order: 10,
        created_at: NOW,
        updated_at: NOW,
      },
      {
        ...BRAND_VW,
        show_on_home: true,
        active: true,
        sort_order: 20,
        created_at: NOW,
        updated_at: NOW,
      },
    ],
    vehicles: [
      vehicle({
        id: "v-a6",
        slug: "audi-a6-avant-2021",
        title: { ro: "Audi A6 Avant", en: "Audi A6 Avant", fr: "Audi A6 Avant" },
      }),
      vehicle({
        id: "v-crafter",
        slug: "vw-crafter-2020",
        title: { ro: "Volkswagen Crafter", en: "Volkswagen Crafter" },
        category: "commercial",
        body_type: "van",
        brand_id: "b-vw",
        brand: BRAND_VW,
        model: "Crafter",
        year: 2020,
        transmission: "manual",
        price: 19500,
        featured: true,
      }),
      vehicle({
        id: "v-golf",
        slug: "vw-golf-damaged",
        title: { ro: "Volkswagen Golf — avariat", en: "Volkswagen Golf — damaged" },
        category: "damaged",
        body_type: "hatchback",
        brand_id: "b-vw",
        brand: BRAND_VW,
        price: null,
        featured: false,
        damage_notes: { ro: "Lovitură față.", en: "Front impact." },
      }),
    ],
    vehicle_private: [
      {
        vehicle_id: "v-a6",
        vin: "WAUZZZ",
        purchase_price: 19000,
        purchase_currency: "EUR",
        supplier: null,
        internal_notes: null,
        updated_at: NOW,
      },
    ],
    vehicle_images: [],
    inquiries: [
      {
        id: "i-1",
        reference: "HAE-261029-ABCDEF1234",
        kind: "sourcing",
        vehicle_id: null,
        vehicle_label: null,
        name: "Andrei Popescu",
        company: "Fleet SRL",
        email: "andrei@example.ro",
        phone: "+40721000000",
        country: "România",
        message: "Caut 5 autoturisme pentru flotă.",
        language: "ro",
        consent_at: NOW,
        status: "new",
        admin_notes: null,
        notified_at: null,
        created_at: NOW,
        updated_at: NOW,
      },
    ],
    admin_notification_prefs: [],
    site_settings: [
      {
        id: true,
        company_name: null,
        phone_display: null,
        phone_e164: null,
        whatsapp_e164: null,
        email: null,
        address: null,
        hours: null,
        vat_id: null,
        trade_register: null,
        map_url: null,
        hero_image_url: null,
        about_image_url: null,
        socials: {},
        updated_at: NOW,
      },
    ],
  };
}

const STATS = {
  vehicles: { available: 2, reserved: 0, sold: 0, draft: 1, sold_30d: 0 },
  inquiries: { new: 1, open: 1, last_30d: 1, won_30d: 0, spam: 0 },
  daily: Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return { day: d.toISOString().slice(0, 10), count: (i * 7) % 4 };
  }),
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Expose-Headers": "content-range",
};

export interface MockHandle {
  writes: Array<{ method: string; table: string; body: unknown }>;
}

export async function mockSupabase(
  page: Page,
  opts: MockOptions = {},
  signedIn = true,
): Promise<MockHandle> {
  const data = fixtures(opts);
  const handle: MockHandle = { writes: [] };

  if (signedIn) {
    await page.addInitScript(
      ([key, userId]) => {
        const exp = Math.floor(Date.now() / 1000) + 3600 * 24 * 365;
        localStorage.setItem(
          key,
          JSON.stringify({
            access_token: "e2e.access.token",
            token_type: "bearer",
            expires_in: 3600 * 24 * 365,
            expires_at: exp,
            refresh_token: "e2e-refresh",
            user: {
              id: userId,
              aud: "authenticated",
              role: "authenticated",
              email: "owner@test.ro",
              app_metadata: {},
              user_metadata: {},
            },
          }),
        );
      },
      ["sb-e2emock-auth-token", OWNER_ID] as const,
    );
  }

  // Pattern must be *supabase.co/* — never "*supabase*", which would also catch
  // Vite's own /src/lib/supabase.ts module request and blank the app.
  await page.route(`${MOCK_URL}/**`, async (route: Route) => {
    const req = route.request();
    const url = new URL(req.url());
    const json = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        headers: { ...CORS, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });

    if (url.pathname.startsWith("/auth/v1/")) {
      if (url.pathname.endsWith("/logout")) return route.fulfill({ status: 204, headers: CORS });
      return json({ id: OWNER_ID, email: "owner@test.ro", aud: "authenticated" });
    }
    if (url.pathname.startsWith("/functions/v1/")) return json({ ok: true });
    if (url.pathname.startsWith("/storage/v1/")) return json({ Key: "media/x.webp" });

    if (url.pathname === "/rest/v1/rpc/get_admin_stats") {
      const me = data.admin_profiles?.[0];
      const has = (s: string) =>
        Boolean(me?.is_owner) || ((me?.sections as string[] | undefined) ?? []).includes(s);
      return json({
        vehicles: has("vehicles") ? STATS.vehicles : null,
        inquiries: has("inquiries") ? STATS.inquiries : null,
        daily: has("inquiries") ? STATS.daily : null,
      });
    }
    if (url.pathname === "/rest/v1/rpc/submit_inquiry") {
      handle.writes.push({
        method: "RPC",
        table: "submit_inquiry",
        body: req.postDataJSON?.() ?? null,
      });
      return json("HAE-261029-0123456789");
    }
    if (url.pathname.startsWith("/rest/v1/rpc/")) return json(null);

    const table = url.pathname.replace("/rest/v1/", "");
    if (req.method() !== "GET") {
      handle.writes.push({ method: req.method(), table, body: req.postDataJSON?.() ?? null });
      const body = req.postDataJSON?.();
      const rows = Array.isArray(body) ? body : body ? [{ id: "new-id", ...body }] : [];
      const wantsObject = (req.headers().accept ?? "").includes("vnd.pgrst.object");
      if (wantsObject) return json(rows[0] ?? {}, req.method() === "POST" ? 201 : 200);
      return json(rows, req.method() === "POST" ? 201 : 200);
    }

    let rows = data[table] ?? [];
    for (const [k, v] of url.searchParams) {
      if (v.startsWith("eq.")) rows = rows.filter((r) => String(r[k]) === v.slice(3));
      if (v.startsWith("neq.")) rows = rows.filter((r) => String(r[k]) !== v.slice(4));
    }
    const wantsObject = (req.headers().accept ?? "").includes("vnd.pgrst.object");
    if (wantsObject)
      return rows[0] ? json(rows[0]) : json({ code: "PGRST116", message: "0 rows" }, 406);
    return route.fulfill({
      status: 200,
      headers: {
        ...CORS,
        "Content-Type": "application/json",
        "Content-Range": `0-${Math.max(0, rows.length - 1)}/${rows.length}`,
      },
      body: JSON.stringify(rows),
    });
  });
  return handle;
}
