// Edvimia · delete-student edge function
// Fully removes a student and all related data:
//   1. Deletes student_guardians and student_documents
//   2. Collects linked parent/self portal accounts via parent_student_links
//   3. Deletes the students row (cascades parent_student_links, homework_submissions)
//   4. Removes user_roles for the student's own auth user
//   5. Deletes student auth user from auth.users if no remaining roles
//   6. For parents linked ONLY to this student: removes their roles + auth user if no remaining roles
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function purgeAuthUserIfOrphaned(
  admin: ReturnType<typeof createClient>,
  userId: string,
) {
  const { data: remaining } = await admin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (!remaining || remaining.length === 0) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) console.error("Could not delete auth user:", userId, error.message);
  }
}

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
    const { student_id, school_id } = body as {
      student_id?: string;
      school_id?: string;
    };

    if (!student_id) return json({ error: "student_id is required" }, 400);
    if (!school_id)  return json({ error: "school_id is required" }, 400);

    // Confirm caller is school_admin, principal, vice_principal, or super_admin
    const { data: roleRows } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .in("role", ["school_admin", "super_admin", "principal", "vice_principal"])
      .limit(1);

    const roleRow = roleRows?.[0] ?? null;
    if (!roleRow) return json({ error: "Forbidden: insufficient permissions" }, 403);

    if (roleRow.role !== "super_admin") {
      const { data: callerProfile } = await admin
        .from("profiles")
        .select("school_id")
        .eq("id", callerId)
        .maybeSingle();
      if (!callerProfile || callerProfile.school_id !== school_id) {
        return json({ error: "Forbidden: not an admin of this school" }, 403);
      }
    }

    // Fetch the student record — get their own portal auth user_id
    const { data: studentRow, error: studentErr } = await admin
      .from("students")
      .select("id, user_id")
      .eq("id", student_id)
      .eq("school_id", school_id)
      .maybeSingle();

    if (studentErr) return json({ error: studentErr.message }, 500);
    if (!studentRow) return json({ error: "Student not found" }, 404);

    const studentUserId: string | null = studentRow.user_id ?? null;

    // Collect all portal accounts linked to this student BEFORE deletion cascades them
    // This includes the student's own "Self" link and all parent links
    const { data: links } = await admin
      .from("parent_student_links")
      .select("parent_user_id, relationship")
      .eq("student_id", student_id);

    const linkedUserIds: string[] = (links ?? []).map((l: any) => l.parent_user_id as string);

    // For each linked parent user (not the student themselves), check how many
    // OTHER children they are linked to — we only clean up if this is their only child
    const parentUserIdsToMaybeClean: string[] = [];
    for (const uid of linkedUserIds) {
      if (uid === studentUserId) continue; // student's own link handled separately
      const { data: otherLinks } = await admin
        .from("parent_student_links")
        .select("id")
        .eq("parent_user_id", uid)
        .neq("student_id", student_id)
        .limit(1);
      if (!otherLinks || otherLinks.length === 0) {
        parentUserIdsToMaybeClean.push(uid);
      }
    }

    // 1. Delete student_guardians and student_documents (no cascade from students)
    await admin.from("student_guardians").delete().eq("student_id", student_id);
    await admin.from("student_documents").delete().eq("student_id", student_id);

    // 2. Delete the students row — cascades: parent_student_links, homework_submissions
    const { error: delErr } = await admin
      .from("students")
      .delete()
      .eq("id", student_id);
    if (delErr) return json({ error: delErr.message }, 500);

    // 3. Clean up the student's own portal auth user (if any)
    if (studentUserId) {
      await admin.from("user_roles").delete().eq("user_id", studentUserId);
      await purgeAuthUserIfOrphaned(admin, studentUserId);
    }

    // 4. Clean up parents who were linked only to this student
    for (const uid of parentUserIdsToMaybeClean) {
      await admin
        .from("user_roles")
        .delete()
        .eq("user_id", uid)
        .eq("school_id", school_id);
      await purgeAuthUserIfOrphaned(admin, uid);
    }

    return json({ ok: true });
  } catch (e: any) {
    return json({ error: e?.message ?? "Unexpected error" }, 500);
  }
});
