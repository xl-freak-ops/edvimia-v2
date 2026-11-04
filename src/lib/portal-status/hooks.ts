/**
 * Hooks for querying portal / invitation status.
 *
 * Both RPCs are SECURITY DEFINER so they can read auth.users without
 * exposing that table to the client directly.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/**
 * Returns a Set of user_ids belonging to this school who have NEVER signed
 * in — i.e. their invitation is still pending / not accepted.
 */
export function useUnconfirmedPortalUsers(schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!schoolId,
    queryKey: ["unconfirmed-portal-users", schoolId],
    queryFn: async () => {
      const { data, error } = await db.rpc("get_unconfirmed_portal_users", {
        _school_id: schoolId!,
      });
      if (error) throw error;
      return new Set<string>((data ?? []).map((r: { user_id: string }) => r.user_id));
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Returns a Map of { lowercased-email → isConfirmed } for all parents
 * already linked to a student via parent_student_links.
 * isConfirmed = true  → they have logged in at least once.
 * isConfirmed = false → invite sent but never accepted.
 * email absent        → no portal invite sent yet.
 */
export function useLinkedParentEmails(
  studentId: string | null | undefined,
  schoolId: string | null | undefined,
) {
  return useQuery({
    enabled: !!studentId && !!schoolId,
    queryKey: ["linked-parent-emails", studentId, schoolId],
    queryFn: async () => {
      const { data, error } = await db.rpc("get_linked_parent_emails", {
        _student_id: studentId!,
        _school_id: schoolId!,
      });
      if (error) throw error;
      const map = new Map<string, boolean>();
      (data ?? []).forEach((r: { email: string; is_confirmed: boolean }) => {
        map.set(r.email.toLowerCase(), r.is_confirmed);
      });
      return map;
    },
    staleTime: 2 * 60 * 1000,
  });
}
