/**
 * Vercel Edge Middleware — link previews for shared vehicle URLs.
 *
 * WhatsApp, Facebook, LinkedIn, Telegram… do not run JavaScript, so on this SPA
 * every shared /ro/vehicles/<slug> link would preview as the generic homepage
 * card. For crawler user-agents only, this fetches the vehicle from Supabase
 * (anon key, RLS: published vehicles only) and returns a tiny HTML document with
 * its real title, photo and price. Everyone else — and any failure — falls
 * through untouched: a crawler is never worth a 500.
 *
 * Needs VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (+ VITE_SITE_URL) set in the
 * Vercel project env; without them it silently degrades to the generic card.
 * Verify after deploy:
 *   curl -A "facebookexternalhit/1.1" https://<domain>/ro/vehicles/<slug>
 */
import { next } from "@vercel/edge";
import { buildSitemap, fetchVehicleSlugs } from "./scripts/sitemap-xml";

export const config = { matcher: ["/sitemap.xml", "/:lang(ro|en|fr)/vehicles/:slug*"] };

/** The official domain; VITE_SITE_URL overrides it. A "<...>" placeholder counts as unset. */
const DEFAULT_SITE = "https://horizonautoexport.com";
const env = (k: string) => {
  const v = (process.env[k] ?? "").trim();
  return v.includes("<") ? "" : v.replace(/\/+$/, "");
};

// Social link-preview scrapers only. Search engines (Googlebot, Bingbot) run JS
// and get the real page — serving them something else would edge toward cloaking.
const CRAWLERS =
  /facebookexternalhit|facebot|whatsapp|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|pinterest|skypeuripreview|vkshare|redditbot|embedly|quora link preview|outbrain|viber/i;

type Lang = "ro" | "en" | "fr";
type Localized = Partial<Record<Lang, string>>;

interface VehiclePreview {
  slug: string;
  title: Localized;
  description: Localized;
  year: number | null;
  mileage_km: number | null;
  price: number | string | null;
  currency: string;
  status: string;
  brand: { name: string } | null;
  images: Array<{ url: string; sort_order: number }> | null;
}

const LOCALE: Record<Lang, string> = { ro: "ro_RO", en: "en_GB", fr: "fr_FR" };
const ON_REQUEST: Record<Lang, string> = {
  ro: "Preț la cerere",
  en: "Price on request",
  fr: "Prix sur demande",
};

function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}

function pick(v: Localized | null | undefined, lang: Lang): string {
  return (v?.[lang] || v?.ro || v?.en || v?.fr || "").trim();
}

/**
 * /sitemap.xml, live from the database: a vehicle published in the admin is in
 * the sitemap within the hour, no redeploy. If the database can't be reached,
 * fall through to the static copy written at build time.
 */
async function sitemap(): Promise<Response> {
  const vehicles = await fetchVehicleSlugs(env("VITE_SUPABASE_URL"), env("VITE_SUPABASE_ANON_KEY"));
  if (vehicles === null) return next();
  return new Response(buildSitemap(env("VITE_SITE_URL") || DEFAULT_SITE, vehicles), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export default async function middleware(request: Request): Promise<Response> {
  if (new URL(request.url).pathname === "/sitemap.xml") return sitemap();

  const ua = request.headers.get("user-agent") ?? "";
  if (!CRAWLERS.test(ua)) return next();

  const supabaseUrl = env("VITE_SUPABASE_URL");
  const anonKey = env("VITE_SUPABASE_ANON_KEY");
  const siteUrl = env("VITE_SITE_URL") || DEFAULT_SITE;
  if (!supabaseUrl || !anonKey) return next();

  const url = new URL(request.url);
  const m = /^\/(ro|en|fr)\/vehicles\/([a-z0-9-]{1,120})\/?$/.exec(url.pathname);
  if (!m) return next();
  const lang = m[1] as Lang;
  const slug = m[2] ?? "";

  try {
    const api = new URL(`${supabaseUrl}/rest/v1/vehicles`);
    api.searchParams.set(
      "select",
      "slug,title,description,year,mileage_km,price,currency,status,brand:brands(name),images:vehicle_images(url,sort_order)",
    );
    api.searchParams.set("slug", `eq.${slug}`);
    api.searchParams.set("status", "neq.draft");
    api.searchParams.set("limit", "1");
    const res = await fetch(api, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    });
    if (!res.ok) return next();
    const rows = (await res.json()) as VehiclePreview[];
    const v = rows[0];
    if (!v) return next();

    const name = pick(v.title, lang) || [v.brand?.name, v.year].filter(Boolean).join(" ");
    const price =
      v.price === null
        ? ON_REQUEST[lang]
        : new Intl.NumberFormat(LOCALE[lang].replace("_", "-"), {
            style: "currency",
            currency: v.currency,
            maximumFractionDigits: 0,
          }).format(Number(v.price));
    const facts = [
      v.year,
      v.mileage_km !== null ? `${v.mileage_km.toLocaleString("ro-RO")} km` : null,
      price,
    ]
      .filter(Boolean)
      .join(" · ");
    const description = (pick(v.description, lang) || facts).slice(0, 200);
    const title = `${name}${v.year ? ` (${v.year})` : ""} | Horizon Auto Export`;
    const cover =
      [...(v.images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ??
      `${siteUrl}/og-image.jpg`;
    const pageUrl = `${siteUrl}/${lang}/vehicles/${v.slug}`;

    const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(pageUrl)}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Horizon Auto Export">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(`${facts} — ${description}`.slice(0, 280))}">
<meta property="og:url" content="${esc(pageUrl)}">
<meta property="og:image" content="${esc(cover)}">
<meta property="og:locale" content="${LOCALE[lang]}">
${v.price !== null ? `<meta property="product:price:amount" content="${esc(String(v.price))}"><meta property="product:price:currency" content="${esc(v.currency)}">` : ""}
<meta property="product:availability" content="${v.status === "sold" ? "out of stock" : "in stock"}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(cover)}">
</head><body><h1>${esc(name)}</h1><p>${esc(facts)}</p><p>${esc(description)}</p><a href="${esc(pageUrl)}">${esc(pageUrl)}</a></body></html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return next();
  }
}
