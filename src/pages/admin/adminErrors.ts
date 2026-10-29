import { errorMessage } from "@/lib/rpcErrors";
import type { AdminKey } from "./i18n/en";

/**
 * Database/RPC/edge-function error -> translation key. Raw Postgres text
 * ("new row violates row-level security…") never reaches the screen.
 */
export function adminErrorKey(error: unknown, fallback: AdminKey = "saveError"): AdminKey {
  const m = errorMessage(error);
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  if (m.includes("ERR_FORBIDDEN") || code === "42501" || /row-level security/i.test(m))
    return "err.forbidden";
  if (m.includes("ERR_NOT_FOUND")) return "err.notFound";
  if (m.includes("ERR_INVALID_INPUT") || code === "23514" || code === "22P02") return "err.invalid";
  if (code === "23505") return "err.duplicate";
  if (code === "23503") return "err.inUse";
  return fallback;
}

/**
 * supabase.functions.invoke rejects with a FunctionsHttpError whose body is on
 * `.context` (a Response), not on `.message`. Read our { code } from it.
 */
export async function functionErrorKey(error: unknown): Promise<AdminKey> {
  const ctx =
    typeof error === "object" && error !== null && "context" in error
      ? (error as { context: unknown }).context
      : null;
  if (ctx instanceof Response) {
    try {
      const body: unknown = await ctx.clone().json();
      const code =
        typeof body === "object" && body !== null && "code" in body
          ? String((body as { code: unknown }).code)
          : "";
      if (code === "email_exists") return "err.emailExists";
      if (code === "weak_password") return "err.weakPassword";
      if (code === "forbidden" || code === "forbidden_target") return "err.forbidden";
      if (code === "not_found") return "err.notFound";
      if (code === "bad_request") return "err.invalid";
    } catch {
      // not JSON — fall through
    }
    if (ctx.status === 404) return "err.functionUnavailable";
  }
  if (/failed to fetch|failed to send|relay error/i.test(errorMessage(error)))
    return "err.functionUnavailable";
  return "saveError";
}
