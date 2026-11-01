// notify — e-mails opted-in staff when a website inquiry arrives. Called
// (fire-and-forget) by the visitor's browser right after submit_inquiry()
// succeeded, so the caller is anonymous: the anon key is a valid JWT and the
// default JWT verification is fine.
//
// Deploy:  supabase functions deploy notify
// Secrets: supabase secrets set RESEND_API_KEY=re_...
//          [RESEND_FROM=Horizon Auto Export <noreply@your-domain>]  [SITE_ADMIN_URL=https://your-domain/admin]
//
// Safety: each inquiry is CLAIMED at most once (claim_inquiry_notification,
// 0005_notifications.sql), so a replay or a guessed reference gets "nothing to
// claim" and reveals nothing. Every exit path logs one line — the browser
// swallows errors, so this log is the only diagnostic. booted -> shutdown with
// no [notify] line = the POST never arrived (CORS preflight), not a Resend problem.
//
// Self-contained on purpose (no ../_shared import: the deploy bundler doesn't
// reliably include sibling folders).
import { createClient } from "npm:@supabase/supabase-js@2";

// Exactly the headers supabase-js sends — no custom x-* headers anywhere.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

/** Secrets pasted into the dashboard often keep the shell's quotes — strip them. */
function senderAddress(): string {
  const raw = (Deno.env.get("RESEND_FROM") ?? "").trim().replace(/^(["'])(.*)\1$/, "$2").trim();
  return raw || "Horizon Auto Export <onboarding@resend.dev>";
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

async function sendEmail(to: string, subject: string, html: string, replyTo: string): Promise<void> {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) throw new Error("resend_missing_key");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: senderAddress(), to: [to], subject, html, reply_to: replyTo }),
  });
  if (!res.ok) throw new Error(`resend_${res.status}: ${await res.text()}`);
}

const KIND_LABEL: Record<string, string> = {
  general: "Întrebare generală",
  vehicle: "Informații despre un vehicul",
  availability: "Verificare disponibilitate",
  delivery: "Solicitare de livrare",
  // subjects of the first form version (older rows)
  sourcing: "Căutare vehicul / flotă",
  sell: "Vânzare către noi",
  export: "Export / transport",
};

interface ClaimedInquiry {
  reference: string;
  kind: string;
  vehicle_label: string | null;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  country: string | null;
  message: string;
  language: string;
  created_at: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ code: "bad_request" }, 405);

  let body: { kind?: unknown; reference?: unknown };
  try {
    body = await req.json();
  } catch {
    console.info("[notify] bad json");
    return json({ code: "bad_request" }, 400);
  }
  if (body.kind !== "inquiry") {
    console.info("[notify] unknown kind");
    return json({ code: "bad_request" }, 400);
  }
  const reference = typeof body.reference === "string" ? body.reference : "";
  // Same shape submit_inquiry() generates; anything else is noise.
  if (!/^HAE-\d{6}-[0-9A-F]{10}$/.test(reference)) {
    console.info("[notify] malformed reference");
    return json({ ok: true });
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin.rpc("claim_inquiry_notification", { p_reference: reference });
  if (error) {
    console.info("[notify] claim failed", error.message);
    return json({ ok: false }, 500);
  }
  const row = (Array.isArray(data) ? data[0] : null) as ClaimedInquiry | null;
  if (!row) {
    console.info("[notify] nothing to claim");
    return json({ ok: true });
  }

  const adminUrl = (Deno.env.get("SITE_ADMIN_URL") ?? "").replace(/\/+$/, "");
  const subject = `Cerere nouă — ${row.name}${row.company ? ` (${row.company})` : ""} · ${KIND_LABEL[row.kind] ?? row.kind}`;
  const lines: Array<[string, string | null]> = [
    ["Referință", row.reference],
    ["Subiect", KIND_LABEL[row.kind] ?? row.kind],
    ["Vehicul", row.vehicle_label],
    ["Nume", row.name],
    ["Companie", row.company],
    ["E-mail", row.email],
    ["Telefon", row.phone],
    ["Țară", row.country],
    ["Limba site-ului", row.language.toUpperCase()],
  ];
  const html = `<div style="font-family:Arial,sans-serif;color:#08193d">
    <h2 style="margin:0 0 12px">Cerere nouă de pe site</h2>
    <table style="border-collapse:collapse">${lines
      .filter((l): l is [string, string] => Boolean(l[1]))
      .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#56627d">${k}</td><td style="padding:4px 0"><b>${escapeHtml(v)}</b></td></tr>`)
      .join("")}</table>
    <p style="margin:16px 0 4px;color:#56627d">Mesaj</p>
    <p style="white-space:pre-line;background:#f5f6f9;padding:12px;border-left:3px solid #a77c38">${escapeHtml(row.message)}</p>
    ${adminUrl ? `<p><a href="${escapeHtml(adminUrl)}/inquiries" style="color:#a77c38">Deschide în panoul de administrare</a></p>` : ""}
  </div>`;

  const { data: recipients, error: recipientsError } = await admin
    .from("admin_notification_prefs")
    .select("notify_email, admin_profiles!inner(active)")
    .eq("email_enabled", true)
    .eq("admin_profiles.active", true);
  if (recipientsError) {
    console.info("[notify] recipients query failed", recipientsError.message);
    return json({ ok: false }, 500);
  }
  const emails = [
    ...new Set(
      (recipients ?? [])
        .map((r) => (r as { notify_email: string | null }).notify_email)
        .filter((e): e is string => Boolean(e)),
    ),
  ];
  if (emails.length === 0) {
    console.info("[notify] no recipient has email notifications enabled");
    return json({ ok: true, sent: 0 });
  }

  // One recipient's failure must never block another's. Reply-To = the inquirer.
  const results = await Promise.allSettled(emails.map((to) => sendEmail(to, subject, html, row.email)));
  const sent = results.filter((r) => r.status === "fulfilled").length;
  for (const r of results) if (r.status === "rejected") console.info("[notify] send failed:", String(r.reason));
  console.info(`[notify] sent ${sent}/${emails.length}`);
  return json({ ok: true, sent });
});
