-- RPC: get_school_members(_school_id)
--
-- Returns all people in the school for the recipient picker.
-- has_portal = true  → has an auth account; can receive in-app messages.
-- has_portal = false → student record only (no portal account); shown in
--                      search for reference but cannot be messaged in-app.
--
-- Caller must be a member of the school (enforced via is_school_member).
-- Runs SECURITY DEFINER so it can read across profiles, auth.users, and
-- students rows without being blocked by row-level security.

CREATE OR REPLACE FUNCTION public.get_school_members(_school_id uuid)
RETURNS TABLE (
  id         uuid,
  full_name  text,
  email      text,
  avatar_url text,
  role       text,
  has_portal boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$

  -- ── Branch 1: auth-account holders (staff / admin / parent / student-with-portal) ──
  SELECT
    u.id,
    COALESCE(
      NULLIF(trim(p.full_name), ''),
      u.raw_user_meta_data->>'full_name',
      u.email
    )::text                                                         AS full_name,
    COALESCE(NULLIF(trim(p.email), ''), u.email)::text              AS email,
    p.avatar_url,
    (
      SELECT ur2.role::text
      FROM   public.user_roles ur2
      WHERE  ur2.user_id   = u.id
        AND  ur2.school_id = _school_id
      ORDER  BY ur2.role::text
      LIMIT  1
    )                                                               AS role,
    true                                                            AS has_portal
  FROM (
    SELECT DISTINCT user_id
    FROM   public.user_roles
    WHERE  school_id = _school_id
  ) members
  JOIN      auth.users    u ON u.id = members.user_id
  LEFT JOIN public.profiles p ON p.id = members.user_id
  WHERE public.is_school_member(_school_id)

  UNION

  -- ── Branch 2: active students from the students table ──────────────────────
  -- Students already in Branch 1 (they have a user_roles row) are excluded.
  -- has_portal = (user_id IS NOT NULL)
  SELECT
    COALESCE(s.user_id, s.id)                 AS id,
    (s.first_name || ' ' || s.surname)::text  AS full_name,
    s.email,
    s.photo_url                               AS avatar_url,
    'student'::text                           AS role,
    (s.user_id IS NOT NULL)                   AS has_portal
  FROM public.students s
  WHERE s.school_id = _school_id
    AND s.status    = 'active'
    AND public.is_school_member(_school_id)
    AND (
      s.user_id IS NULL
      OR NOT EXISTS (
        SELECT 1
        FROM   public.user_roles ur3
        WHERE  ur3.school_id = _school_id
          AND  ur3.user_id   = s.user_id
      )
    )

  ORDER BY full_name;
$$;

REVOKE EXECUTE ON FUNCTION public.get_school_members(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_school_members(uuid) TO authenticated;
