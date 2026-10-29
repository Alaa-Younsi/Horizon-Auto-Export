import { z } from "zod";
import type { TranslationKey } from "@/i18n/dictionaries";
import { INQUIRY_KINDS } from "@/types/db";

// Zod 4 probes `new Function()` for its JIT; the CSP has no 'unsafe-eval', so the
// probe would log a violation on every page. Jitless mode skips it.
z.config({ jitless: true });

const msg = (key: TranslationKey) => ({ message: key });

/**
 * Mirrors submit_inquiry()'s server-side rules (0004_functions.sql) so visitors
 * get instant, translated feedback — the RPC remains the real boundary.
 * Error messages are translation KEYS; the form renders them through t().
 */
export const inquirySchema = z.object({
  kind: z.enum(INQUIRY_KINDS),
  name: z.string().trim().min(2, msg("form.err.name")).max(100, msg("form.err.tooLong")),
  company: z.string().trim().max(120, msg("form.err.tooLong")),
  email: z
    .string()
    .trim()
    .min(1, msg("form.err.required"))
    .max(160, msg("form.err.tooLong"))
    .regex(/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/, msg("form.err.email")),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\+?[0-9][0-9 ().\-/]{5,22}$/.test(v), msg("form.err.phone")),
  country: z.string().trim().max(80, msg("form.err.tooLong")),
  message: z.string().trim().min(10, msg("form.err.message")).max(4000, msg("form.err.tooLong")),
  consent: z.boolean().refine((v) => v, msg("form.err.consent")),
  /** Honeypot: must stay empty. */
  website: z.string(),
});

export type InquiryValues = z.infer<typeof inquirySchema>;
