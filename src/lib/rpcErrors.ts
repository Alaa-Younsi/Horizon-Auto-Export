import type { TranslationKey } from "@/i18n/dictionaries";

/**
 * RPCs raise stable ERR_* codes; map them to a translation key and never show
 * the raw Postgres message (it can leak schema details and isn't translated).
 */
export function publicErrorKey(error: unknown): TranslationKey {
  const message = errorMessage(error);
  if (message.includes("ERR_NOT_CONFIGURED")) return "error.notConfigured";
  if (message.includes("ERR_RATE_LIMIT")) return "error.rateLimit";
  if (message.includes("ERR_INVALID_INPUT: timing")) return "error.tooFast";
  if (message.includes("ERR_INVALID_INPUT: email")) return "form.err.email";
  if (message.includes("ERR_INVALID_INPUT: phone")) return "form.err.phone";
  if (message.includes("ERR_INVALID_INPUT: message")) return "form.err.message";
  if (message.includes("ERR_INVALID_INPUT: consent")) return "form.err.consent";
  if (message.includes("ERR_INVALID_INPUT")) return "error.invalidInput";
  if (/failed to fetch|networkerror|load failed/i.test(message)) return "error.network";
  return "error.generic";
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const m = (error as { message: unknown }).message;
    if (typeof m === "string") return m;
  }
  return String(error);
}
