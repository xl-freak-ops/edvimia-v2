-- Roles & Permissions: admin-managed role assignment for a school.
--
-- These security-definer RPCs let a school_admin (or principal/vice_principal,
-- via is_school_admin_of) view every user in their school along with their
-- roles, and assign/revoke roles without needing direct INSERT/DELETE access
-- to user_roles (which stays locked down to "view own roles" via RLS).

CREATE OR REPLACE FUNCTION public.is_school_admin_of(_school_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND school_id = _school_id
        AND role IN ('school_admin', 'principal', 'vice_principal')
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_settings(_school_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_admin()
    OR public.is_school_admin_of(_school_id);
$$;

-- List every user belonging to a school, with their aggregated roles.
CREATE OR REPLACE FUNCTION public.admin_list_school_users(_school_id UUID)
RETURNS TABLE(user_id UUID, full_name TEXT, email TEXT, roles public.app_role[], created_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.can_manage_settings(_school_id) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
    SELECT p.id, p.full_name, p.email,
           array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL) AS roles,
           p.created_at
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id = p.id AND (ur.school_id = _school_id OR ur.school_id IS NULL)
    WHERE p.school_id = _school_id
    GROUP BY p.id, p.full_name, p.email, p.created_at
    ORDER BY p.created_at DESC;
END $$;

-- Assign a role to a user within the given school. super_admin cannot be
-- granted this way (platform-level, assigned outside the school UI).
CREATE OR REPLACE FUNCTION public.admin_assign_role(_school_id UUID, _user_id UUID, _role public.app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.can_manage_settings(_school_id) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _role = 'super_admin' THEN RAISE EXCEPTION 'Cannot assign super_admin'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND school_id = _school_id) THEN
    RAISE EXCEPTION 'User does not belong to this school';
  END IF;
  INSERT INTO public.user_roles (user_id, role, school_id)
  VALUES (_user_id, _role, _school_id)
  ON CONFLICT (user_id, role, school_id) DO NOTHING;
END $$;

-- Revoke a role from a user within the given school. Guards against
-- removing the last school_admin of a school so it can never be locked out.
CREATE OR REPLACE FUNCTION public.admin_revoke_role(_school_id UUID, _user_id UUID, _role public.app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.can_manage_settings(_school_id) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _role = 'super_admin' THEN RAISE EXCEPTION 'Cannot revoke super_admin here'; END IF;

  IF _role = 'school_admin' THEN
    IF (
      SELECT COUNT(*) FROM public.user_roles
      WHERE school_id = _school_id AND role = 'school_admin' AND user_id <> _user_id
    ) = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last school administrator';
    END IF;
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = _role AND school_id = _school_id;
END $$;

GRANT EXECUTE ON FUNCTION public.is_school_admin_of(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_settings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_school_users(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_assign_role(UUID, UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_role(UUID, UUID, public.app_role) TO authenticated;
