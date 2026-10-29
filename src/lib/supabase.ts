import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

export type Supabase = SupabaseClient<Database>;

/**
 * NULL until VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set. Every data hook
 * checks this first and falls back to compiled demo content, so the site never
 * fires a request at a database that doesn't exist yet.
 *
 * No `global.headers` here, ever: supabase-js forwards them to functions.invoke,
 * the edge functions' CORS allow-list doesn't list them, and the browser then
 * drops the request silently (dz-cod-store bug ledger #10).
 */
export const supabase: Supabase | null = isSupabaseConfigured
  ? createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null;

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super("ERR_NOT_CONFIGURED");
    this.name = "SupabaseNotConfiguredError";
  }
}

export function requireSupabase(): Supabase {
  if (!supabase) throw new SupabaseNotConfiguredError();
  return supabase;
}
