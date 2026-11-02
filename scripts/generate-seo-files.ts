/**
 * Prebuild: writes public/robots.txt and a fallback public/sitemap.xml.
 *
 * The live /sitemap.xml is served by the edge middleware (middleware.ts) from
 * the database at request time, so new vehicles reach Google without a
 * redeploy; this static copy is only what a crawler gets if that ever fails.
 * Every page exists in three languages (/ro, /en, /fr), each URL with its
 * hreflang alternates (scripts/sitemap-xml.ts).
 *
 * Run: bun run seo  (automatically part of `bun run build`). Bun loads .env itself.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { STATIC_ROUTES } from "./seo-routes";
import { buildSitemap, fetchVehicleSlugs } from "./sitemap-xml";

/** The official domain; VITE_SITE_URL overrides it (e.g. for a staging copy). */
const DEFAULT_SITE = "https://horizonautoexport.com";
/** A value still holding the .env.local "<...>" placeholder counts as unset. */
const filled = (v: string | undefined) => (v?.includes("<") ? "" : (v ?? ""));
const SITE = (filled(process.env.VITE_SITE_URL) || DEFAULT_SITE).replace(/\/+$/, "");
const SUPABASE_URL = filled(process.env.VITE_SUPABASE_URL).replace(/\/+$/, "");
const ANON = filled(process.env.VITE_SUPABASE_ANON_KEY);

const vehicles = await fetchVehicleSlugs(SUPABASE_URL, ANON);
if (vehicles === null) process.stdout.write("[seo] database unreachable — static routes only\n");

const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/

Sitemap: ${SITE}/sitemap.xml
`;

mkdirSync("public", { recursive: true });
writeFileSync("public/sitemap.xml", buildSitemap(SITE, vehicles ?? []));
writeFileSync("public/robots.txt", robots);
process.stdout.write(
  `[seo] ${SITE} — sitemap: ${STATIC_ROUTES.length} static routes + ${vehicles?.length ?? 0} vehicles × 3 languages\n`,
);
