import { SEO_LANGS, STATIC_ROUTES } from "./seo-routes";

/** The sitemap: every page in its three languages, each with its hreflang alternates. */
export function buildSitemap(
  site: string,
  vehicles: ReadonlyArray<{ slug: string; updated_at: string }>,
): string {
  const entry = (path: string, lastmod?: string) => {
    const alternates = [
      ...SEO_LANGS.map(
        (l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${site}/${l}${path}"/>`,
      ),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${site}/ro${path}"/>`,
    ].join("\n");
    return SEO_LANGS.map(
      (l) =>
        `  <url>\n    <loc>${site}/${l}${path}</loc>${lastmod ? `\n    <lastmod>${lastmod.slice(0, 10)}</lastmod>` : ""}\n${alternates}\n  </url>`,
    ).join("\n");
  };
  const urls = [
    ...STATIC_ROUTES.map((r) => entry(r)),
    ...vehicles.map((v) => entry(`/vehicles/${encodeURIComponent(v.slug)}`, v.updated_at)),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`;
}

/** Published (non-draft) vehicles, newest first; null when the database is unreachable. */
export async function fetchVehicleSlugs(
  supabaseUrl: string,
  anonKey: string,
): Promise<Array<{ slug: string; updated_at: string }> | null> {
  if (!supabaseUrl || !anonKey) return null;
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/vehicles?select=slug,updated_at&status=neq.draft&order=updated_at.desc&limit=1000`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } },
    );
    if (!res.ok) return null;
    return (await res.json()) as Array<{ slug: string; updated_at: string }>;
  } catch {
    return null;
  }
}
