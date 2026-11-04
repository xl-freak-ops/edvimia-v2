-- ── RPC: get_unconfirmed_portal_users(_school_id) ──────────────────────────
-- Returns the user_id of every auth user who belongs to this school (via
-- user_roles) but has never signed in (last_sign_in_at IS NULL).
-- These are people who were invited but haven't accepted yet.
-- Runs SECURITY DEFINER to access auth.users; caller must be a school member.

CREATE OR REPLACE FUNCTION public.get_unconfirmed_portal_users(_school_id uuid)
RETURNS TABLE (user_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT ur.user_id
  FROM   public.user_roles ur
  JOIN   auth.users u ON u.id = ur.user_id
  WHERE  ur.school_id          = _school_id
    AND  u.last_sign_in_at     IS NULL
    AND  public.is_school_member(_school_id);
$$;

REVOKE EXECUTE ON FUNCTION public.get_unconfirmed_portal_users(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_unconfirmed_portal_users(uuid) TO authenticated;


-- ── RPC: get_linked_parent_emails(_student_id, _school_id) ─────────────────
-- Returns the email of every parent/guardian who has been linked to the
-- student via parent_student_links, together with whether they have ever
-- signed in.  Used to show portal-status badges on PortalAccessCard.
-- Runs SECURITY DEFINER to access auth.users.

CREATE OR REPLACE FUNCTION public.get_linked_parent_emails(
  _student_id uuid,
  _school_id  uuid
)
RETURNS TABLE (email text, is_confirmed boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    lower(u.email)::text          AS email,
    (u.last_sign_in_at IS NOT NULL) AS is_confirmed
  FROM   public.parent_student_links psl
  JOIN   auth.users u ON u.id = psl.parent_user_id
  WHERE  psl.student_id = _student_id
    AND  psl.school_id  = _school_id
    AND  public.is_school_member(_school_id);
$$;

REVOKE EXECUTE ON FUNCTION public.get_linked_parent_emails(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_linked_parent_emails(uuid, uuid) TO authenticated;
