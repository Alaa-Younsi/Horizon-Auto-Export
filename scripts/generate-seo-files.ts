/**
 * Prebuild: writes public/sitemap.xml and public/robots.txt from the env, so the
 * production domain lives in exactly one place (VITE_SITE_URL) and the sitemap
 * always lists the current vehicles.
 *
 * Every page exists in three languages (/ro, /en, /fr): each URL is emitted with
 * its hreflang alternates. Vehicle pages come from Supabase when the env is set;
 * without a database the sitemap still lists every static route.
 *
 * Run: bun run seo  (automatically part of `bun run build`). Bun loads .env itself.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { SEO_LANGS, STATIC_ROUTES } from "./seo-routes";

const PLACEHOLDER = "https://PLACEHOLDER-DOMAIN.tld";
const SITE = (process.env.VITE_SITE_URL || PLACEHOLDER).replace(/\/+$/, "");
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL ?? "").replace(/\/+$/, "");
const ANON = process.env.VITE_SUPABASE_ANON_KEY ?? "";
const LANGS = SEO_LANGS;

async function vehicleSlugs(): Promise<Array<{ slug: string; updated_at: string }>> {
  if (!SUPABASE_URL || !ANON) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/vehicles?select=slug,updated_at&status=neq.draft&order=updated_at.desc&limit=1000`,
      { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } },
    );
    if (!res.ok) {
      process.stdout.write(`[seo] vehicles fetch failed (${res.status}) — static routes only\n`);
      return [];
    }
    return (await res.json()) as Array<{ slug: string; updated_at: string }>;
  } catch {
    process.stdout.write("[seo] database unreachable — static routes only\n");
    return [];
  }
}

function entry(path: string, lastmod?: string): string {
  const alternates = [
    ...LANGS.map(
      (l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE}/${l}${path}"/>`,
    ),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/ro${path}"/>`,
  ].join("\n");
  return LANGS.map(
    (l) =>
      `  <url>\n    <loc>${SITE}/${l}${path}</loc>${lastmod ? `\n    <lastmod>${lastmod.slice(0, 10)}</lastmod>` : ""}\n${alternates}\n  </url>`,
  ).join("\n");
}

const vehicles = await vehicleSlugs();
const urls = [
  ...STATIC_ROUTES.map((r) => entry(r)),
  ...vehicles.map((v) => entry(`/vehicles/${encodeURIComponent(v.slug)}`, v.updated_at)),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`;

const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/

Sitemap: ${SITE}/sitemap.xml
`;

mkdirSync("public", { recursive: true });
writeFileSync("public/sitemap.xml", sitemap);
writeFileSync("public/robots.txt", robots);
if (SITE === PLACEHOLDER)
  process.stdout.write("[seo] WARNING: VITE_SITE_URL is not set — using the placeholder domain\n");
process.stdout.write(
  `[seo] sitemap: ${STATIC_ROUTES.length} static routes + ${vehicles.length} vehicles × ${LANGS.length} languages\n`,
);
