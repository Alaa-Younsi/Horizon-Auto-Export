/**
 * Cross-file invariants that fail SILENTLY in production if they drift — so a
 * unit test fails loudly instead.
 */
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { NAV_ITEMS } from "@/components/layout/navigation";
import { BRAND_LOGOS } from "@/data/brand-logos";
import { DEMO_BRANDS } from "@/data/demo";
import { GRANTABLE_SECTIONS } from "@/pages/admin/adminSections";
import { STATIC_ROUTES } from "../../scripts/seo-routes";

const read = (p: string) => readFileSync(p, "utf8");
const migrations = readdirSync("supabase/migrations")
  .filter((f) => f.endsWith(".sql"))
  .map((f) => read(`supabase/migrations/${f}`))
  .join("\n");
const app = read("src/App.tsx");

describe("staff sections stay in sync (UI · SQL · edge function)", () => {
  const ui = GRANTABLE_SECTIONS.map((s) => s.key).sort();
  it("every grantable section is enforced by has_section() in the migrations", () => {
    const sql = [
      ...new Set([...migrations.matchAll(/has_section\('(\w+)'\)/g)].map((m) => m[1])),
    ].sort();
    expect(sql).toEqual(ui);
  });
  it("create-staff accepts exactly the grantable sections", () => {
    const fn = read("supabase/functions/create-staff/index.ts");
    const list = /ALLOWED_SECTIONS = new Set\(\[([^\]]*)\]\)/.exec(fn)?.[1] ?? "";
    const allowed = [...list.matchAll(/"(\w+)"/g)].map((m) => m[1]).sort();
    expect(allowed).toEqual(ui);
  });
});

describe("routes", () => {
  it("every nav item and sitemap route exists in the router", () => {
    const paths = [...app.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]);
    for (const r of [...NAV_ITEMS.map((n) => n.to), ...STATIC_ROUTES]) {
      const seg = r.replace(/^\//, "");
      if (seg === "") continue; // index route
      expect(paths, r).toContain(seg);
    }
  });
});

describe("content", () => {
  it("every seeded make has a drawable mark (or is a known wordmark)", () => {
    for (const b of DEMO_BRANDS) {
      expect(Boolean(BRAND_LOGOS[b.slug]) || b.slug === "cupra", b.slug).toBe(true);
    }
    for (const slug of [...migrations.matchAll(/\('([a-z-]+)', '[^']+', \d+\)/g)].map(
      (m) => m[1],
    )) {
      expect(
        DEMO_BRANDS.map((b) => b.slug),
        `seed ${slug}`,
      ).toContain(slug);
    }
  });
  it("the browser Supabase client carries no custom global headers (CORS on edge functions)", () => {
    expect(read("src/lib/supabase.ts")).not.toMatch(/global:\s*\{\s*headers/);
  });
  it("no inline <script> in index.html (the CSP allows none)", () => {
    const html = read("index.html");
    const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
    for (const [, attrs, body] of scripts) {
      const isData = /type="application\/ld\+json"/.test(attrs ?? "");
      const isModule = /src=/.test(attrs ?? "");
      expect(isData || (isModule && !(body ?? "").trim()), attrs).toBe(true);
    }
  });
  it(".env.example ships blank values only", () => {
    for (const line of read(".env.example").split(/\r?\n/)) {
      if (!line || line.startsWith("#")) continue;
      expect(line, line).toMatch(/^[A-Z_]+=$/);
    }
  });
});
