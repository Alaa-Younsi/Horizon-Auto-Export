const PLACEHOLDER_SITE_URL = "https://PLACEHOLDER-DOMAIN.tld";

export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

/** False until the client links the database: the site then runs on compiled demo content. */
export const isSupabaseConfigured = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

export const SITE_URL = (import.meta.env.VITE_SITE_URL || PLACEHOLDER_SITE_URL).replace(/\/+$/, "");
