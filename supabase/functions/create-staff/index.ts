// create-staff — the owner creates a staff account with per-section access.
// Deploy: supabase functions deploy create-staff
//
// Self-contained on purpose (no ../_shared import: the deploy bundler doesn't
// reliably include sibling folders). SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// are injected by Supabase; the service-role key never reaches the browser.
import { createClient } from "npm:@supabase/supabase-js@2";

// KEEP IN SYNC with src/pages/admin/adminSections.ts and has_section('…') in the
// migrations. A key missing here is granted in the UI and silently dropped on save.
const ALLOWED_SECTIONS = new Set(["vehicles", "inquiries", "brands", "settings"]);

// Exactly the headers supabase-js sends — no custom x-* headers anywhere.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ code: "bad_request" }, 405);

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // 1. The caller must be an active OWNER.
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: caller, error: callerError } = await admin.auth.getUser(jwt);
  if (callerError || !caller.user) return json({ code: "forbidden" }, 401);
  const { data: callerProfile } = await admin
    .from("admin_profiles")
    .select("is_owner, active")
    .eq("user_id", caller.user.id)
    .maybeSingle();
  if (!callerProfile?.is_owner || !callerProfile.active) return json({ code: "forbidden" }, 403);

  // 2. Validate the body (client input — filter, never trust).
  let body: { email?: unknown; password?: unknown; full_name?: unknown; sections?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ code: "bad_request" }, 400);
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const fullName = typeof body.full_name === "string" ? body.full_name.trim().slice(0, 80) : "";
  const sections = Array.isArray(body.sections)
    ? [...new Set(body.sections.filter((s): s is string => typeof s === "string" && ALLOWED_SECTIONS.has(s)))]
    : [];
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ code: "bad_request" }, 400);
  if (password.length < 8) return json({ code: "weak_password" }, 400);

  // 3. Create the auth user, confirmed (staff have no inbox flow).
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createError || !created.user) {
    const msg = createError?.message ?? "";
    if (/already|registered|exists/i.test(msg)) return json({ code: "email_exists" }, 409);
    if (/password/i.test(msg)) return json({ code: "weak_password" }, 400);
    console.error("[create-staff] create failed", msg);
    return json({ code: "create_failed" }, 500);
  }

  // 4. Profile row — roll the auth user back if this fails, or it can log in to a
  //    "no access" screen forever and blocks the e-mail from being reused.
  const { error: profileError } = await admin.from("admin_profiles").insert({
    user_id: created.user.id,
    email,
    full_name: fullName || null,
    is_owner: false,
    sections,
    active: true,
  });
  if (profileError) {
    console.error("[create-staff] profile failed", profileError.message);
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ code: "profile_failed" }, 500);
  }

  return json({ user_id: created.user.id });
});
