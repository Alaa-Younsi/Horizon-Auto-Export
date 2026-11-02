/**
 * Database test suite — applies EVERY migration in supabase/migrations to an
 * in-process Postgres (PGlite, WASM — no Docker, no server) and exercises the
 * security rules and the public write path as anon, staff and stranger users.
 *
 * Run: bun run test:db
 *
 * Supabase-only pieces are stubbed just enough for the migrations to apply:
 * the anon/authenticated/service_role roles, auth.users + auth.uid(), and the
 * storage.buckets/objects tables.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const MIGRATIONS = "supabase/migrations";

const SUPABASE_STUBS = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text unique);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant execute on function auth.uid() to anon, authenticated, service_role;

  create schema storage;
  grant usage on schema storage to anon, authenticated, service_role;
  create table storage.buckets (id text primary key, name text, public boolean,
    file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
`;

type Row = Record<string, unknown>;
type Role = "anon" | "authenticated" | "service_role";

const db = new PGlite();
let passed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = "") {
  if (ok) passed++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

async function as<T>(role: Role | null, uid: string | null, fn: () => Promise<T>) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ""}', false);`);
  if (role) await db.exec(`set role ${role};`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role; select set_config('request.jwt.claim.sub', '', false);");
  }
}

async function rows(sql: string, params: unknown[] = []): Promise<Row[]> {
  return (await db.query<Row>(sql, params)).rows;
}

async function errorOf(sql: string, params: unknown[] = []): Promise<string> {
  try {
    await db.query(sql, params);
    return "";
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

const OWNER = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SALES = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"; // inquiries only
const STOCK = "cccccccc-cccc-4ccc-8ccc-cccccccccccc"; // vehicles only
const STRANGER = "dddddddd-dddd-4ddd-8ddd-dddddddddddd"; // authenticated, no profile
const BRAND = "11111111-1111-4111-8111-111111111111";
const CAR_LIVE = "22222222-2222-4222-8222-222222222222";
const CAR_DRAFT = "33333333-3333-4333-8333-333333333333";

function inquiry(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    name: "Andrei Popescu",
    email: "andrei@example.ro",
    phone: "+40 721 000 000",
    message: "Bună ziua, este disponibil autoturismul?",
    kind: "availability",
    language: "ro",
    consent: true,
    elapsed_ms: 9000,
    ...overrides,
  });
}

async function submit(overrides: Record<string, unknown> = {}): Promise<string> {
  return as("anon", null, async () => {
    const r = await rows("select submit_inquiry($1::jsonb) as r", [inquiry(overrides)]);
    return String(r[0]?.r ?? "");
  });
}

async function submitError(overrides: Record<string, unknown> = {}): Promise<string> {
  return as("anon", null, () => errorOf("select submit_inquiry($1::jsonb)", [inquiry(overrides)]));
}

async function main() {
  await db.exec(SUPABASE_STUBS);

  const files = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const f of files) {
    try {
      await db.exec(readFileSync(join(MIGRATIONS, f), "utf8"));
      check(`migration ${f} applies`, true);
    } catch (e) {
      throw new Error(`migration ${f} failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  // Every migration must also be re-runnable where it says so (seed).
  for (const seed of [
    "0007_seed.sql",
    "0008_seed_dacia_renault.sql",
    "0012_seed_european_brands.sql",
  ]) {
    check(
      `seed migration ${seed} is re-runnable`,
      (await errorOf(readFileSync(join(MIGRATIONS, seed), "utf8"))) === "",
    );
  }

  // ---- fixtures (superuser) -------------------------------------------------
  await db.exec(`
    insert into auth.users (id, email) values
      ('${OWNER}', 'owner@test.ro'), ('${SALES}', 'sales@test.ro'),
      ('${STOCK}', 'stock@test.ro'), ('${STRANGER}', 'stranger@test.ro');
    insert into admin_profiles (user_id, email, is_owner, sections) values
      ('${OWNER}', 'owner@test.ro', true, '{}'),
      ('${SALES}', 'sales@test.ro', false, '{inquiries}'),
      ('${STOCK}', 'stock@test.ro', false, '{vehicles}');
    insert into brands (id, slug, name, active) values ('${BRAND}', 'test-make', 'Test Make', false);
    insert into vehicles (id, slug, title, status, brand_id, year, price) values
      ('${CAR_LIVE}', 'test-live', '{"ro":"Audi A6 Avant","en":"Audi A6 Avant"}', 'available', '${BRAND}', 2021, 23900),
      ('${CAR_DRAFT}', 'test-draft', '{"ro":"Ciornă"}', 'draft', null, 2020, 1);
    insert into vehicle_images (vehicle_id, url, sort_order) values
      ('${CAR_LIVE}', 'https://x/live.webp', 0), ('${CAR_DRAFT}', 'https://x/draft.webp', 0);
    insert into vehicle_private (vehicle_id, vin, purchase_price) values ('${CAR_LIVE}', 'WAUZZZ4G0LN000000', 18000);
  `);

  // ---- public reads ----------------------------------------------------------
  await as("anon", null, async () => {
    const brands = await rows("select slug from brands");
    check(
      "anon sees seeded brands",
      brands.some((b) => b.slug === "volkswagen"),
    );
    check("anon never sees inactive brands", !brands.some((b) => b.slug === "test-make"));
    const cars = await rows("select slug from vehicles");
    check("anon sees published vehicles only", cars.length === 1 && cars[0]?.slug === "test-live");
    const imgs = await rows("select url from vehicle_images");
    check("anon sees images of published vehicles only", imgs.length === 1);
    const priv = await rows("select * from vehicle_private");
    check("anon cannot read purchase prices / VINs", priv.length === 0);
    const inq = await rows("select * from inquiries");
    check("anon cannot read inquiries", inq.length === 0);
    const settings = await rows("select id from site_settings");
    check("anon reads site settings", settings.length === 1);
    const direct = await errorOf(
      `insert into inquiries (reference, name, email, message, consent_at) values ('X', 'a', 'a@b.co', 'hello there', now())`,
    );
    check("anon cannot insert inquiries directly", /row-level security/i.test(direct), direct);
    await db.query("update vehicles set price = 1 where slug = 'test-live'");
    await db.query("update site_settings set company_name = 'pwned'");
  });
  const after = await rows("select price from vehicles where slug = 'test-live'");
  check("anon update of a vehicle changes nothing", Number(after[0]?.price) === 23900);
  const s = await rows("select company_name from site_settings");
  check("anon update of settings changes nothing", s[0]?.company_name === null);

  // ---- submit_inquiry --------------------------------------------------------
  const ref = await submit();
  check("valid inquiry returns a reference", /^HAE-\d{6}-[0-9A-F]{10}$/.test(ref), ref);
  const saved = await rows("select * from inquiries where reference = $1", [ref]);
  check("inquiry stored as new", saved[0]?.status === "new" && saved[0]?.kind === "availability");
  check(
    "retired subjects are refused for new inquiries",
    (await submitError({ email: "old@example.ro", kind: "sourcing" })).includes(
      "ERR_INVALID_INPUT",
    ),
  );
  check("email normalised", saved[0]?.email === "andrei@example.ro");
  check("consent timestamp stored", saved[0]?.consent_at !== null);

  check(
    "too-fast submit rejected",
    (await submitError({ elapsed_ms: 300 })).includes("ERR_INVALID_INPUT: timing"),
  );
  check(
    "non-numeric timing rejected",
    (await submitError({ elapsed_ms: "9e9" })).includes("timing"),
  );
  check(
    "short name rejected",
    (await submitError({ name: "A" })).includes("ERR_INVALID_INPUT: name"),
  );
  check("bad email rejected", (await submitError({ email: "not-an-email" })).includes("email"));
  check("junk phone rejected", (await submitError({ phone: "call me maybe" })).includes("phone"));
  check("short message rejected", (await submitError({ message: "hi" })).includes("message"));
  check("unknown kind rejected", (await submitError({ kind: "hack" })).includes("kind"));
  check("missing consent rejected", (await submitError({ consent: false })).includes("consent"));
  check(
    "draft vehicle rejected",
    (await submitError({ vehicle_id: CAR_DRAFT, email: "v@x.ro" })).includes("vehicle"),
  );
  check(
    "garbage vehicle id rejected",
    (await submitError({ vehicle_id: "'; drop table x" })).includes("vehicle"),
  );

  const vref = await submit({
    vehicle_id: CAR_LIVE,
    kind: "general",
    email: "buyer@x.ro",
    language: "xx",
  });
  const v = await rows("select kind, vehicle_label, language from inquiries where reference = $1", [
    vref,
  ]);
  check("vehicle inquiry forces kind=vehicle", v[0]?.kind === "vehicle");
  check(
    "vehicle label snapshotted",
    String(v[0]?.vehicle_label).includes("Audi A6 Avant"),
    String(v[0]?.vehicle_label),
  );
  check("unknown language falls back to ro", v[0]?.language === "ro");

  await submit({ email: "rate@x.ro" });
  await submit({ email: "rate@x.ro" });
  await submit({ email: "RATE@x.ro" });
  check(
    "4th inquiry in 10 min from one address is rate-limited",
    (await submitError({ email: "rate@x.ro" })).includes("ERR_RATE_LIMIT"),
  );

  // Global burst: log-and-file-as-spam, never reject.
  await db.exec(`
    insert into inquiries (reference, name, email, message, consent_at)
    select 'BURST-' || g, 'Bot', 'bot' || g || '@x.ro', 'spam spam spam', now() from generate_series(1, 30) g;
  `);
  const burstRef = await submit({ email: "real@x.ro" });
  const burst = await rows("select status from inquiries where reference = $1", [burstRef]);
  check("burst-time inquiry is accepted but filed as spam", burst[0]?.status === "spam");
  await db.exec("delete from inquiries where reference like 'BURST-%'");

  // ---- notifications claim ---------------------------------------------------
  const claimAnon = await as("anon", null, () =>
    errorOf("select * from claim_inquiry_notification($1)", [ref]),
  );
  check("anon cannot claim notifications", /permission denied/i.test(claimAnon), claimAnon);
  const first = await as("service_role", null, () =>
    rows("select * from claim_inquiry_notification($1)", [ref]),
  );
  const second = await as("service_role", null, () =>
    rows("select * from claim_inquiry_notification($1)", [ref]),
  );
  check("service role claims once", first.length === 1 && second.length === 0);
  const spamClaim = await as("service_role", null, () =>
    rows("select * from claim_inquiry_notification($1)", [burstRef]),
  );
  check("spam inquiries are never e-mailed", spamClaim.length === 0);

  // ---- staff permissions -----------------------------------------------------
  await as("authenticated", SALES, async () => {
    const inq = await rows("select id from inquiries");
    check("sales worker reads inquiries", inq.length > 0);
    const upd = await rows(
      "update inquiries set status = 'contacted' where reference = $1 returning id",
      [ref],
    );
    check("sales worker updates inquiry status", upd.length === 1);
    const priv = await rows("select * from vehicle_private");
    check("sales worker cannot read purchase prices", priv.length === 0);
    const car = await rows("update vehicles set price = 1 where id = $1 returning id", [CAR_LIVE]);
    check("sales worker cannot edit vehicles", car.length === 0);
    const drafts = await rows("select id from vehicles where status = 'draft'");
    check("sales worker can resolve vehicle labels (incl. drafts)", drafts.length === 1);
    const stats = await rows("select get_admin_stats() as s");
    const st = stats[0]?.s as { vehicles: unknown; inquiries: { open: number }; daily: unknown[] };
    check("stats hide sections the worker lacks", st.vehicles === null && st.inquiries !== null);
    check(
      "stats daily series has every day (30)",
      Array.isArray(st.daily) && st.daily.length === 30,
    );
    const esc = await rows(
      "update admin_profiles set sections = '{vehicles,inquiries,brands,settings}' where user_id = $1 returning user_id",
      [SALES],
    );
    check("worker cannot grant themselves sections", esc.length === 0);
    const others = await rows("select user_id from admin_profiles");
    check("worker sees only their own profile", others.length === 1);
  });

  await as("authenticated", STOCK, async () => {
    const inq = await rows("select id from inquiries");
    check("stock worker cannot read inquiries", inq.length === 0);
    const car = await rows("update vehicles set price = 24500 where id = $1 returning id", [
      CAR_LIVE,
    ]);
    check("stock worker edits vehicles", car.length === 1);
    const priv = await rows("select vin from vehicle_private");
    check("stock worker reads private vehicle data", priv.length === 1);
    const brandErr = await errorOf("insert into brands (slug, name) values ('x-make', 'X')");
    check("stock worker cannot add brands", /row-level security/i.test(brandErr), brandErr);
    const settings = await rows("update site_settings set company_name = 'x' returning id");
    check("stock worker cannot edit settings", settings.length === 0);
  });

  await as("authenticated", STRANGER, async () => {
    const inq = await rows("select id from inquiries");
    check("stranger (no profile) reads no inquiries", inq.length === 0);
    const err = await errorOf("select get_admin_stats()");
    check("stranger cannot read stats", err.includes("ERR_FORBIDDEN"), err);
    const prefs = await errorOf(
      `insert into admin_notification_prefs (user_id, email_enabled) values ('${STRANGER}', true)`,
    );
    check(
      "stranger cannot create notification prefs",
      /row-level security|violates/i.test(prefs),
      prefs,
    );
  });

  await as("anon", null, async () => {
    const err = await errorOf("select get_admin_stats()");
    check("anon cannot call get_admin_stats", /permission denied/i.test(err), err);
  });

  await as("authenticated", OWNER, async () => {
    const st = await rows("select get_admin_stats() as s");
    const s0 = st[0]?.s as { vehicles: { available: number; draft: number } | null };
    check("owner sees vehicle stats", s0.vehicles?.available === 1 && s0.vehicles?.draft === 1);
    const ins = await rows(
      "insert into brands (slug, name) values ('owner-make', 'Owner Make') returning id",
    );
    check("owner manages brands", ins.length === 1);
    const set = await rows(
      "update site_settings set company_name = 'Horizon Auto Export S.R.L.' returning id",
    );
    check("owner edits settings", set.length === 1);
    const pref = await rows(
      `insert into admin_notification_prefs (user_id, email_enabled, notify_email) values ('${OWNER}', true, 'owner@test.ro') returning user_id`,
    );
    check("owner saves own notification prefs", pref.length === 1);
    const prefOther = await errorOf(
      `insert into admin_notification_prefs (user_id, email_enabled) values ('${SALES}', true)`,
    );
    check("nobody writes another account's prefs", prefOther !== "", prefOther);
  });

  // ---- constraints -----------------------------------------------------------
  check(
    "vehicle without any title is rejected",
    (await errorOf("insert into vehicles (slug, title) values ('no-title', '{}')")) !== "",
  );
  check(
    "localized fields reject unknown languages",
    (await errorOf(`insert into vehicles (slug, title) values ('bad-lang', '{"de":"Auto"}')`)) !==
      "",
  );
  check(
    "slugs must be url-safe",
    (await errorOf(`insert into vehicles (slug, title) values ('Bad Slug!', '{"ro":"x"}')`)) !== "",
  );
  check(
    "vehicle options take catalogue keys, month and accident-free",
    (await errorOf(
      `insert into vehicles (slug, title, options, registration_month, accident_free)
       values ('opt-ok', '{"ro":"x"}', '{abs,led_headlights}', 3, true)`,
    )) === "",
  );
  check(
    "vehicle options reject free text",
    (await errorOf(
      `insert into vehicles (slug, title, options) values ('opt-bad', '{"ro":"x"}', '{"Toute option"}')`,
    )) !== "",
  );
  check(
    "registration month must be 1-12",
    (await errorOf(
      `insert into vehicles (slug, title, registration_month) values ('m13', '{"ro":"x"}', 13)`,
    )) !== "",
  );
  check(
    "site settings stay a singleton",
    (await errorOf("insert into site_settings (id) values (false)")) !== "",
  );
  check(
    "settings phone must be E.164",
    (await errorOf("update site_settings set phone_e164 = '0759 145 041'")) !== "",
  );
  check(
    "deleting a vehicle keeps the inquiry (label snapshot)",
    await (async () => {
      await db.query("delete from vehicles where id = $1", [CAR_LIVE]);
      const r = await rows("select vehicle_id, vehicle_label from inquiries where reference = $1", [
        vref,
      ]);
      return r[0]?.vehicle_id === null && String(r[0]?.vehicle_label).includes("Audi");
    })(),
  );

  // ---- report ------------------------------------------------------------------
  if (failures.length) {
    process.stderr.write(
      `\n${failures.length} FAILED:\n${failures.map((f) => `  ✗ ${f}`).join("\n")}\n`,
    );
    process.stdout.write(`${passed} passed\n`);
    process.exit(1);
  }
  process.stdout.write(`✓ ${passed} database checks passed (${files.length} migrations)\n`);
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.stack : String(e)}\n`);
  process.exit(1);
});
