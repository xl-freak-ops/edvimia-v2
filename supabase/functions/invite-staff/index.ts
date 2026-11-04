// Edvimia · invite-staff edge function
// Handles three invite types via a single endpoint:
//   1. Staff (teacher/admin)  — position param
//   2. Parent portal          — portal_role: "parent", student_id, relationship
//   3. Student portal         — portal_role: "student", student_id
// Uses the service-role key to call auth.admin.inviteUserByEmail, then
// pre-provisions the profile + user_role (and parent_student_links for
// parent/student) so the AuthProvider self-heal works on first login.
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
    const service    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authenticate the caller
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "Missing token" }, 401);

    const admin = createClient(supabaseUrl, service, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: uErr } = await admin.auth.getUser(jwt);
    if (uErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const callerId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const {
      email, full_name, school_id, redirect_to,
      // Staff-specific
      position,
      // Parent/student-specific
      portal_role, student_id, relationship,
    } = body as {
      email?: string;
      full_name?: string;
      school_id?: string;
      redirect_to?: string;
      position?: string;
      portal_role?: "parent" | "student";
      student_id?: string;
      relationship?: string;
    };

    if (!email)     return json({ error: "email is required" }, 400);
    if (!school_id) return json({ error: "school_id is required" }, 400);

    // Confirm caller is a school_admin or super_admin for this school.
    const { data: roleRows } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .in("role", ["school_admin", "super_admin", "principal"])
      .limit(1);

    const roleRow = roleRows?.[0] ?? null;
    if (!roleRow) return json({ error: "Forbidden: not a school admin" }, 403);

    if (roleRow.role === "school_admin" || roleRow.role === "principal") {
      const { data: callerProfile } = await admin
        .from("profiles")
        .select("school_id")
        .eq("id", callerId)
        .maybeSingle();
      if (!callerProfile || callerProfile.school_id !== school_id) {
        return json({ error: "Forbidden: not an admin of this school" }, 403);
      }
    }

    // Determine the role to assign
    let assignedRole: string;
    if (portal_role === "parent") {
      if (!student_id) return json({ error: "student_id is required for parent invite" }, 400);
      assignedRole = "parent";
    } else if (portal_role === "student") {
      if (!student_id) return json({ error: "student_id is required for student invite" }, 400);
      assignedRole = "student";
    } else {
      // Staff invite path
      const POSITION_TO_ROLE: Record<string, string> = {
        principal: "principal",
        vice_principal: "vice_principal",
        school_admin: "school_admin",
        form_teacher: "form_teacher",
        subject_teacher: "subject_teacher",
      };
      assignedRole = POSITION_TO_ROLE[position ?? ""] ?? "subject_teacher";
    }

    // Send the invite — Supabase creates the auth user in 'invited' state
    const { data: inviteData, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
      email,
      {
        data: { full_name: full_name ?? null, school_id, initial_role: assignedRole },
        ...(redirect_to ? { redirectTo: redirect_to } : {}),
      },
    );

    let invitedUserId: string;

    if (inviteErr) {
      const alreadyExists = inviteErr.message.toLowerCase().includes("already") ||
        (inviteErr as any).status === 422;
      if (!alreadyExists) return json({ error: inviteErr.message }, 500);

      // User already exists — find them and grant access
      const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const existing = list?.users?.find((u: any) => u.email === email);
      if (!existing) return json({ error: inviteErr.message }, 500);
      invitedUserId = existing.id;
    } else {
      invitedUserId = inviteData.user.id;
    }

    await provisionAccess(
      admin, invitedUserId, full_name ?? null, email,
      school_id, assignedRole, student_id, relationship,
    );

    return json({ ok: true, invited: !inviteErr });

  } catch (e: any) {
    return json({ error: e?.message ?? "Unexpected error" }, 500);
  }
});

async function provisionAccess(
  admin: ReturnType<typeof createClient>,
  userId: string,
  full_name: string | null,
  email: string,
  school_id: string,
  role: string,
  student_id?: string,
  relationship?: string,
) {
  // Upsert profile
  await admin.from("profiles").upsert(
    { id: userId, full_name, email, school_id },
    { onConflict: "id" },
  );

  // Insert scoped role (ignore duplicate)
  const { error: roleErr } = await admin.from("user_roles")
    .insert({ user_id: userId, role, school_id });
  if (roleErr && !roleErr.message.toLowerCase().includes("duplicate") &&
      !roleErr.message.toLowerCase().includes("unique")) {
    throw new Error(`Role assignment failed: ${roleErr.message}`);
  }

  // For parent/student, link them to the student record
  if ((role === "parent" || role === "student") && student_id) {
    const { error: linkErr } = await admin.from("parent_student_links").upsert(
      {
        school_id,
        parent_user_id: userId,
        student_id,
        relationship: role === "student" ? "Self" : (relationship ?? "Guardian"),
        is_primary: role === "parent",
      },
      { onConflict: "parent_user_id,student_id" },
    );
    if (linkErr && !linkErr.message.toLowerCase().includes("duplicate") &&
        !linkErr.message.toLowerCase().includes("unique")) {
      throw new Error(`Link failed: ${linkErr.message}`);
    }
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
