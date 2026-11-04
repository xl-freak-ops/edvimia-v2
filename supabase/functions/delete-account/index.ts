// Edvimia · delete-account edge function
// Permanently removes the caller's workspace: school (cascade), profile, roles, and auth user.
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "Missing token" }, 401);

    const admin = createClient(supabaseUrl, service, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Identify caller
    const { data: userData, error: uErr } = await admin.auth.getUser(jwt);
    if (uErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const password = String(body?.password ?? "");
    const confirmation = String(body?.confirmation ?? "");
    if (confirmation !== "DELETE") return json({ error: "Please type DELETE to confirm." }, 400);
    if (!password) return json({ error: "Password is required." }, 400);
    if (!user.email) return json({ error: "No email on file." }, 400);

    // Verify password by re-authenticating
    const verifier = createClient(supabaseUrl, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: pwErr } = await verifier.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (pwErr) return json({ error: "Incorrect password." }, 403);

    // Find caller profile / school
    const { data: profile } = await admin
      .from("profiles")
      .select("id, school_id")
      .eq("id", user.id)
      .maybeSingle();

    // Delete school workspace (cascades to students, staff, subjects, etc.)
    if (profile?.school_id) {
      await admin.from("schools").delete().eq("id", profile.school_id);
    }

    // Roles & profile (belt & braces)
    await admin.from("user_roles").delete().eq("user_id", user.id);
    await admin.from("profiles").delete().eq("id", user.id);

    // Auth user (revokes sessions & tokens)
    const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
    if (delErr) return json({ error: delErr.message }, 500);

    return json({ ok: true });
  } catch (e: any) {
    return json({ error: e?.message ?? "Unexpected error" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}