/**
 * Prebuild: writes public/robots.txt and public/sitemap.xml (every page in its
 * three languages with hreflang alternates, plus every published vehicle), on
 * the official domain unless VITE_SITE_URL overrides it.
 *
 * The sitemap is a snapshot of the stock at deploy time. (Serving it live from
 * the edge middleware was tried and crashed the middleware on Vercel — keep
 * middleware.ts self-contained, with no local imports.)
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
