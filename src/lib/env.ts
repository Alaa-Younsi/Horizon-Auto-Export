/** The official domain; VITE_SITE_URL overrides it (e.g. for a staging copy). */
const DEFAULT_SITE_URL = "https://horizonautoexport.com";

/** A value still holding the `<...>` placeholder from .env.local counts as unset. */
function filled(v: string | undefined): string {
  const s = (v ?? "").trim();
  return s.includes("<") ? "" : s;
}

export const SUPABASE_URL = filled(import.meta.env.VITE_SUPABASE_URL);
export const SUPABASE_ANON_KEY = filled(import.meta.env.VITE_SUPABASE_ANON_KEY);

/** False until the client links the database: the site then runs on compiled demo content. */
export const isSupabaseConfigured = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

export const SITE_URL = (filled(import.meta.env.VITE_SITE_URL) || DEFAULT_SITE_URL).replace(
  /\/+$/,
  "",
);
