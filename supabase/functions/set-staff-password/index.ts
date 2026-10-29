// set-staff-password — the owner sets a staff member's password.
// Deploy: supabase functions deploy set-staff-password
//
// Never targets an owner: owners change their own password on /admin/account,
// where the current one is required. The target id comes from the request body,
// so it's treated as hostile and checked against admin_profiles.
import { createClient } from "npm:@supabase/supabase-js@2";

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

  const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: caller, error: callerError } = await admin.auth.getUser(jwt);
  if (callerError || !caller.user) return json({ code: "forbidden" }, 401);
  const { data: callerProfile } = await admin
    .from("admin_profiles")
    .select("is_owner, active")
    .eq("user_id", caller.user.id)
    .maybeSingle();
  if (!callerProfile?.is_owner || !callerProfile.active) return json({ code: "forbidden" }, 403);

  let body: { user_id?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ code: "bad_request" }, 400);
  }
  const userId = typeof body.user_id === "string" ? body.user_id : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return json({ code: "bad_request" }, 400);
  if (password.length < 8) return json({ code: "weak_password" }, 400);

  const { data: target } = await admin.from("admin_profiles").select("is_owner").eq("user_id", userId).maybeSingle();
  if (!target) return json({ code: "not_found" }, 404);
  if (target.is_owner) return json({ code: "forbidden_target" }, 403);

  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) {
    if (/password/i.test(error.message)) return json({ code: "weak_password" }, 400);
    console.error("[set-staff-password] update failed", error.message);
    return json({ code: "update_failed" }, 500);
  }
  return json({ ok: true });
});
