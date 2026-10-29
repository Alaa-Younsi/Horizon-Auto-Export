import { supabase } from "./supabase";

type NotifyBody = { kind: "inquiry"; reference: string };

/**
 * Fire-and-forget staff notification (supabase/functions/notify). Runs AFTER the
 * visitor's write succeeded; a failure here (function not deployed, mail
 * provider down) must never reach the visitor or undo their submission.
 * The function claims each row at most once, so a retry or replay is harmless.
 */
export function notifyStaff(body: NotifyBody): void {
  if (!supabase) return;
  supabase.functions.invoke("notify", { body }).catch(() => {
    // Diagnostics live in the function's log, by design.
  });
}
