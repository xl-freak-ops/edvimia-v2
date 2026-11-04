
-- Fix critical auth lockout: RLS policies call SECURITY DEFINER helper functions
-- but the `authenticated` role was never granted EXECUTE. Every RLS check
-- therefore returned "permission denied for function is_super_admin".
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_school_admin_of(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_school_member(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;

-- Ensure new sign-ups always get a profile + a role.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Self-service recovery: assign a role and (re)create a school workspace
-- for the calling user if either is missing. Safe for existing users to run.
CREATE OR REPLACE FUNCTION public.ensure_my_workspace(_school_name text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _school_id uuid;
  _has_role boolean;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Ensure profile row exists
  SELECT email, school_id INTO _email, _school_id FROM public.profiles WHERE id = _uid;
  IF NOT FOUND THEN
    SELECT email INTO _email FROM auth.users WHERE id = _uid;
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (_uid, COALESCE(_email, 'User'), _email);
  END IF;

  -- Ensure at least one role
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid) INTO _has_role;
  IF NOT _has_role THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'school_admin');
  END IF;

  -- Ensure school workspace
  IF _school_id IS NULL THEN
    INSERT INTO public.schools (name, school_type, country)
    VALUES (COALESCE(NULLIF(_school_name,''), 'My School'), 'secondary', 'Nigeria')
    RETURNING id INTO _school_id;

    UPDATE public.profiles SET school_id = _school_id WHERE id = _uid;
    UPDATE public.user_roles SET school_id = _school_id WHERE user_id = _uid AND school_id IS NULL;
  END IF;

  RETURN _school_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_my_workspace(text) TO authenticated;

-- Backfill: any existing user with a role but no school gets a workspace now.
DO $$
DECLARE r record; _sid uuid;
BEGIN
  FOR r IN
    SELECT p.id, COALESCE(p.full_name, p.email, 'My School') AS nm
    FROM public.profiles p
    WHERE p.school_id IS NULL
      AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id)
  LOOP
    INSERT INTO public.schools (name, school_type, country)
    VALUES (r.nm || '''s School', 'secondary', 'Nigeria')
    RETURNING id INTO _sid;
    UPDATE public.profiles SET school_id = _sid WHERE id = r.id;
    UPDATE public.user_roles SET school_id = _sid WHERE user_id = r.id AND school_id IS NULL;
  END LOOP;
END $$;
